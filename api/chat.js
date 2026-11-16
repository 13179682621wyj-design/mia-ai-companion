
const MODEL = "gemini-2.5-flash";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // 1. 只允许 POST 请求
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "仅支持 POST 请求"
    });
  }

  // 2. 检查用户输入
  const message = req.body?.message;

  if (
    typeof message !== "string" ||
    !message.trim() ||
    message.length > 1200
  ) {
    return res.status(400).json({
      error: "请输入 1–1200 字的问题"
    });
  }

  // 3. 从 Vercel 环境变量读取 API Key
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    console.error("Missing GEMINI_API_KEY");

    return res.status(503).json({
      error: "管理员尚未配置 Gemini API Key"
    });
  }

  // 4. 设置请求超时
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 20000);

  try {
    // 5. 调用 Gemini API
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key
        },

        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `你是 MIA，一位温柔、清晰的 AI 决策陪伴助手。

请使用用户的语言回答，优先中文。

你的任务是：
1. 理解用户的困扰。
2. 帮助用户明确最重要的考虑因素。
3. 分析不同选择的优点和缺点。
4. 提供具体、可执行的下一步建议。

不要替用户做最终决定。
不要声称能够预测未来。
不要假装自己是心理治疗师。

回答温柔、自然、简洁，尽量控制在250字左右。`
              }
            ]
          },

          contents: [
            {
              role: "user",
              parts: [
                {
                  text: message.trim()
                }
              ]
            }
          ],

          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.65
          }
        }),

        signal: controller.signal
      }
    );

    // 6. 处理 Gemini API 错误
    if (!upstream.ok) {
      const errorBody = await upstream.text();

      let googleError = {};

      try {
        googleError = JSON.parse(errorBody).error || {};
      } catch {
        googleError = {
          message: "Unable to parse upstream error"
        };
      }

      // 只记录必要诊断信息，不记录 API Key
      console.error("Gemini API error:", {
        status: upstream.status,
        code: googleError.code,
        type: googleError.status,
        message: googleError.message
      });

      if (upstream.status === 429) {
        return res.status(429).json({
          error: "Gemini 免费额度或请求频率已达到限制，请稍后再试",
          upstreamStatus: 429
        });
      }

      return res.status(502).json({
        error: "Gemini API 调用失败，请查看 Vercel 日志",
        upstreamStatus: upstream.status,
        errorType: googleError.status || "UNKNOWN"
      });
    }

    // 7. 解析 Gemini 返回内容
    const data = await upstream.json();

    const reply = (
      data.candidates?.[0]?.content?.parts || []
    )
      .map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      console.error("Gemini returned empty response", {
        finishReason: data.candidates?.[0]?.finishReason
      });

      return res.status(502).json({
        error: "AI 未返回有效内容，请换一种问法"
      });
    }

    // 8. 返回成功结果
    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Gemini connection error:", {
      name: error?.name,
      message: error?.message
    });

    if (error?.name === "AbortError") {
      return res.status(504).json({
        error: "AI 响应超时，请稍后再试"
      });
    }

    return res.status(502).json({
      error: "连接 Gemini 失败，请查看 Vercel 日志"
    });

  } finally {
    clearTimeout(timeout);
  }
}
