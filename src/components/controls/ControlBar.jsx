import { motion } from 'framer-motion';
import SourcePicker from './SourcePicker';
import ModelSelector from './ModelSelector';
import BackendToggle from './BackendToggle';
import ConfidenceSlider from './ConfidenceSlider';

export default function ControlBar({
  activeSource,
  onToggleCamera,
  onUploadImage,
  selectedModel,
  onModelChange,
  backend,
  onBackendChange,
  confidence,
  onConfidenceChange,
  modelLoading,
  currentTask,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass-panel p-4 mt-4"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Source picker */}
        <SourcePicker
          activeSource={activeSource}
          onToggleCamera={onToggleCamera}
          onUploadImage={onUploadImage}
        />

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-border" />

        {/* Model selector */}
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          disabled={modelLoading}
        />

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-border" />

        {/* Backend toggle */}
        <BackendToggle
          backend={backend}
          onBackendChange={onBackendChange}
          disabled={modelLoading}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Confidence slider (hide for depth) */}
        {currentTask !== 'depth' && (
          <ConfidenceSlider
            value={confidence}
            onChange={onConfidenceChange}
          />
        )}
      </div>
    </motion.div>
  );
}
