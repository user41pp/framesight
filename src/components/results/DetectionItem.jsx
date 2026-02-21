import { motion } from 'framer-motion';
import { getNeonColorCSS } from '../../config/colors';

export default function DetectionItem({ className, score, classIdx }) {
  const color = getNeonColorCSS(classIdx, 1.0);
  const pct = Math.round(score * 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-3 py-1"
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm text-text flex-shrink-0 min-w-[80px]">
        {className}
      </span>
      <span className="font-mono text-xs text-text-dim w-10 text-right flex-shrink-0">
        {score.toFixed(2)}
      </span>
      <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}
