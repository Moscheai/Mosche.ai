// MoscheAI – Cloudflare Worker Backend
// Bitte stelle sicher, dass die Variable "HUGGINGFACE_TOKEN" im Dashboard gesetzt ist.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Allow CORS for your frontend
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Main Router
    if (url.pathname === "/generate-image") {
      return generateImage(request, env);
    }
    if (url.pathname === "/upscale") {
      return upscale(request, env);
    }
    if (url.pathname === "/generate-video") {
      return generateVideo(request, env);
    }
    if (url.pathname === "/generate-text") {
      return generateText(request, env);
    }

    return new Response("MoscheAI backend running.", { status: 200 });
  }
};

// ---------------------------
// IMAGE GENERATION
// ---------------------------
async function generateImage(request, env) {
  const { prompt, size } = await request.json();

  const response = await fetch(
    "https://api-inference.huggingface.co/models/ZB-Tech/Text-to-Image",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hf_uyoJGzsdrukBHIUIocsjuYr-VTIUzxAZlgV}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    }
  );

  if (!response.ok) {
    return new Response(JSON.stringify({ error: "HF error" }), {
      status: 500
    });
  }

  const blob = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(blob);

  return json({ image: `data:image/png;base64,${base64}` });
}

// ---------------------------
// UPSCALE
// ---------------------------
async function upscale(request, env) {
  const { image, factor } = await request.json();

  const response = await fetch(
    "https://api-inference.huggingface.co/models/caidas/swin2SR-classical-sr-x2-64",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hf_uyoJGzsdrukBHIUIocsjuYr-VTIUzxAZlgV}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: image })
    }
  );

  if (!response.ok) {
    return json({ error: "Upscale failed" });
  }

  const blob = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(blob);

  return json({ image: `data:image/png;base64,${base64}` });
}

// ---------------------------
// VIDEO GENERATION (Frames)
// ---------------------------
async function generateVideo(request, env) {
  const { prompt, frames } = await request.json();
  const resultFrames = [];

  for (let i = 0; i < frames; i++) {
    const resp = await fetch(
      "https://api-inference.huggingface.co/models/ZB-Tech/Text-to-Image",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hf_uyoJGzsdrukBHIUIocsjuYr-VTIUzxAZlgV}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `${prompt}, frame ${i}`
        })
      }
    );

    const arr = await resp.arrayBuffer();
    const b64 = arrayBufferToBase64(arr);
    resultFrames.push(`data:image/png;base64,${b64}`);
  }

  return json({ frames: resultFrames });
}

// ---------------------------
// TEXT GENERATION
// ---------------------------
async function generateText(request, env) {
  const { prompt } = await request.json();

  const response = await fetch(
    "https://api-inference.huggingface.co/models/gpt2",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hf_uyoJGzsdrukBHIUIocsjuYr-VTIUzxAZlgV}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    }
  );

  const data = await response.json();
  if (data.error) {
    return json({ error: "Text generation failed" });
  }

  return json({ text: data[0]?.generated_text || "No output" });
}

// ---------------------------
// Helpers
// ---------------------------
function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
