import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';

import classes from './config/coco-classes.json';
import { DEFAULT_MODEL_ID, getModelById } from './config/models';
import { renderOverlay } from './utils/render-overlay';

import { useEmbedMode } from './hooks/useEmbedMode';
import { useInferenceWorker } from './hooks/useInferenceWorker';
import { useWebcam } from './hooks/useWebcam';
import { useFrameLoop } from './hooks/useFrameLoop';

import GlowBackground from './components/layout/GlowBackground';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Viewport from './components/viewport/Viewport';
import ControlBar from './components/controls/ControlBar';
import MetricsBar from './components/metrics/MetricsBar';
import DetectionList from './components/results/DetectionList';
import LoadingSpinner from './components/shared/LoadingSpinner';

function buildModelConfig(modelId, confidence, backend) {
  const model = getModelById(modelId);
  return {
    model: model.id,
    modelPath: `${import.meta.env.BASE_URL}models/${model.file}`,
    modelFamily: model.family,
    task: model.task,
    resolution: model.resolution,
    inputName: model.inputName,
    scoreThreshold: confidence,
    backend,
    numThreads: 4,
    overlaySize: [640, 640],
    classes,
  };
}

function App() {
  const isEmbedded = useEmbedMode();

  // --- State ---
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const [backend, setBackend] = useState('wasm');
  const [confidence, setConfidence] = useState(0.45);
  const [activeSource, setActiveSource] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('Loading model...');
  const [warmupTime, setWarmupTime] = useState('0');
  const [inferenceTime, setInferenceTime] = useState('0');
  const [detections, setDetections] = useState([]);
  const [fps, setFps] = useState(0);
  const [imgSrcState, setImgSrcState] = useState(null);

  // --- Refs ---
  const cameraRef = useRef(null);
  const imgRef = useRef(null);
  const overlayRef = useRef(null);
  const modelConfigRef = useRef(buildModelConfig(DEFAULT_MODEL_ID, 0.45, 'wasm'));

  // --- Frame loop ---
  const { start: startLoop, stop: stopLoop, markDone, fpsRef } = useFrameLoop();

  // --- Worker callbacks ---
  const handleModelLoaded = useCallback((data) => {
    setModelLoading(false);
    setStatusMsg(data.msg);
    setWarmupTime(data.loadTime);
  }, []);

  const handleResult = useCallback((data) => {
    const overlayCtx = overlayRef.current?.getContext('2d');
    if (!overlayCtx) {
      markDone();
      return;
    }

    overlayCtx.clearRect(0, 0, overlayCtx.canvas.width, overlayCtx.canvas.height);

    const config = modelConfigRef.current;
    renderOverlay(data.results, data.maskImageData, overlayCtx, config.task, config.classes);

    setDetections(data.results || []);
    setInferenceTime(data.inferenceTime);
    setFps(fpsRef.current);
    markDone();
  }, [markDone, fpsRef]);

  const handleError = useCallback((data) => {
    setModelLoading(false);
    setStatusMsg(data.msg);
  }, []);

  const { postMessage } = useInferenceWorker({
    onModelLoaded: handleModelLoaded,
    onResult: handleResult,
    onError: handleError,
  });

  const { openCamera, closeCamera, cameraStatus } = useWebcam(cameraRef);

  // Derived status: camera status overrides when active
  const displayStatus = cameraStatus || statusMsg;

  // --- Load model (called directly, not from effects) ---
  const loadModelWith = useCallback((modelId, be) => {
    const config = buildModelConfig(modelId, confidence, be);
    modelConfigRef.current = config;
    setModelLoading(true);
    setStatusMsg('Loading model...');
    postMessage({ type: 'LOAD_MODEL', config });
  }, [confidence, postMessage]);

  // Initial model load on mount
  useEffect(() => {
    postMessage({ type: 'LOAD_MODEL', config: modelConfigRef.current });
  }, [postMessage]);

  // Model/backend change handlers - load directly
  const handleModelChange = useCallback((newId) => {
    stopLoop();
    setSelectedModelId(newId);
    loadModelWith(newId, backend);
  }, [stopLoop, backend, loadModelWith]);

  const handleBackendChange = useCallback((newBackend) => {
    stopLoop();
    setBackend(newBackend);
    loadModelWith(selectedModelId, newBackend);
  }, [stopLoop, selectedModelId, loadModelWith]);

  // Keep config ref's confidence updated
  useEffect(() => {
    modelConfigRef.current.scoreThreshold = confidence;
  }, [confidence]);

  // --- Camera frame dispatch ---
  const dispatchFrame = useCallback(async () => {
    if (!cameraRef.current || cameraRef.current.readyState < 2) return;

    try {
      const bitmap = await createImageBitmap(cameraRef.current);
      const vw = cameraRef.current.videoWidth;
      const vh = cameraRef.current.videoHeight;

      if (overlayRef.current.width !== vw || overlayRef.current.height !== vh) {
        overlayRef.current.width = vw;
        overlayRef.current.height = vh;
      }

      const config = modelConfigRef.current;
      config.overlaySize = [vw, vh];

      postMessage({ type: 'INFERENCE', config, bitmap }, [bitmap]);
    } catch {
      markDone();
    }
  }, [postMessage, markDone]);

  // --- Camera toggle ---
  const handleToggleCamera = useCallback(async () => {
    if (activeSource === 'camera') {
      stopLoop();
      closeCamera();
      if (overlayRef.current) {
        overlayRef.current.getContext('2d')?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      }
      setActiveSource(null);
      setDetections([]);
      setFps(0);
    } else {
      const success = await openCamera();
      if (success) {
        setActiveSource('camera');
      }
    }
  }, [activeSource, stopLoop, closeCamera, openCamera]);

  const handleCameraLoad = useCallback(() => {
    startLoop(dispatchFrame);
  }, [startLoop, dispatchFrame]);

  // --- Image upload ---
  const handleUploadImage = useCallback((url) => {
    stopLoop();
    closeCamera();
    setActiveSource('image');
    setDetections([]);
    setFps(0);
    setImgSrcState(url);
  }, [stopLoop, closeCamera]);

  const handleImageLoad = useCallback(() => {
    if (!imgRef.current || !overlayRef.current) return;
    const w = imgRef.current.naturalWidth;
    const h = imgRef.current.naturalHeight;
    overlayRef.current.width = w;
    overlayRef.current.height = h;

    const config = modelConfigRef.current;
    config.overlaySize = [w, h];

    createImageBitmap(imgRef.current).then((bitmap) => {
      postMessage({ type: 'INFERENCE', config, bitmap }, [bitmap]);
    });
  }, [postMessage]);

  const selectedModel = getModelById(selectedModelId);
  const currentTask = selectedModel?.task || 'detect';

  return (
    <div className={`min-h-screen ${isEmbedded ? 'bg-void' : ''}`}>
      {!isEmbedded && <GlowBackground />}

      <div className={`max-w-5xl mx-auto ${isEmbedded ? 'px-2 py-2' : 'px-4 sm:px-6 py-2'}`}>
        {!isEmbedded && <Header />}

        <div className="relative">
          <Viewport
            cameraRef={cameraRef}
            imgRef={imgRef}
            overlayRef={overlayRef}
            imgSrc={imgSrcState}
            activeSource={activeSource}
            onCameraLoad={handleCameraLoad}
            onImageLoad={handleImageLoad}
            fps={fps}
            inferenceTime={inferenceTime}
          />
          <AnimatePresence>
            {modelLoading && <LoadingSpinner />}
          </AnimatePresence>
        </div>

        <ControlBar
          activeSource={activeSource}
          onToggleCamera={handleToggleCamera}
          onUploadImage={handleUploadImage}
          selectedModel={selectedModelId}
          onModelChange={handleModelChange}
          backend={backend}
          onBackendChange={handleBackendChange}
          confidence={confidence}
          onConfidenceChange={setConfidence}
          modelLoading={modelLoading}
          currentTask={currentTask}
        />

        <MetricsBar
          warmupTime={warmupTime}
          inferenceTime={inferenceTime}
          statusMsg={displayStatus}
          modelLoading={modelLoading}
        />

        {currentTask !== 'depth' && (
          <DetectionList
            detections={detections}
            classes={classes}
          />
        )}

        {!isEmbedded && <Footer />}
      </div>
    </div>
  );
}

export default App;
