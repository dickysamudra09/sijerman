/**
 * Simplified Session Management (No Device Fingerprinting)
 * Fallback for environments where device APIs fail
 */

import { supabase } from './supabase';

export interface SessionData {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
  created_at: string;
  expires_at: string;
  last_activity: string;
}

export interface CreateSessionParams {
  user_id: string;
  ip_address: string;
}

/**
 * Create a new session with simplified device info
 * Fallback version that doesn't use device fingerprinting
 */
export const createSessionSimple = async (params: CreateSessionParams): Promise<SessionData | null> => {
  try {
    console.log('📝 Creating simplified session with:', {
      user_id: params.user_id,
      ip_address: params.ip_address,
    });

    // Calculate expiration time (2 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    // Simplified device info without browser APIs
    // Use a stable device ID based on user ID + browser signature
    const userSignature = typeof navigator !== 'undefined' ? 
      navigator.userAgent?.slice(0, 50) || 'unknown' : 'unknown';
    
    const deviceInfo = {
      deviceId: 'web-' + params.user_id.slice(0, 8) + '-' + userSignature.slice(0, 20),
      deviceName: 'Web Browser',
      browser: 'Unknown',
      os: 'Unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    };

    console.log('📝 Device info:', deviceInfo);

    // Check if session already exists for this user/device
    const { data: existingSession, error: checkError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', params.user_id)
      .eq('device_id', deviceInfo.deviceId)
      .eq('is_active', true)
      .single();

    let data, error;
    
    if (existingSession && !checkError) {
      // Update existing session
      console.log('🔄 Updating existing session:', existingSession.id);
      const updateResult = await supabase
        .from('sessions')
        .update({
          ip_address: params.ip_address,
          user_agent: deviceInfo.userAgent,
          last_activity: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', existingSession.id)
        .select()
        .single();
      
      data = updateResult.data;
      error = updateResult.error;
    } else {
      // Create new session
      console.log('🆕 Creating new session');
      const insertResult = await supabase
        .from('sessions')
        .insert([{
          user_id: params.user_id,
          device_id: deviceInfo.deviceId,
          device_name: deviceInfo.deviceName,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          ip_address: params.ip_address,
          user_agent: deviceInfo.userAgent,
          is_active: true,
          expires_at: expiresAt.toISOString(),
          last_activity: new Date().toISOString(),
        }])
        .select();
      
      data = insertResult.data;
      error = insertResult.error;
    }

    if (error) {
      console.error('❌ Session creation error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    if (!data || data.length === 0) {
      console.error('❌ No data returned from session insert');
      return null;
    }

    console.log('✅ Session created:', data[0]);
    return data[0];
  } catch (error) {
    console.error('❌ Error creating session:', error);
    return null;
  }
};
