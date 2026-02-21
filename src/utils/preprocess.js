import cv from '@techstark/opencv-js';
import { Tensor } from 'onnxruntime-web/webgpu';

/**
 * Pre-process image for RF-DETR and Depth Anything models.
 * Direct square resize + ImageNet normalization.
 */
export function preProcessRFDETR(srcMat, resolution, overlaySize) {
  const rgbMat = new cv.Mat();
  cv.cvtColor(srcMat, rgbMat, cv.COLOR_RGBA2RGB);

  const preProcessed = cv.blobFromImage(
    rgbMat,
    1 / 255.0,
    { width: resolution[0], height: resolution[1] },
    [0, 0, 0, 0],
    false,
    false,
  );
  rgbMat.delete();

  // ImageNet normalization: (value - mean) / std
  const means = [0.485, 0.456, 0.406];
  const stds = [0.229, 0.224, 0.225];
  const data = preProcessed.data32F;
  const channelSize = resolution[0] * resolution[1];

  for (let c = 0; c < 3; c++) {
    const offset = c * channelSize;
    const mean = means[c];
    const std = stds[c];
    for (let i = 0; i < channelSize; i++) {
      data[offset + i] = (data[offset + i] - mean) / std;
    }
  }

  const inputTensor = new Tensor(
    'float32',
    data,
    [1, 3, resolution[1], resolution[0]],
  );
  preProcessed.delete();

  return inputTensor;
}
