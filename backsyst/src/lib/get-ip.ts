/**
 * IP Detection Utility
 * Fetches user's IP address from backend API
 */

/**
 * Get user's IP address from backend
 * Returns 'unknown' if unable to fetch
 */
export const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('/api/get-ip');
    
    if (!response.ok) {
      throw new Error('Failed to fetch IP');
    }

    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.error('❌ Error fetching IP:', error);
    // Fallback: try to get from browser (less reliable)
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }
};

/**
 * Validate IP address format
 */
export const isValidIP = (ip: string): boolean => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};
