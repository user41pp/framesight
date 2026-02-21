import { MODELS } from '../../config/models';

const TASK_LABELS = {
  detect: 'Detect',
  seg: 'Segment',
  depth: 'Depth',
};

export default function ModelSelector({ selectedModel, onModelChange, disabled }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-text-muted whitespace-nowrap">Model</label>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled}
        className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text
                   focus:outline-none focus:border-accent disabled:opacity-50
                   appearance-none cursor-pointer min-w-[160px]"
      >
        {MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} ({TASK_LABELS[model.task]})
          </option>
        ))}
      </select>
    </div>
  );
}
