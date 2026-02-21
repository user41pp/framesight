import { motion } from 'framer-motion';
import MetricCard from './MetricCard';

export default function MetricsBar({ warmupTime, inferenceTime, statusMsg, modelLoading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="grid grid-cols-3 gap-3 mt-4"
    >
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
        label="Inference"
        value={inferenceTime}
        unit="ms"
        color="text-magenta-light"
      />
    </motion.div>
  );
}
