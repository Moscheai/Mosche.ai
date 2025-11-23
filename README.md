Mosche AI — Gradient Edition (C) — Full Package
==================================================

Included files:
- index.html
- style.css
- script.js
- config.js
- worker.js
- README.md

Quick setup:
1) Deploy the Cloudflare Worker:
   - Create a Worker and paste worker.js
   - Add two secrets: HUGGINGFACE_API_KEY and OPENAI_API_KEY
     Example with Wrangler:
       wrangler secret put HUGGINGFACE_API_KEY
       wrangler secret put OPENAI_API_KEY
   - Deploy and note the worker URL (e.g. https://moscheai-backend.example.workers.dev)

2) Configure frontend:
   - Open config.js and replace BACKEND_URL with your worker URL.

3) Host frontend:
   - Create a GitHub repo and push all files (index.html, style.css, script.js, config.js)
   - Enable GitHub Pages (Settings → Pages → main branch, root)

Notes:
- Video generation is implemented by generating multiple frames and assembling them client-side into a WebM. For higher quality/consistency consider using a specialized video model.
- Upscaler is a placeholder — replace with a dedicated upscaler (ESRGAN/Real-ESRGAN) or HF model for real 2×/4× upscaling.
- Do NOT commit your API keys to a public repo.
