import { motion } from 'framer-motion';

export default function LoadingSpinner({ message = 'Loading model...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-void/80 backdrop-blur-sm z-20 rounded-xl"
    >
      <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      <p className="mt-4 text-sm text-text-dim neon-pulse">{message}</p>
    </motion.div>
  );
}
