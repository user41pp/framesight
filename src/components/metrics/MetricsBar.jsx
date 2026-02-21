import { motion } from 'framer-motion';
import MetricCard from './MetricCard';

export default function MetricsBar({ warmupTime, timing, statusMsg, modelLoading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="space-y-3 mt-4"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Status"
          value={statusMsg}
          isText
          color={modelLoading ? 'text-amber-400' : 'text-cyan'}
        />
        <MetricCard
          label="Load Time"
          value={warmupTime}
          unit="ms"
          color="text-accent-light"
        />
        <MetricCard
          label="Model"
          value={timing.inference}
          unit="ms"
          color="text-magenta-light"
        />
        <MetricCard
          label="Total"
          value={timing.total}
          unit="ms"
          color="text-cyan-light"
        />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Decode"
          value={timing.decode}
          unit="ms"
          color="text-text-dim"
        />
        <MetricCard
          label="Preprocess"
          value={timing.preprocess}
          unit="ms"
          color="text-text-dim"
        />
        <MetricCard
          label="Postprocess"
          value={timing.postprocess}
          unit="ms"
          color="text-text-dim"
        />
        <MetricCard
          label="Render"
          value={timing.render}
          unit="ms"
          color="text-text-dim"
        />
      </div>
    </motion.div>
  );
}
