const GUEST_SESSION_KEY = "sijerman_guest_session";

interface GuestSession {
  sessionId: string;
  createdAt: number;
  previewedCourses: string[]; 
}

export function initGuestSession(): GuestSession {
  const existing = getGuestSession();
  if (existing) return existing;

  const session: GuestSession = {
    sessionId: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    previewedCourses: [],
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

export function getGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(GUEST_SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function trackCoursePreviewed(courseId: string): void {
  let session = getGuestSession();
  if (!session) {
    session = initGuestSession();
  }

  if (!session.previewedCourses.includes(courseId)) {
    session.previewedCourses.push(courseId);
    if (typeof window !== "undefined") {
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    }
  }
}

export function clearGuestSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(GUEST_SESSION_KEY);
  }
}
