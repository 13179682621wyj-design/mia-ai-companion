const MODEL = 'gemini-3-flash-preview';
const SYSTEM = `你是 MIA（My Insight Assistant），一位温柔、理性、清晰的 AI 决策陪伴助手。你帮助用户通过持续对话理解需求、梳理利弊、识别风险、明确个人价值和可执行的下一步。你不是占卜师或心理治疗师。不要宣称预测未来，也不要替用户做最终决定。用用户使用的语言回复。避免空洞的安慰、冗长报告或机械地每轮提问。先针对用户提供的信息作出有价值的回应，必要时只追问一两个关键问题。可以用简短段落、**重点**和项目符号列表，通常不超过350字。卡牌仅是反思线索，不应作为事实证据。遇到心理危机，优先建议寻求现实中的紧急支持。`;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'仅支持 POST'});
 const {message,history,mode}=req.body||{};
 if(typeof message!=='string'||!message.trim()||message.length>1200)return res.status(400).json({error:'请输入 1–1200 字的问题'});
 const key=process.env.GEMINI_API_KEY;
 if(!key)return res.status(503).json({error:'请先在 Vercel 配置 GEMINI_API_KEY'});
 const cleaned=Array.isArray(history)?history.slice(-12).filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.content==='string').map(x=>({role:x.role==='assistant'?'model':'user',parts:[{text:x.content.slice(0,1200)}]})):[];
 // The frontend already includes the latest user message in history. Do not duplicate it.
 if(cleaned.length&&cleaned[cleaned.length-1].role==='user'&&cleaned[cleaned.length-1].parts[0].text===message)cleaned.pop();
 const contents=[...cleaned,{role:'user',parts:[{text:message}]}];
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),28000);
 try{
  const upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{
   method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal:controller.signal,
   body:JSON.stringify({systemInstruction:{parts:[{text:SYSTEM+(mode==='summary'?' 这次回复请整理成「目前最在意的因素」「选项与代价」「仍需确认」「下一小步」四部分。':'')} ]},contents,generationConfig:{temperature:.65,maxOutputTokens:1100}})
  });
  if(!upstream.ok){let e={};try{e=(await upstream.json()).error||{}}catch{}console.error('Gemini API error',{status:upstream.status,type:e.status,message:e.message});if(upstream.status===429)return res.status(429).json({error:'今日免费调用额度或频率限制已达到，请稍后再试'});return res.status(502).json({error:'AI 服务暂时不可用，请稍后再试',upstreamStatus:upstream.status})}
  const data=await upstream.json();const reply=(data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
  if(!reply)return res.status(502).json({error:'AI 没有返回有效文本，请换一种问法'});
  return res.status(200).json({reply});
 }catch(e){console.error('Gemini connection error',e.name,e.message);return res.status(e.name==='AbortError'?504:502).json({error:e.name==='AbortError'?'AI 响应超时，请稍后再试':'暂时无法连接 AI，请稍后再试'})}finally{clearTimeout(timeout)}
}
