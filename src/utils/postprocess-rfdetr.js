import cv from '@techstark/opencv-js';
import { getNeonColor } from '../config/colors.js';

/**
 * Post-process RF-DETR detection outputs.
 */
export function postProcessRFDETRDetect(
  detsData, detsDims,
  labelsData, labelsDims,
  scoreThreshold, overlaySize,
) {
  const numQueries = detsDims[1];
  const numClasses = labelsDims[2];
  const results = [];

  for (let i = 0; i < numQueries; i++) {
    let maxScore = 0;
    let classIdx = -1;
    const labelOffset = i * numClasses;

    for (let c = 0; c < numClasses; c++) {
      const logit = labelsData[labelOffset + c];
      const score = 1 / (1 + Math.exp(-logit));
      if (score > maxScore) {
        maxScore = score;
        classIdx = c;
      }
    }

    if (maxScore <= scoreThreshold) continue;

    const boxOffset = i * 4;
    const cx = detsData[boxOffset];
    const cy = detsData[boxOffset + 1];
    const bw = detsData[boxOffset + 2];
    const bh = detsData[boxOffset + 3];

    const px = (cx - bw / 2) * overlaySize[0];
    const py = (cy - bh / 2) * overlaySize[1];
    const pw = bw * overlaySize[0];
    const ph = bh * overlaySize[1];

    results.push({
      bbox: [px, py, pw, ph],
      classIdx,
      score: maxScore,
      queryIdx: i,
    });
  }

  return results;
}

/**
 * Post-process RF-DETR segmentation outputs.
 */
export function postProcessRFDETRSeg(
  detsData, detsDims,
  labelsData, labelsDims,
  masksData, masksDims,
  scoreThreshold, overlaySize,
) {
  const results = postProcessRFDETRDetect(
    detsData, detsDims,
    labelsData, labelsDims,
    scoreThreshold, overlaySize,
  );

  const masksInfo = {
    rawMasks: masksData,
    MASK_HEIGHT: masksDims[2],
    MASK_WIDTH: masksDims[3],
    numQueries: masksDims[1],
  };

  return [results, masksInfo];
}

/**
 * Generate mask overlay for RF-DETR segmentation.
 */
export function postProcessRFDETRMask(filteredResults, masksInfo, overlaySize) {
  if (!filteredResults || filteredResults.length === 0) return null;

  const { rawMasks, MASK_HEIGHT, MASK_WIDTH } = masksInfo;
  const maskPixels = MASK_HEIGHT * MASK_WIDTH;

  const overlayMat = new cv.Mat(
    overlaySize[1], overlaySize[0], cv.CV_8UC4,
    new cv.Scalar(0, 0, 0, 0),
  );

  const maskResizedMat = new cv.Mat();
  const maskBinaryMat = new cv.Mat();
  const maskBinaryU8Mat = new cv.Mat();

  try {
    for (let i = 0; i < filteredResults.length; i++) {
      const queryIdx = filteredResults[i].queryIdx;

      const maskStart = queryIdx * maskPixels;
      const sigmoidData = new Float32Array(maskPixels);
      for (let p = 0; p < maskPixels; p++) {
        sigmoidData[p] = 1 / (1 + Math.exp(-rawMasks[maskStart + p]));
      }

      const maskMat = cv.matFromArray(MASK_HEIGHT, MASK_WIDTH, cv.CV_32F, sigmoidData);
      const [x, y, w, h] = filteredResults[i].bbox;

      const scaleX = MASK_WIDTH / overlaySize[0];
      const scaleY = MASK_HEIGHT / overlaySize[1];

      const maskX = Math.floor(Math.max(0, x * scaleX));
      const maskY = Math.floor(Math.max(0, y * scaleY));
      const maskW = Math.ceil(Math.min(MASK_WIDTH - maskX, w * scaleX));
      const maskH = Math.ceil(Math.min(MASK_HEIGHT - maskY, h * scaleY));

      if (maskW > 0 && maskH > 0) {
        const maskRoi = maskMat.roi(new cv.Rect(maskX, maskY, maskW, maskH));

        const targetX = Math.max(0, Math.floor(x));
        const targetY = Math.max(0, Math.floor(y));
        const targetW = Math.min(overlaySize[0] - targetX, Math.ceil(w));
        const targetH = Math.min(overlaySize[1] - targetY, Math.ceil(h));

        if (targetW > 0 && targetH > 0) {
          cv.resize(maskRoi, maskResizedMat, new cv.Size(targetW, targetH), cv.INTER_LINEAR);
          cv.threshold(maskResizedMat, maskBinaryMat, 0.5, 255, cv.THRESH_BINARY);
          maskBinaryMat.convertTo(maskBinaryU8Mat, cv.CV_8U);

          const color = getNeonColor(filteredResults[i].classIdx, 0.5);
          const colorScalar = new cv.Scalar(color[0], color[1], color[2], color[3] * 255);

          const maskColoredMat = new cv.Mat(targetH, targetW, cv.CV_8UC4, colorScalar);
          const overlayRoi = overlayMat.roi(new cv.Rect(targetX, targetY, targetW, targetH));
          maskColoredMat.copyTo(overlayRoi, maskBinaryU8Mat);
          overlayRoi.delete();
          maskColoredMat.delete();
        }
        maskRoi.delete();
      }
      maskMat.delete();
    }

    maskResizedMat.delete();
    maskBinaryMat.delete();
    maskBinaryU8Mat.delete();

    // Copy pixel data before deleting — overlayMat.data is a view into WASM heap
    const pixelData = new Uint8ClampedArray(overlayMat.data);
    overlayMat.delete();
    return new ImageData(pixelData, overlaySize[0], overlaySize[1]);
  } catch (error) {
    console.error('Error processing RF-DETR masks:', error);
    overlayMat.delete();
    maskResizedMat.delete();
    maskBinaryMat.delete();
    maskBinaryU8Mat.delete();
    return null;
  }
}
