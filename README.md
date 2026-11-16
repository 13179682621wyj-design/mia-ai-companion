# MIA 2.0 — Gemini + Vercel

1. 将整个项目上传到 GitHub 新仓库（根目录含 index.html 和 api 文件夹）。
2. 在 Vercel New Project 导入 GitHub 仓库，Framework Preset 选 Other，Root Directory 保持 ./。
3. Settings > Environment Variables 添加 GEMINI_API_KEY（值是你自己的完整密钥，切勿提交到 GitHub）。
4. Deploy / Redeploy。访问生成的 .vercel.app 地址测试决策助手。

默认模型 gemini-2.5-flash，可在 api/chat.js 第一行修改。
注意：本项目为作品集演示版；只有基本输入限制和错误处理，没有跨实例的可靠访问限流。公开大范围传播前请配置持久化限流、监控和额度保护。Gemini 免费层的数据处理规则请以官方条款为准，不要输入敏感信息。
