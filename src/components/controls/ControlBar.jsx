import { motion } from 'framer-motion';
import SourcePicker from './SourcePicker';
import ModelSelector from './ModelSelector';
import ConfidenceSlider from './ConfidenceSlider';

export default function ControlBar({
  activeSource,
  onToggleCamera,
  onUploadImage,
  onLoadVideo,
  selectedModel,
  onModelChange,
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
        <SourcePicker
          activeSource={activeSource}
          onToggleCamera={onToggleCamera}
          onUploadImage={onUploadImage}
          onLoadVideo={onLoadVideo}
        />

        <div className="hidden sm:block w-px h-8 bg-border" />

        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          disabled={modelLoading}
        />

        <div className="flex-1" />

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
