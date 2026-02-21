import { modelLoader } from './model-loader.js';
import { inferencePipeline } from './inference-pipeline.js';

const modelCache = new Map();
const offscreen = new OffscreenCanvas(0, 0);
const ctx = offscreen.getContext('2d', { willReadFrequently: true });

// Serialization: only one operation (load or inference) at a time.
// Newer requests cancel/supersede older ones.
let activeModelKey = null;
let loadGeneration = 0;
let busy = false;

self.addEventListener('message', async (event) => {
  const { type, config, bitmap, dispatchTime } = event.data;
  const modelKey = `${config.model}-${config.task}-${config.backend}`;

  switch (type) {
    case 'LOAD_MODEL': {
      // Bump generation so any in-flight inference knows it's stale
      const thisGen = ++loadGeneration;
      activeModelKey = modelKey;

      // Wait for any in-flight operation to finish before loading
      while (busy) {
        await new Promise((r) => setTimeout(r, 10));
        // If another LOAD_MODEL came in while we were waiting, bail
        if (thisGen !== loadGeneration) return;
      }

      busy = true;
      let cached = modelCache.get(modelKey);
      let start = 0;
      let end = 0;
      let msg = 'Model loaded from cache';

      try {
        if (!cached) {
          start = performance.now();
          cached = await modelLoader(
            config.modelPath,
            config.backend,
            config.numThreads,
            config,
          );
          end = performance.now();

          // Check if a newer load request superseded us
          if (thisGen !== loadGeneration) {
            cached.release?.();
            return;
          }

          modelCache.set(modelKey, cached);
          msg = 'Model loaded successfully';
        }

        self.postMessage({
          type: 'MODEL_LOADED',
          msg,
          loadTime: (end - start).toFixed(2),
        });
      } catch (error) {
        if (thisGen !== loadGeneration) return;
        self.postMessage({
          type: 'MODEL_LOAD_ERROR',
          msg: `Failed to load model: ${error.message}`,
          error: error.message,
        });
      } finally {
        busy = false;
      }
      break;
    }

    case 'INFERENCE': {
      const thisGen = loadGeneration;

      // Drop frame if wrong model, busy, or loading
      if (modelKey !== activeModelKey || busy) {
        bitmap?.close();
        self.postMessage({
          type: 'RESULT',
          results: [],
          maskImageData: null,
          timing: { preprocess: 0, inference: 0, postprocess: 0, decode: 0 },
          dispatchTime,
        });
        break;
      }

      const session = modelCache.get(modelKey);
      if (!session) {
        bitmap?.close();
        self.postMessage({
          type: 'RESULT',
          results: [],
          maskImageData: null,
          timing: { preprocess: 0, inference: 0, postprocess: 0, decode: 0 },
          dispatchTime,
        });
        break;
      }

      busy = true;

      // Decode bitmap to ImageData
      const t0 = performance.now();
      offscreen.width = bitmap.width;
      offscreen.height = bitmap.height;
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      bitmap.close();
      const decodeTime = +(performance.now() - t0).toFixed(1);

      // Check if model changed during decode
      if (thisGen !== loadGeneration) {
        busy = false;
        self.postMessage({
          type: 'RESULT',
          results: [],
          maskImageData: null,
          timing: { decode: decodeTime, preprocess: 0, inference: 0, postprocess: 0 },
          dispatchTime,
        });
        break;
      }

      const result = await inferencePipeline(imageData, session, config);
      busy = false;

      self.postMessage({
        type: 'RESULT',
        results: result.results,
        maskImageData: result.maskImageData,
        timing: { decode: decodeTime, ...result.timing },
        dispatchTime,
      });
      break;
    }
  }
});
