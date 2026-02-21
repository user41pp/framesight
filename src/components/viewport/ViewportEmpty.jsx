export default function ViewportEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-surface-light border border-border flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-text-dim text-sm">
        Start your camera or upload an image to begin
      </p>
      <p className="text-text-muted text-xs mt-1">
        All processing happens locally in your browser
      </p>
    </div>
  );
}
