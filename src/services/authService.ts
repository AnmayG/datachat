interface User {
  id: string;
  username: string;
  name: string;
  wallet_address?: string;
  profile_pic_url?: string;
  bio?: string;
  created_at: string;
}

interface AuthResponse {
  user: User;
  token: string;
  stream_token: string;
}

interface LoginRequest {
  wallet_address?: string;
  username?: string;
}

interface RegisterRequest {
  username?: string;
  name?: string;
  wallet_address?: string;
  profile_pic_url?: string;
  bio?: string;
}

export class AuthService {
  private baseUrl: string;

  // constructor(baseUrl: string = 'https://api-datachat.loca.lt') {
  //   this.baseUrl = baseUrl;
  // }
  constructor(baseUrl: string = 'https://tucson-mar-single-foul.trycloudflare.com') {
    this.baseUrl = baseUrl;
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Login failed with status: ${response.status}`);
    }

    return response.json();
  }

  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Registration failed with status: ${response.status}`);
    }

    return response.json();
  }

}

export const authService = new AuthService();