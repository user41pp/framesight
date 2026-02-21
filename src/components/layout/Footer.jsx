export default function Footer() {
  return (
    <footer className="text-center py-6 text-xs text-text-muted">
      <p>
        Built by{' '}
        <a
          href="https://anatolieckert.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-light hover:text-accent transition-colors"
        >
          Anatoli Eckert
        </a>
        {' '}&middot;{' '}
        Models:{' '}
        <span className="text-text-dim">RF-DETR</span> &amp;{' '}
        <span className="text-text-dim">Depth Anything V2</span>
        {' '}&middot;{' '}
        Apache 2.0
      </p>
    </footer>
  );
}
