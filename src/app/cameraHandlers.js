export const stopVideo = (videoRef) => {
  if (videoRef.current && videoRef.current.srcObject) {
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    videoRef.current.srcObject = null;
  }
};

export const startVideo = (videoRef, cameraFacing, setStatusMsg) => {
  stopVideo(videoRef);
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
  })
    .then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    })
    .catch(err => {
      console.error("Camera error:", err);
      if (setStatusMsg) setStatusMsg({ type: 'error', text: "Cannot access camera: " + err.message });
    });
};

export const toggleCameraFacing = (setCameraFacing) => {
  setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
};
