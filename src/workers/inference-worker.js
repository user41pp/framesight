import { modelLoader } from './model-loader.js';
import { inferencePipeline } from './inference-pipeline.js';

const modelCache = new Map();
const offscreen = new OffscreenCanvas(0, 0);
const ctx = offscreen.getContext('2d', { willReadFrequently: true });

self.addEventListener('message', async (event) => {
  const { type, config, bitmap, dispatchTime } = event.data;
  const modelKey = `${config.model}-${config.task}-${config.backend}`;

  switch (type) {
    case 'LOAD_MODEL': {
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
          modelCache.set(modelKey, cached);
          msg = 'Model loaded successfully';
        }

        self.postMessage({
          type: 'MODEL_LOADED',
          msg,
          loadTime: (end - start).toFixed(2),
        });
      } catch (error) {
        self.postMessage({
          type: 'MODEL_LOAD_ERROR',
          msg: `Failed to load model: ${error.message}`,
          error: error.message,
        });
      }
      break;
    }

    case 'INFERENCE': {
      const session = modelCache.get(modelKey);
      if (!session) {
        self.postMessage({
          type: 'RESULT',
          results: [],
          maskImageData: null,
          timing: { preprocess: 0, inference: 0, postprocess: 0, decode: 0 },
          dispatchTime,
        });
        break;
      }

      // Decode bitmap to ImageData
      const t0 = performance.now();
      offscreen.width = bitmap.width;
      offscreen.height = bitmap.height;
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      bitmap.close();
      const decodeTime = +(performance.now() - t0).toFixed(1);

      const result = await inferencePipeline(imageData, session, config);

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
