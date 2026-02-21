import { useState, useCallback } from 'react';

export function useWebcam(videoRef) {
  const [cameraStatus, setCameraStatus] = useState('');

  const openCamera = useCallback(async () => {
    if (!videoRef.current) return false;

    try {
      setCameraStatus('Opening camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      setCameraStatus('');
      return true;
    } catch (err) {
      // Try any camera as fallback
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        videoRef.current.srcObject = fallback;
        setCameraStatus('');
        return true;
      } catch (fallbackErr) {
        setCameraStatus(
          fallbackErr.name === 'NotAllowedError'
            ? 'Camera permission denied'
            : `Camera error: ${fallbackErr.message}`
        );
        return false;
      }
    }
  }, [videoRef]);

  const closeCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraStatus('');
  }, [videoRef]);

  return { openCamera, closeCamera, cameraStatus };
}
