/**
 * Session Management Utilities
 * Handles session creation, validation, and token refresh logic
 */

import { supabase } from './supabase';
import { getDeviceInfo, DeviceInfo } from './device-fingerprint';

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
 * Create a new session with 2-hour expiration
 * Session automatically expires after 2 hours
 */
export const createSession = async (params: CreateSessionParams): Promise<SessionData | null> => {
  try {
    const deviceInfo = getDeviceInfo();

    // Calculate expiration time (2 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    console.log('📝 Creating session with:', {
      user_id: params.user_id,
      device_id: deviceInfo.deviceId,
      ip_address: params.ip_address,
      expires_at: expiresAt.toISOString(),
    });

    const { data, error } = await supabase
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

    if (error) {
      console.error('❌ Session creation error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2),
        deviceInfo: JSON.stringify(deviceInfo, null, 2),
        params: JSON.stringify(params, null, 2)
      });
      // Throw the error to trigger fallback
      throw new Error(`Session creation failed: ${error.message}`);
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

/**
 * Check active sessions for user and enforce concurrent device limit (max 3)
 * If limit exceeded, logout oldest session
 */
export const enforceSessionLimit = async (userId: string, maxDevices: number = 3): Promise<void> => {
  try {
    // Get all active sessions ordered by creation date
    const { data: sessions, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching sessions:', fetchError.message);
      return;
    }

    // If exceeds limit, deactivate oldest sessions
    if (sessions && sessions.length > maxDevices) {
      const sessionsToDeactivate = sessions.slice(0, sessions.length - maxDevices);

      for (const session of sessionsToDeactivate) {
        const { error: updateError } = await supabase
          .from('sessions')
          .update({ is_active: false })
          .eq('id', session.id);

        if (updateError) {
          console.error('❌ Error deactivating session:', updateError.message);
        } else {
          console.log('✅ Deactivated old session:', session.id);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error enforcing session limit:', error);
  }
};

/**
 * Update last activity timestamp for a session
 * Used to track user engagement and prevent premature timeout
 */
export const updateSessionActivity = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('❌ Error updating session activity:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error updating activity:', error);
    return false;
  }
};

/**
 * Log session activity for audit trail
 * Records login, logout, and other important actions
 */
export const logSessionActivity = async (
  sessionId: string,
  action: 'login' | 'logout' | 'activity' | 'token_refresh' | 'device_change',
  ipAddress: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('session_activities').insert({
      session_id: sessionId,
      action,
      ip_address: ipAddress,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error('❌ Error logging activity:', error.message);
      return false;
    }

    console.log(`✅ Activity logged: ${action}`);
    return true;
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    return false;
  }
};

/**
 * Check if session is expired
 */
export const isSessionExpired = (expiresAt: string): boolean => {
  return new Date() > new Date(expiresAt);
};

/**
 * Invalidate (logout) a session
 */
export const invalidateSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) {
      console.error('❌ Error invalidating session:', error.message);
      return false;
    }

    console.log('✅ Session invalidated:', sessionId);
    return true;
  } catch (error) {
    console.error('❌ Error invalidating session:', error);
    return false;
  }
};

/**
 * Get active sessions for a user
 */
export const getUserActiveSessions = async (userId: string): Promise<SessionData[]> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching user sessions:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    return [];
  }
};

/**
 * Validate session is still active and not expired
 */
export const validateSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('is_active, expires_at')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('❌ Error validating session:', error.message);
      return false;
    }

    if (!data) {
      console.error('❌ Session not found');
      return false;
    }

    const isValid = data.is_active && !isSessionExpired(data.expires_at);

    if (!isValid) {
      await invalidateSession(sessionId);
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error validating session:', error);
    return false;
  }
};
