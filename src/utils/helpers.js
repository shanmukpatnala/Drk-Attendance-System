// Utility helper functions

// Compress image to JPEG base64
export const compressImage = (sourceElement) => {
  const canvas = document.createElement('canvas');
  const MAX_WIDTH = 320;
  let width = sourceElement.videoWidth || sourceElement.naturalWidth || sourceElement.width;
  let height = sourceElement.videoHeight || sourceElement.naturalHeight || sourceElement.height;
  if (!width || !height) return null;
  
  const scaleSize = MAX_WIDTH / width;
  canvas.width = MAX_WIDTH;
  canvas.height = Math.round(height * scaleSize);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceElement, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
};

// Convert Firestore Timestamp fields to strings to avoid render errors
export const safeData = (raw) => {
  if (!raw) return raw;
  const safe = { ...raw };
  for (const key in safe) {
    if (safe[key] && typeof safe[key] === 'object' && safe[key].toDate) {
      safe[key] = safe[key].toDate().toISOString();
    }
  }
  return safe;
};

// Hash password (simple crypto approach)
export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Get today's ISO date string
export const getTodayDateId = () => {
  return new Date().toISOString().split('T')[0];
};

// Format time to HH:MM:SS
export const formatTime = () => {
  return new Date().toLocaleTimeString();
};
