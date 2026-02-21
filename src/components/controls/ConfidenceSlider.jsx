export default function ConfidenceSlider({ value, onChange }) {
  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <label className="text-xs text-text-muted whitespace-nowrap">Confidence</label>
      <input
        type="range"
        min="0.05"
        max="0.95"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1.5 bg-border rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3.5
                   [&::-webkit-slider-thumb]:h-3.5
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-accent
                   [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(99,102,241,0.5)]
                   [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <span className="text-xs font-mono text-accent-light w-8 text-right">
        {value.toFixed(2)}
      </span>
    </div>
  );
}
