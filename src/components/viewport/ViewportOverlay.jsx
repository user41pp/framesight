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
          {activeSource === 'camera' && (
            <Row label="FPS" value={fps} color="text-cyan-light" />
          )}
          {timing.total > 0 && (
            <Row label="Total" value={`${timing.total}ms`} color="text-text" />
          )}
          <Row label="Model" value={`${timing.inference}ms`} color="text-accent-light" />
          <Row label="Pre" value={`${timing.preprocess}ms`} color="text-text-dim" />
          <Row label="Post" value={`${timing.postprocess}ms`} color="text-text-dim" />
          <Row label="Decode" value={`${timing.decode}ms`} color="text-text-dim" />
          <Row label="Render" value={`${timing.render}ms`} color="text-text-dim" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Row({ label, value, color }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-text-muted">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
