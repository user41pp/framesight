import { AnimatePresence, motion } from 'framer-motion';
import DetectionItem from './DetectionItem';

export default function DetectionList({ detections, classes }) {
  if (!detections || detections.length === 0) return null;

  // Filter valid detections (with class names)
  const valid = detections.filter((d) => classes?.[d.classIdx] != null);
  if (valid.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="glass-panel p-4 mt-4"
    >
      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-3">
        Detections ({valid.length})
      </p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {valid.slice(0, 20).map((det, i) => (
            <DetectionItem
              key={`${det.classIdx}-${i}`}
              className={classes[det.classIdx]}
              score={det.score}
              classIdx={det.classIdx}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
