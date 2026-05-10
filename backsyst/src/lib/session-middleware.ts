// @ts-nocheck
/**
 * Session Validation Middleware
 * Use this to protect authenticated routes
 * Can be used in API routes and client components
 */

import { supabase } from './supabase';
import { isSessionExpired, invalidateSession } from './session-manager';

/**
 * Validate session and check if expired
 * Returns true if session is valid, false if expired or invalid
 */
export const validateSessionMiddleware = async (sessionId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('is_active, expires_at')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      console.warn('❌ Session not found:', sessionId);
      return false;
    }

    // Check if session is still active
    if (!data.is_active) {
      console.warn('❌ Session is not active:', sessionId);
      return false;
    }

    // Check if session is expired
    if (isSessionExpired(data.expires_at)) {
      console.warn('❌ Session has expired:', sessionId);
      await invalidateSession(sessionId);
      return false;
    }

    // Session is valid
    console.log('✅ Session is valid:', sessionId);
    return true;
  } catch (error) {
    console.error('❌ Error validating session:', error);
    return false;
  }
};

/**
 * Get current session for logged-in user
 */
export const getCurrentSession = async (userId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('❌ No active session found for user:', userId);
      return null;
    }

    // Verify not expired
    if (isSessionExpired(data.expires_at)) {
      await invalidateSession(data.id);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error getting current session:', error);
    return null;
  }
};

/**
 * Extend session expiration time (token refresh)
 * Adds another 2 hours when called
 */
export const extendSessionExpiration = async (sessionId: string): Promise<boolean> => {
  try {
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 2);

    const { error } = await supabase
      .from('sessions')
      .update({
        expires_at: newExpiresAt.toISOString(),
        last_activity: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('❌ Error extending session:', error);
      return false;
    }

    console.log('✅ Session extended:', sessionId);
    return true;
  } catch (error) {
    console.error('❌ Error extending session:', error);
    return false;
  }
};

/**
 * Verify user authentication status
 * Checks if user has valid session
 */
export const verifyUserAuthentication = async (): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  sessionId?: string;
}> => {
  try {
    // Get current user from Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      console.warn('❌ User not authenticated');
      return { isAuthenticated: false };
    }

    const userId = authData.user.id;

    // Get active session
    const session = await getCurrentSession(userId);

    if (!session) {
      console.warn('❌ No valid session for authenticated user');
      return { isAuthenticated: false, userId };
    }

    return {
      isAuthenticated: true,
      userId,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('❌ Error verifying authentication:', error);
    return { isAuthenticated: false };
  }
};

/**
 * Logout user by invalidating all sessions
 */
export const logoutUser = async (userId: string): Promise<boolean> => {
  try {
    // Get all active sessions for user
    const { data: sessions, error: fetchError } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ Error fetching sessions:', fetchError);
      return false;
    }

    if (!sessions || sessions.length === 0) {
      console.log('ℹ️ No active sessions to logout');
      return true;
    }

    // Invalidate all sessions
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (updateError) {
      console.error('❌ Error logging out:', updateError);
      return false;
    }

    console.log('✅ User logged out from all devices:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error during logout:', error);
    return false;
  }
};

/**
 * Get session details for security display
 */
export const getSessionDetails = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      deviceName: data.device_name,
      browser: data.browser,
      os: data.os,
      ipAddress: data.ip_address,
      lastActivity: new Date(data.last_activity),
      expiresAt: new Date(data.expires_at),
      isActive: data.is_active,
    };
  } catch (error) {
    console.error('❌ Error getting session details:', error);
    return null;
  }
};
