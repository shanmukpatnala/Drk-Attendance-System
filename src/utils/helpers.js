// Utility helper functions

const INDIA_TIME_ZONE = 'Asia/Kolkata';

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

// Hash password with fallback for mobile
export const hashPassword = async (password) => {
  try {
    // Try native Web Crypto API first (desktop)
    if (crypto && crypto.subtle && crypto.subtle.digest) {
      console.log('[HASH] Using Web Crypto API');
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('[HASH] Web Crypto API failed:', e.message);
  }

  // Fallback: Simple hash function for mobile browsers
  console.log('[HASH] Using fallback hash function');
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return 'fallback_' + Math.abs(hash).toString(16);
};

// Get today's ISO date string
export const getTodayDateId = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIME_ZONE
  }).format(new Date());
};

// Format time to HH:MM:SS
export const formatTime = () => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: INDIA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(new Date());
};

export const formatIndiaDate = (date = new Date(), options = {}) => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: INDIA_TIME_ZONE,
    ...options
  }).format(date);
};

export const getIndiaHour = (date = new Date()) => {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: INDIA_TIME_ZONE,
    hour: '2-digit',
    hour12: false
  }).format(date);
  return Number.parseInt(hour, 10);
};

export const getGreetingByIndiaTime = (date = new Date()) => {
  const hour = getIndiaHour(date);

  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};
