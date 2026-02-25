import { useRef, useState } from 'react';
import GlowButton from '../shared/GlowButton';

const DEFAULT_YOUTUBE_URL = 'https://www.youtube.com/watch?v=0Kvw2BPKjz0';

export default function SourcePicker({ activeSource, onToggleCamera, onUploadImage, onLoadYouTube }) {
  const fileRef = useRef(null);
  const [youtubeUrl, setYoutubeUrl] = useState(DEFAULT_YOUTUBE_URL);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUploadImage(url);
    }
    e.target.value = '';
  };

  const handleYoutubeClick = () => {
    if (activeSource === 'youtube') {
      // Already active — toggle off handled by parent via camera/image switch
      setShowYoutubeInput(false);
    } else {
      setShowYoutubeInput((prev) => !prev);
    }
  };

  const handleYoutubeSubmit = () => {
    if (youtubeUrl.trim()) {
      onLoadYouTube(youtubeUrl.trim());
      setShowYoutubeInput(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleYoutubeSubmit();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <GlowButton
          active={activeSource === 'camera'}
          onClick={onToggleCamera}
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          Camera
        </GlowButton>

        <GlowButton
          active={activeSource === 'image'}
          onClick={() => fileRef.current?.click()}
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          Image
        </GlowButton>

        <GlowButton
          active={activeSource === 'youtube' || showYoutubeInput}
          onClick={handleYoutubeClick}
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          YouTube
        </GlowButton>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {showYoutubeInput && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="YouTube URL"
            className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-sm bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50"
          />
          <button
            onClick={handleYoutubeSubmit}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent/20 text-accent-light border border-accent/40 hover:bg-accent/30 transition-colors"
          >
            Load
          </button>
        </div>
      )}
    </div>
  );
}
