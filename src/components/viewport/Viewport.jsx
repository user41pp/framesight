import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ViewportEmpty from './ViewportEmpty';
import ViewportOverlay from './ViewportOverlay';

const Viewport = forwardRef(function Viewport(
  { cameraRef, imgRef, overlayRef, imgSrc, activeSource, onCameraLoad, onImageLoad, onStartCamera, fps, timing },
  ref
) {
  const showEmpty = activeSource === null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="viewport-container neon-glow"
      ref={ref}
    >
      <AnimatePresence mode="wait">
        {showEmpty && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <ViewportEmpty onStartCamera={onStartCamera} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera feed */}
      <video
        ref={cameraRef}
        autoPlay
        playsInline
        muted
        onLoadedData={onCameraLoad}
        className={activeSource === 'camera' ? '' : 'hidden'}
      />

      {/* Static image */}
      {imgSrc && (
        <img
          ref={imgRef}
          src={imgSrc}
          alt="Input"
          onLoad={onImageLoad}
          className={activeSource === 'image' ? '' : 'hidden'}
        />
      )}

      {/* Overlay canvas */}
      <canvas ref={overlayRef} />

      {/* Metrics HUD */}
      <ViewportOverlay fps={fps} timing={timing} activeSource={activeSource} />
    </motion.div>
  );
});

export default Viewport;
