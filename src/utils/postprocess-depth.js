import cv from '@techstark/opencv-js';
import { TURBO_LUT } from '../config/colors.js';

/**
 * Post-process depth model output into a colorized depth map.
 */
export function postProcessDepth(depthData, depthDims, overlaySize) {
  const depthH = depthDims[depthDims.length - 2];
  const depthW = depthDims[depthDims.length - 1];
  const numPixels = depthH * depthW;

  // Min-max normalization
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < numPixels; i++) {
    const v = depthData[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;

  // Apply Turbo colormap
  const rgba = new Uint8ClampedArray(numPixels * 4);
  for (let i = 0; i < numPixels; i++) {
    const lutIdx = Math.round(((depthData[i] - min) / range) * 255) * 3;
    rgba[i * 4]     = TURBO_LUT[lutIdx];
    rgba[i * 4 + 1] = TURBO_LUT[lutIdx + 1];
    rgba[i * 4 + 2] = TURBO_LUT[lutIdx + 2];
    rgba[i * 4 + 3] = 255;
  }

  // Resize to overlay dimensions
  const depthMat = new cv.Mat(depthH, depthW, cv.CV_8UC4);
  depthMat.data.set(rgba);

  const resizedMat = new cv.Mat();
  cv.resize(depthMat, resizedMat, new cv.Size(overlaySize[0], overlaySize[1]), 0, 0, cv.INTER_LINEAR);

  // Copy pixel data before deleting — resizedMat.data is a view into WASM heap
  const pixelData = new Uint8ClampedArray(resizedMat.data);
  depthMat.delete();
  resizedMat.delete();

  return new ImageData(pixelData, overlaySize[0], overlaySize[1]);
}
