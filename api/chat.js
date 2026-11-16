const MODEL = 'gemini-2.5-flash';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'仅支持 POST 请求'});
  const message = req.body?.message;
  if (typeof message !== 'string' || !message.trim() || message.length > 1200)
    return res.status(400).json({error:'请输入 1–1200 字的问题'});
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({error:'管理员尚未配置 Gemini API Key'});
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method:'POST',
      headers:{'Content-Type':'application/json','x-goog-api-key':key},
      body:JSON.stringify({
        systemInstruction:{parts:[{text:'你是 MIA，一位温柔、清晰的 AI 决策陪伴助手。用用户的语言回答，优先中文。先理解困扰，再帮助用户厘清最重要的考量、选择的利弊和可执行的下一步。不要代替用户决定，不要声称能预测未来，不要假装是心理治疗师。简洁、具体，最多约250字。'}]},
        contents:[{role:'user',parts:[{text:message}]}],
        generationConfig:{maxOutputTokens:650,temperature:0.65}
      }),signal:controller.signal
    });
    if (upstream.status === 429) return res.status(429).json({error:'今天的免费调用额度可能已用完，请稍后再试'});
    if (!upstream.ok) return res.status(502).json({error:'AI 服务暂时不可用，请检查模型权限或稍后再试'});
    const data=await upstream.json();
    const reply=(data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
    if(!reply) return res.status(502).json({error:'AI 未返回有效内容，请换一种问法'});
    return res.status(200).json({reply});
  } catch(e){return res.status(502).json({error:'连接超时或网络异常，请稍后再试'});}
  finally{clearTimeout(timeout)}
}
