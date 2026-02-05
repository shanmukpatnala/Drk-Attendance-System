import { useState, useRef, useEffect } from 'react';

export function useCamera() {
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('user');
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState('');

  // Start camera
  const startCamera = async (facing = 'user') => {
    try {
      setCameraError('');
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
      setCameraActive(true);
      setCameraFacing(facing);

      return mediaStream;
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError(error.message || 'Failed to access camera');
      setCameraActive(false);
      throw error;
    }
  };

  // Stop camera
  const stopCamera = () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  };

  // Toggle camera facing (front/back)
  const toggleCameraFacing = async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    try {
      await startCamera(newFacing);
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture image from video
  const captureImage = (quality = 0.7) => {
    try {
      if (!videoRef.current) return null;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      ctx.drawImage(videoRef.current, 0, 0);
      
      return canvas.toDataURL('image/jpeg', quality);
    } catch (error) {
      console.error('Error capturing image:', error);
      return null;
    }
  };

  return {
    videoRef,
    cameraActive,
    setCameraActive,
    cameraFacing,
    setCameraFacing,
    stream,
    setStream,
    cameraError,
    setCameraError,
    startCamera,
    stopCamera,
    toggleCameraFacing,
    captureImage
  };
}
