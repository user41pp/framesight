export default function BackendToggle({ backend, onBackendChange, disabled }) {
  return (
    <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5 border border-border">
      <button
        onClick={() => onBackendChange('wasm')}
        disabled={disabled}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
          backend === 'wasm'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-muted hover:text-text'
        } disabled:opacity-50`}
      >
        WASM
      </button>
      <button
        onClick={() => onBackendChange('webgpu')}
        disabled={disabled}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
          backend === 'webgpu'
            ? 'bg-cyan text-white shadow-sm'
            : 'text-text-muted hover:text-text'
        } disabled:opacity-50`}
      >
        WebGPU
      </button>
    </div>
  );
}
