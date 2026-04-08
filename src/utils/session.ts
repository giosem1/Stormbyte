import type { User } from "../types/types";

const SESSION_KEY = "session";

export interface Session {
  token: string;
  user: User;
}
export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getUser(): User | null {
  const session = getSession();
  return session?.user ?? null;
}

export function getToken(): string | null {
  const session = getSession();
  return session?.token ?? null;
}

export function isAuthenticated(): boolean {
  const session = getSession();
  if (!session) return false;

  if(isTokenExpired()) {
    clearSession()
    return false;
  }

  return true;
}

export function requireUser(): User{
  const user = getUser();
  if (!user){
    throw new Error("User not authenticated");
  }
  return user;
}

export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}