export default function MetricCard({ label, value, unit, isText, color = 'text-text' }) {
  return (
    <div className="glass-panel px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">{label}</p>
      {isText ? (
        <p className={`text-sm font-medium break-words ${color}`}>{value || '--'}</p>
      ) : (
        <p className={`text-lg font-mono font-semibold ${color}`}>
          {value || '0'}
          {unit && <span className="text-xs text-text-muted ml-1">{unit}</span>}
        </p>
      )}
    </div>
  );
}
