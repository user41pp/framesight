import { preProcessRFDETR } from '../utils/preprocess.js';
import { postProcessRFDETRDetect, postProcessRFDETRSeg, postProcessRFDETRMask } from '../utils/postprocess-rfdetr.js';
import { postProcessDepth } from '../utils/postprocess-depth.js';
import cv from '@techstark/opencv-js';

export async function inferencePipeline(imageData, session, config) {
  const matsToDelete = [];
  let inputTensor = null;
  const outputTensors = {};

  try {
    const t0 = performance.now();

    const srcMat = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC4);
    srcMat.data.set(imageData.data);
    matsToDelete.push(srcMat);

    // Pre-process
    inputTensor = preProcessRFDETR(srcMat, config.resolution, config.overlaySize);
    const t1 = performance.now();

    // Inference
    const inputName = config.inputName || 'images';
    const outputs = await session.run({ [inputName]: inputTensor });
    const t2 = performance.now();

    // Post-process
    let results, masksData, maskImgData, filteredResults;

    if (config.modelFamily === 'rfdetr') {
      const detsData = await outputs.dets.getData();
      const detsDims = outputs.dets.dims;
      const labelsData = await outputs.labels.getData();
      const labelsDims = outputs.labels.dims;

      outputTensors.dets = outputs.dets;
      outputTensors.labels = outputs.labels;

      if (config.task === 'seg' && outputs.masks) {
        const masksRawData = await outputs.masks.getData();
        const masksDims = outputs.masks.dims;
        outputTensors.masks = outputs.masks;

        [results, masksData] = postProcessRFDETRSeg(
          detsData, detsDims,
          labelsData, labelsDims,
          masksRawData, masksDims,
          config.scoreThreshold,
          config.overlaySize,
        );
      } else {
        results = postProcessRFDETRDetect(
          detsData, detsDims,
          labelsData, labelsDims,
          config.scoreThreshold,
          config.overlaySize,
        );
      }

      filteredResults = results;

      if (config.task === 'seg' && masksData) {
        maskImgData = postProcessRFDETRMask(filteredResults, masksData, config.overlaySize);
      }
    } else if (config.modelFamily === 'depth-anything') {
      const outputName = Object.keys(outputs)[0];
      const depthOutput = outputs[outputName];
      const depthData = await depthOutput.getData();
      const depthDims = depthOutput.dims;
      outputTensors[outputName] = depthOutput;

      maskImgData = postProcessDepth(depthData, depthDims, config.overlaySize);
      filteredResults = [];
    }

    const t3 = performance.now();

    return {
      results: filteredResults || [],
      maskImageData: maskImgData || null,
      timing: {
        preprocess: +(t1 - t0).toFixed(1),
        inference: +(t2 - t1).toFixed(1),
        postprocess: +(t3 - t2).toFixed(1),
      },
    };
  } catch (error) {
    console.error('Inference error:', error);
    return {
      results: [],
      maskImageData: null,
      timing: { preprocess: 0, inference: 0, postprocess: 0 },
    };
  } finally {
    matsToDelete.forEach((mat) => {
      if (mat && !mat.isDeleted()) mat.delete();
    });
    if (inputTensor) inputTensor.dispose();
    Object.values(outputTensors).forEach((t) => t?.dispose?.());
  }
}
