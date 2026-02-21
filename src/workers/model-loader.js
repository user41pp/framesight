import { InferenceSession, Tensor, env } from 'onnxruntime-web/webgpu';

export async function modelLoader(modelPath, backend, numThreads = 1, config = {}) {
  const inputName = config.inputName || 'images';
  const inputSize = config.resolution
    ? [1, 3, config.resolution[1], config.resolution[0]]
    : [1, 3, 640, 640];

  // WASM settings
  env.wasm.simd = true;
  env.wasm.numThreads = numThreads;

  const sessionOptions = {
    executionProviders: [backend],
    graphOptimizationLevel: 'all',
    enableCpuMemArena: true,
    enableMemPattern: true,
  };

  // WebGPU: keep outputs on GPU to avoid CPU<->GPU copies
  if (backend === 'webgpu') {
    sessionOptions.preferredOutputLocation = 'gpu-buffer';
  }

  // Fetch model as ArrayBuffer to avoid protobuf size limits
  const response = await fetch(modelPath);
  const modelBuffer = await response.arrayBuffer();

  let session;
  try {
    session = await InferenceSession.create(modelBuffer, sessionOptions);
  } catch (e) {
    if (backend === 'wasm' && env.wasm.simd) {
      console.warn('Retrying without SIMD...');
      env.wasm.simd = false;
      session = await InferenceSession.create(modelBuffer, sessionOptions);
    } else {
      throw e;
    }
  }

  // Warmup run
  const dummy = new Tensor(
    'float32',
    new Float32Array(inputSize.reduce((a, b) => a * b)),
    inputSize,
  );
  const warmupOutputs = await session.run({ [inputName]: dummy });
  Object.values(warmupOutputs).forEach((t) => t?.dispose?.());
  dummy.dispose();

  return session;
}
