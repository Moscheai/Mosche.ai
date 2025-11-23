// Cloudflare Worker — Gradient Edition backend
// Bind secrets: OPENAI_API_KEY, HUGGINGFACE_API_KEY
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const CORS = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'GET,HEAD,POST,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type'
};

async function handleRequest(req){
  if(req.method === 'OPTIONS') return new Response(null,{status:204,headers:CORS});
  const url = new URL(req.url);
  if(req.method !== 'POST') return new Response('Not found',{status:404,headers:CORS});
  try{
    if(url.pathname.endsWith('/generate-image')){
      const {prompt,size='512'} = await req.json();
      const hfRes = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
        method:'POST',
        headers:{'Authorization':`Bearer ${HUGGINGFACE_API_KEY}`,'Content-Type':'application/json'},
        body: JSON.stringify({inputs: prompt, options:{wait_for_model:true}})
      });
      if(!hfRes.ok){ const txt = await hfRes.text(); return new Response(JSON.stringify({error:txt}),{status:502,headers:Object.assign({'Content-Type':'application/json'},CORS)}); }
      const buffer = await hfRes.arrayBuffer();
      const b64 = arrayBufferToBase64(buffer);
      const dataUrl = 'data:image/png;base64,'+b64;
      return new Response(JSON.stringify({image:dataUrl}),{status:200,headers:Object.assign({'Content-Type':'application/json'},CORS)});
    }

    if(url.pathname.endsWith('/generate-video')){
      const {prompt,frames=8} = await req.json();
      const n = Math.min(Math.max(parseInt(frames)||8,3),24);
      const framesArr = [];
      for(let i=0;i<n;i++){
        const framePrompt = `${prompt} — cinematic motion, frame ${i+1} of ${n}`;
        const hfRes = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
          method:'POST',
          headers:{'Authorization':`Bearer ${HUGGINGFACE_API_KEY}`,'Content-Type':'application/json'},
          body: JSON.stringify({inputs: framePrompt, options:{wait_for_model:true}})
        });
        if(!hfRes.ok){ const txt = await hfRes.text(); return new Response(JSON.stringify({error:txt}),{status:502,headers:Object.assign({'Content-Type':'application/json'},CORS)}); }
        const buffer = await hfRes.arrayBuffer();
        const b64 = arrayBufferToBase64(buffer);
        framesArr.push('data:image/png;base64,'+b64);
      }
      return new Response(JSON.stringify({frames:framesArr}),{status:200,headers:Object.assign({'Content-Type':'application/json'},CORS)});
    }

    if(url.pathname.endsWith('/upscale')){
      const {image,factor=2} = await req.json();
      // A simple placeholder that returns same image — replace with real upscaler model or service
      return new Response(JSON.stringify({image}),{status:200,headers:Object.assign({'Content-Type':'application/json'},CORS)});
    }

    if(url.pathname.endsWith('/generate-text')){
      const {prompt} = await req.json();
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${OPENAI_API_KEY}`},
        body: JSON.stringify({model:'gpt-4o-mini', messages:[{role:'user',content:prompt}], max_tokens:600})
      });
      const data = await openaiRes.json();
      if(!openaiRes.ok) return new Response(JSON.stringify({error:data.error?.message || 'OpenAI error'}),{status:502,headers:Object.assign({'Content-Type':'application/json'},CORS)});
      const text = data.choices?.[0]?.message?.content || '';
      return new Response(JSON.stringify({text}),{status:200,headers:Object.assign({'Content-Type':'application/json'},CORS)});
    }

    return new Response('Not found',{status:404,headers:CORS});
  }catch(err){
    return new Response(JSON.stringify({error:err.message}),{status:500,headers:Object.assign({'Content-Type':'application/json'},CORS)});
  }
}

function arrayBufferToBase64(buffer){
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for(let i=0;i<len;i++){
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
