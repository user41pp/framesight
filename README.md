# FrameSight

Real-time computer vision in the browser. Object detection, instance segmentation, and monocular depth estimation — running entirely client-side via [ONNX Runtime Web](https://onnxruntime.ai/) on WebGPU.

No server, no API calls. Your camera feed never leaves your device.

## Features

- **Object Detection** — RF-DETR with neon bounding boxes and confidence scores
- **Instance Segmentation** — RF-DETR Seg with per-instance colored masks
- **Depth Estimation** — Depth Anything V2 with Turbo colormap visualization
- **Live Webcam** — Real-time inference on camera feed
- **Image Upload** — Single-shot inference on static images
- **Hot Model Switching** — Switch models seamlessly without restarting the camera
- **Embed Mode** — Clean iframe integration via `?embed=true`

## Models

All models are Apache 2.0 licensed.

All models are FP16 quantized for fast download and efficient WebGPU inference.

| Model | Task | Resolution | Size |
|-------|------|-----------|------|
| RF-DETR Nano | Detection | 384x384 | 52 MB |
| RF-DETR Seg Nano | Segmentation | 312x312 | 59 MB |
| Depth Anything V2 ViT-S | Depth | 518x518 | 48 MB |

## Requirements

- **Chromium-based browser** with WebGPU support (Chrome 113+, Edge 113+)
- WebGPU must be enabled (it is by default on recent versions)

## Getting Started

```bash
# Install dependencies
npm install

# Download ONNX models into public/models/
# (see "Models Setup" below)

# Start dev server
npm run dev
```

The app serves at `http://localhost:5173/framesight/`.

### Models Setup

ONNX model files are gitignored on `main` due to size, but included in the `gh-pages` deployment branch. For local development, download the FP16 models and place them in `public/models/`:

```
public/models/
  rfdetr-nano-fp16.onnx        (52 MB)
  rfdetr-seg-nano-fp16.onnx    (59 MB)
  depth-anything-v2-vits-fp16.onnx  (48 MB)
```

RF-DETR models are exported from [Roboflow RF-DETR](https://github.com/roboflow/rf-detr), Depth Anything V2 ViT-S from [Depth-Anything-V2](https://github.com/DepthAnything/Depth-Anything-V2). All quantized to FP16 via `onnxconverter-common`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Build + deploy to GitHub Pages |

## Architecture

All ML inference runs in a Web Worker to keep the UI thread free.

```
Main Thread                          Web Worker
───────────                          ──────────
Camera/Image
  → createImageBitmap()
  → postMessage(bitmap)  ─────────→  bitmap decode (OffscreenCanvas)
                                       → preprocess (OpenCV.js)
                                       → session.run() (ONNX Runtime WebGPU)
                                       → postprocess
  render overlay (Canvas) ←─────────  postMessage(results + timing)
```

The frame loop uses a `requestAnimationFrame` cycle with an `isProcessing` gate — the UI runs at 60fps while inference is dispatched one frame at a time. No frame queueing, no memory pressure.

Model switches are serialized in the worker with a generation counter to prevent WebGPU buffer races.

## Tech Stack

- [React 19](https://react.dev/) with [React Compiler](https://react.dev/learn/react-compiler)
- [Vite 7](https://vite.dev/) (rolldown)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Framer Motion](https://motion.dev/)
- [ONNX Runtime Web](https://onnxruntime.ai/) (WebGPU backend)
- [OpenCV.js](https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html) for image preprocessing

## Embed Mode

Append `?embed=true` to hide the header, footer, and background glow — designed for iframe embedding:

```html
<iframe
  src="https://user41pp.github.io/framesight/?embed=true"
  allow="camera; microphone"
  style="width: 100%; height: 85vh; border: none;"
></iframe>
```

## License

MIT
