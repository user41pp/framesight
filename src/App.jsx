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

const EMPTY_TIMING = { decode: 0, preprocess: 0, inference: 0, postprocess: 0, render: 0, total: 0 };

function App() {
  const isEmbedded = useEmbedMode();
  const [webgpuSupported, setWebgpuSupported] = useState(() => {
    if (typeof navigator === 'undefined' || !navigator.gpu) return false;
    return null; // unknown until adapter check completes
  });

  useEffect(() => {
    if (webgpuSupported !== null) return;
    navigator.gpu.requestAdapter().then((adapter) => {
      setWebgpuSupported(!!adapter);
    }).catch(() => {
      setWebgpuSupported(false);
    });
  }, [webgpuSupported]);

  // --- State ---
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const backend = 'webgpu';
  const [confidence, setConfidence] = useState(0.45);
  const [activeSource, setActiveSource] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('Loading model...');
  const [warmupTime, setWarmupTime] = useState('0');
  const [timing, setTiming] = useState(EMPTY_TIMING);
  const [detections, setDetections] = useState([]);
  const [fps, setFps] = useState(0);
  const [imgSrcState, setImgSrcState] = useState(null);

  // --- Refs ---
  const cameraRef = useRef(null);
  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const modelConfigRef = useRef(buildModelConfig(DEFAULT_MODEL_ID, 0.45, 'webgpu'));

  // --- Frame loop ---
  const { start: startLoop, stop: stopLoop, markDone, fpsRef } = useFrameLoop();

  // --- Worker callbacks ---
  const handleModelLoaded = useCallback((data) => {
    setModelLoading(false);
    setStatusMsg(data.msg);
    setWarmupTime(data.loadTime);
  }, []);

  const handleResult = useCallback((data) => {
    const renderStart = performance.now();

    const overlayCtx = overlayRef.current?.getContext('2d');
    if (!overlayCtx) {
      markDone();
      return;
    }

    overlayCtx.clearRect(0, 0, overlayCtx.canvas.width, overlayCtx.canvas.height);

    const config = modelConfigRef.current;
    renderOverlay(data.results, data.maskImageData, overlayCtx, config.task, config.classes);

    const renderTime = +(performance.now() - renderStart).toFixed(1);
    const totalTime = data.dispatchTime ? +(performance.now() - data.dispatchTime).toFixed(1) : 0;

    const workerTiming = data.timing || {};
    setTiming({
      decode: workerTiming.decode || 0,
      preprocess: workerTiming.preprocess || 0,
      inference: workerTiming.inference || 0,
      postprocess: workerTiming.postprocess || 0,
      render: renderTime,
      total: totalTime,
    });

    setDetections(data.results || []);
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

  // Initial model load on mount (only if WebGPU is available)
  useEffect(() => {
    if (webgpuSupported) {
      postMessage({ type: 'LOAD_MODEL', config: modelConfigRef.current });
    }
  }, [postMessage, webgpuSupported]);

  // Model change — stop loop, clear stale overlay, load new model
  const handleModelChange = useCallback((newId) => {
    stopLoop();
    setSelectedModelId(newId);
    setDetections([]);
    setTiming(EMPTY_TIMING);
    if (overlayRef.current) {
      overlayRef.current.getContext('2d')?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }
    loadModelWith(newId, backend);
  }, [stopLoop, backend, loadModelWith]);

  // Keep config ref's confidence updated
  useEffect(() => {
    modelConfigRef.current.scoreThreshold = confidence;
  }, [confidence]);

  // --- Camera frame dispatch ---
  const dispatchFrame = useCallback(async () => {
    if (!cameraRef.current || cameraRef.current.readyState < 2) {
      markDone();
      return;
    }

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

      postMessage(
        { type: 'INFERENCE', config, bitmap, dispatchTime: performance.now() },
        [bitmap],
      );
    } catch {
      markDone();
    }
  }, [postMessage, markDone]);

  // --- Video frame dispatch ---
  const dispatchVideoFrame = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      markDone();
      return;
    }

    try {
      const bitmap = await createImageBitmap(videoRef.current);
      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;

      if (overlayRef.current.width !== vw || overlayRef.current.height !== vh) {
        overlayRef.current.width = vw;
        overlayRef.current.height = vh;
      }

      const config = modelConfigRef.current;
      config.overlaySize = [vw, vh];

      postMessage(
        { type: 'INFERENCE', config, bitmap, dispatchTime: performance.now() },
        [bitmap],
      );
    } catch {
      markDone();
    }
  }, [postMessage, markDone]);

  // Resume inference after model switch completes
  useEffect(() => {
    if (modelLoading) return;

    if (activeSource === 'camera') {
      startLoop(dispatchFrame);
    } else if (activeSource === 'video') {
      startLoop(dispatchVideoFrame);
    } else if (activeSource === 'image' && imgRef.current) {
      const w = imgRef.current.naturalWidth;
      const h = imgRef.current.naturalHeight;
      if (overlayRef.current) {
        overlayRef.current.width = w;
        overlayRef.current.height = h;
      }
      const config = modelConfigRef.current;
      config.overlaySize = [w, h];
      createImageBitmap(imgRef.current).then((bitmap) => {
        postMessage(
          { type: 'INFERENCE', config, bitmap, dispatchTime: performance.now() },
          [bitmap],
        );
      });
    }
  }, [modelLoading, activeSource, startLoop, dispatchFrame, dispatchVideoFrame, postMessage]);

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
      setTiming(EMPTY_TIMING);
    } else {
      stopLoop();
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
      const success = await openCamera();
      if (success) {
        setActiveSource('camera');
      }
    }
  }, [activeSource, stopLoop, closeCamera, openCamera]);

  const handleCameraLoad = useCallback(() => {
    startLoop(dispatchFrame);
  }, [startLoop, dispatchFrame]);

  // Listen for postMessage from parent iframe (e.g. homepage)
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.action === 'startCamera') {
        handleToggleCamera();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleToggleCamera]);

  // --- Image upload ---
  const handleUploadImage = useCallback((url) => {
    stopLoop();
    closeCamera();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    setActiveSource('image');
    setDetections([]);
    setFps(0);
    setTiming(EMPTY_TIMING);
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
      postMessage(
        { type: 'INFERENCE', config, bitmap, dispatchTime: performance.now() },
        [bitmap],
      );
    });
  }, [postMessage]);

  // --- Video load ---
  const handleLoadVideo = useCallback((url) => {
    stopLoop();
    closeCamera();
    setActiveSource('video');
    setDetections([]);
    setFps(0);
    setTiming(EMPTY_TIMING);
    if (overlayRef.current) {
      overlayRef.current.getContext('2d')?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.play();
    }
  }, [stopLoop, closeCamera]);

  const handleVideoReady = useCallback(() => {
    startLoop(dispatchVideoFrame);
  }, [startLoop, dispatchVideoFrame]);

  const selectedModel = getModelById(selectedModelId);
  const currentTask = selectedModel?.task || 'detect';

  if (webgpuSupported === false) {
    return (
      <div className={`min-h-screen ${isEmbedded ? 'bg-void' : ''}`}>
        {!isEmbedded && <GlowBackground />}
        <div className={`max-w-5xl mx-auto ${isEmbedded ? 'px-2 py-2' : 'px-4 sm:px-6 py-2'}`}>
          {!isEmbedded && <Header />}
          <div className="glass-panel p-8 mt-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-light border border-border flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">WebGPU Not Available</h2>
            <p className="text-text-dim text-sm max-w-md mx-auto mb-4">
              FrameSight requires WebGPU for real-time ML inference. Your browser or device does not support it yet.
            </p>
            <div className="text-left text-xs text-text-muted max-w-sm mx-auto space-y-2">
              <p className="font-medium text-text-dim">To fix this:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use Chrome 113+ or Edge 113+ on desktop</li>
                <li>On Android, try enabling <span className="font-mono text-accent-light">chrome://flags/#enable-unsafe-webgpu</span></li>
                <li>Safari 18+ on macOS also supports WebGPU</li>
              </ul>
            </div>
          </div>
          {!isEmbedded && <Footer />}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isEmbedded ? 'bg-void' : ''}`}>
      {!isEmbedded && <GlowBackground />}

      <div className={`max-w-5xl mx-auto ${isEmbedded ? 'px-2 py-2' : 'px-4 sm:px-6 py-2'}`}>
        {!isEmbedded && <Header />}

        <div className="relative">
          <Viewport
            cameraRef={cameraRef}
            imgRef={imgRef}
            videoRef={videoRef}
            overlayRef={overlayRef}
            imgSrc={imgSrcState}
            activeSource={activeSource}
            onCameraLoad={handleCameraLoad}
            onImageLoad={handleImageLoad}
            onVideoReady={handleVideoReady}
            onStartCamera={handleToggleCamera}
            fps={fps}
            timing={timing}
          />
          <AnimatePresence>
            {modelLoading && <LoadingSpinner />}
          </AnimatePresence>
        </div>

        <ControlBar
          activeSource={activeSource}
          onToggleCamera={handleToggleCamera}
          onUploadImage={handleUploadImage}
          onLoadVideo={handleLoadVideo}
          selectedModel={selectedModelId}
          onModelChange={handleModelChange}
          confidence={confidence}
          onConfidenceChange={setConfidence}
          modelLoading={modelLoading}
          currentTask={currentTask}
        />

        <MetricsBar
          warmupTime={warmupTime}
          timing={timing}
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
