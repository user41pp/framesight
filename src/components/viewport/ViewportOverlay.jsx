import { AnimatePresence, motion } from 'framer-motion';

export default function ViewportOverlay({ fps, inferenceTime, activeSource }) {
  if (!activeSource) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="absolute top-3 right-3 z-10"
      >
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50 font-mono text-xs space-y-0.5">
          {activeSource === 'camera' && (
            <div className="flex items-center gap-2">
              <span className="text-text-muted">FPS</span>
              <span className="text-cyan-light font-semibold">{fps}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-text-muted">Inference</span>
            <span className="text-accent-light font-semibold">{inferenceTime}ms</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
