export default function GlowButton({ children, onClick, active, disabled, icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${active
          ? 'bg-accent/20 text-accent-light border border-accent/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
          : 'bg-surface border border-border text-text-dim hover:text-text hover:border-border-light'
        }
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {icon}
      {children}
    </button>
  );
}
