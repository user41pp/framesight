import { useState } from 'react';

export default function BackendToggle({ backend, onBackendChange, disabled }) {
  const [showWasmWarning, setShowWasmWarning] = useState(false);

  const handleWasmClick = () => {
    if (backend === 'wasm') return;
    setShowWasmWarning(true);
  };

  const confirmWasm = () => {
    setShowWasmWarning(false);
    onBackendChange('wasm');
  };

  return (
    <div className="relative flex items-center gap-1 bg-surface rounded-lg p-0.5 border border-border">
      <button
        onClick={handleWasmClick}
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
        onClick={() => { setShowWasmWarning(false); onBackendChange('webgpu'); }}
        disabled={disabled}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
          backend === 'webgpu'
            ? 'bg-cyan text-white shadow-sm'
            : 'text-text-muted hover:text-text'
        } disabled:opacity-50`}
      >
        WebGPU
      </button>

      {showWasmWarning && (
        <div className="absolute top-full mt-2 right-0 z-30 w-64 glass-panel p-3 text-xs">
          <p className="text-amber-400 font-medium mb-1">CPU-only backend</p>
          <p className="text-text-dim mb-2">
            WASM runs on CPU and will be very slow (~10s per frame). Use WebGPU for real-time inference.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmWasm}
              className="px-2 py-1 rounded bg-amber-400/20 text-amber-400 hover:bg-amber-400/30 transition-colors"
            >
              Switch anyway
            </button>
            <button
              onClick={() => setShowWasmWarning(false)}
              className="px-2 py-1 rounded text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
