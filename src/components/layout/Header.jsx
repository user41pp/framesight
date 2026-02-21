import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center pt-8 pb-6"
    >
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
        <span className="bg-gradient-to-r from-accent-light via-cyan to-magenta-light bg-clip-text text-transparent">
          FrameSight
        </span>
      </h1>
      <p className="mt-2 text-text-dim text-sm sm:text-base max-w-lg mx-auto">
        Real-time computer vision in the browser. Detection, segmentation &amp; depth estimation
        powered by{' '}
        <span className="text-cyan font-medium">ONNX Runtime Web</span>.
      </p>
      <div className="mt-3 flex items-center justify-center gap-3">
        <a
          href="https://github.com/user41pp/framesight"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-muted hover:text-accent-light transition-colors"
        >
          GitHub
        </a>
        <span className="text-border">|</span>
        <span className="text-xs text-text-muted font-mono">v{__APP_VERSION__}</span>
      </div>
    </motion.header>
  );
}
