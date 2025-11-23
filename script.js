// Main frontend script - Gradient Edition
function el(id){return document.getElementById(id)}
async function postJSON(path, body){
  const res = await fetch(BACKEND_URL + path, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  return res.json();
}

// Image generation
el('img-btn').addEventListener('click', async ()=>{
  const prompt = el('img-prompt').value.trim();
  const size = el('img-size').value;
  const out = el('img-result');
  if(!prompt){alert('Please enter a prompt');return;}
  out.innerHTML = '<p>Generating image…</p>';
  try{
    const data = await postJSON('/generate-image', {prompt, size});
    if(data.error) { out.innerHTML = `<p>Error: ${data.error}</p>`; return;}
    out.innerHTML = `<img src="${data.image}" alt="AI image">`;
  }catch(e){ out.innerHTML = '<p>Generation failed</p>'; console.error(e) }
});

// Upscale (2x)
el('upscale-btn').addEventListener('click', async ()=>{
  const imgEl = el('img-result').querySelector('img');
  if(!imgEl){ alert('No image to upscale'); return;}
  const out = el('img-result');
  out.innerHTML = '<p>Upscaling…</p>';
  try{
    const data = await postJSON('/upscale', {image: imgEl.src, factor:2});
    if(data.error){ out.innerHTML = `<p>Error: ${data.error}</p>`; return;}
    out.innerHTML = `<img src="${data.image}" alt="Upscaled image">`;
  }catch(e){ out.innerHTML = '<p>Upscale failed</p>'; console.error(e) }
});

// Video generation (frames -> GIF or MP4)
el('vid-btn').addEventListener('click', async ()=>{
  const prompt = el('vid-prompt').value.trim();
  const frames = parseInt(el('vid-frames').value)||8;
  const out = el('vid-result');
  if(!prompt){alert('Enter a prompt');return;}
  out.innerHTML = '<p>Generating frames…</p>';
  try{
    const data = await postJSON('/generate-video', {prompt, frames});
    if(data.error){ out.innerHTML = `<p>Error: ${data.error}</p>`; return;}
    // data.frames = array of data URLs
    out.innerHTML = '<p>Assembling video…</p>';
    // simple client-side assembly to GIF using built-in canvas (very small)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgs = [];
    for(const src of data.frames){
      const img = new Image();
      img.src = src;
      await new Promise(r=> img.onload = r);
      imgs.push(img);
    }
    canvas.width = imgs[0].naturalWidth;
    canvas.height = imgs[0].naturalHeight;
    // create a WebM via MediaRecorder (works in modern browsers)
    const stream = canvas.captureStream(25);
    const recorder = new MediaRecorder(stream, {mimeType:'video/webm'});
    const chunks = [];
    recorder.ondataavailable = e=>chunks.push(e.data);
    recorder.start();
    for(const img of imgs){
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      await new Promise(r=> setTimeout(r,120)); // frame delay
    }
    recorder.stop();
    await new Promise(r=> recorder.onstop = r);
    const blob = new Blob(chunks, {type:'video/webm'});
    const url = URL.createObjectURL(blob);
    out.innerHTML = `<a href="${url}" download="moscheai_video.webm">Download video</a><br><video controls src="${url}"></video>`;
  }catch(e){ out.innerHTML = '<p>Video failed</p>'; console.error(e) }
});

// Text generation
el('txt-btn').addEventListener('click', async ()=>{
  const prompt = el('txt-prompt').value.trim();
  const out = el('txt-result');
  if(!prompt){alert('Enter a prompt');return;}
  out.innerHTML = '<p>Generating text…</p>';
  try{
    const data = await postJSON('/generate-text', {prompt});
    if(data.error){ out.innerHTML = `<p>Error: ${data.error}</p>`; return;}
    out.innerHTML = `<pre style="white-space:pre-wrap;text-align:left">${data.text}</pre>`;
  }catch(e){ out.innerHTML = '<p>Text failed</p>'; console.error(e) }
});
