export default function MetricCard({ label, value, unit, isText, color = 'text-text' }) {
  return (
    <div className="glass-panel px-2 py-2 sm:px-4 sm:py-3 overflow-hidden">
      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-text-muted mb-0.5 sm:mb-1 truncate">{label}</p>
      {isText ? (
        <p className={`text-xs sm:text-sm font-medium break-words ${color}`}>{value || '--'}</p>
      ) : (
        <p className={`text-sm sm:text-lg font-mono font-semibold ${color}`}>
          {value || '0'}
          {unit && <span className="text-[10px] sm:text-xs text-text-muted ml-0.5">{unit}</span>}
        </p>
      )}
    </div>
  );
}
