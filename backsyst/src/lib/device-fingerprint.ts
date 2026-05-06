/**
 * Device Fingerprinting & Browser Detection Utilities
 * Used for session management and device identification
 */

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  userAgent: string;
}

/**
 * Generate unique device fingerprint based on browser and system info
 * This creates a hash that identifies the device/browser combination
 */
export const generateDeviceFingerprint = (): string => {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width + 'x' + screen.height,
    navigator.hardwareConcurrency || 'unknown',
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16).substring(0, 32);
};

/**
 * Extract browser name from user agent
 */
export const getBrowserName = (): string => {
  const ua = navigator.userAgent;

  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('SamsungBrowser') > -1) return 'Samsung Internet';
  if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
  if (ua.indexOf('Trident') > -1) return 'Internet Explorer';
  if (ua.indexOf('Edge') > -1) return 'Edge';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';

  return 'Unknown Browser';
};

/**
 * Extract operating system from user agent
 */
export const getOSName = (): string => {
  const ua = navigator.userAgent;

  if (ua.indexOf('Win') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'MacOS';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('X11') > -1) return 'UNIX';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS';

  return 'Unknown OS';
};

/**
 * Get human-readable device name
 */
export const getDeviceName = (): string => {
  const browser = getBrowserName();
  const os = getOSName();
  return `${os} - ${browser}`;
};

/**
 * Get full device information
 */
export const getDeviceInfo = (): DeviceInfo => {
  return {
    deviceId: generateDeviceFingerprint(),
    deviceName: getDeviceName(),
    browser: getBrowserName(),
    os: getOSName(),
    userAgent: navigator.userAgent,
  };
};

/**
 * Check if current device matches stored device fingerprint
 * Used for security validation
 */
export const validateDeviceFingerprintMatch = (storedDeviceId: string): boolean => {
  const currentDeviceId = generateDeviceFingerprint();
  return currentDeviceId === storedDeviceId;
};
