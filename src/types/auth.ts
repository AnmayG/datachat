export interface UserInfo {
  id: string;
  name: string;
  image?: string;
  token?: string;
  streamToken?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  user: { id: string; name?: string; image?: string } | null;
  token?: string;
  streamToken?: string;
}

export interface OnboardingPreferences {
  displayName: string;
  avatar?: string;
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
}