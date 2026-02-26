import { useRef } from 'react';
import GlowButton from '../shared/GlowButton';

export default function SourcePicker({ activeSource, onToggleCamera, onUploadImage, onLoadVideo }) {
  const fileRef = useRef(null);
  const videoFileRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUploadImage(url);
    }
    e.target.value = '';
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onLoadVideo(url);
    }
    e.target.value = '';
  };

  const handleVideoClick = () => {
    if (activeSource === 'video') {
      videoFileRef.current?.click();
    } else {
      onLoadVideo(`${import.meta.env.BASE_URL}videos/Parkour_cut_8-31s.mp4`);
    }
  };

  return (
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
        active={activeSource === 'video'}
        onClick={handleVideoClick}
        icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 3l14 9-14 9V3z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      >
        Video
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

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={videoFileRef}
        type="file"
        accept="video/*"
        onChange={handleVideoFileChange}
        className="hidden"
      />
    </div>
  );
}
