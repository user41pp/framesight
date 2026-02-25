import { AnimatePresence, motion } from 'framer-motion';

export default function ViewportOverlay({ fps, timing, activeSource }) {
  if (!activeSource) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="absolute top-3 right-3 z-10"
      >
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50 font-mono text-[11px] leading-relaxed">
          <div className="flex items-center justify-between gap-4">
            <span className="text-text-muted">Model</span>
            <span className="font-semibold text-accent-light">{timing.inference}ms</span>
          </div>
          {(activeSource === 'camera' || activeSource === 'youtube') && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-text-muted">FPS</span>
              <span className="font-semibold text-cyan-light">{fps}</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
