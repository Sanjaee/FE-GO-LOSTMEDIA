// API configuration for Go microservice
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface User {
  id: string;
  username: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  requires_verification?: boolean;
  verification_token?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OTPVerifyRequest {
  email: string;
  otp_code: string;
}

export interface ResendOTPRequest {
  email: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  verification_token?: string;
  requires_verification: boolean;
}

export interface OTPVerifyResponse {
  message?: string;
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface ResendOTPResponse {
  message: string;
  otp: string; // For development - remove in production
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Extract error message from nested error object
        // Handle format: { error: { code: "...", message: "..." } }
        let errorMessage = errorData.error?.message || 
                          (typeof errorData.error === 'string' ? errorData.error : null) ||
                          errorData.message ||
                          `HTTP ${response.status}: ${response.statusText}`;

        // Ensure we have a string message
        if (typeof errorMessage !== 'string') {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        // Handle specific error cases
        if (response.status === 409) {
          throw new Error(errorMessage || "User with this email or username already exists");
        } else if (response.status === 400) {
          throw new Error(errorMessage || "Invalid request data");
        } else if (response.status === 401) {
          throw new Error(errorMessage || "Unauthorized");
        } else if (response.status === 404) {
          throw new Error(errorMessage || "Resource not found");
        } else if (response.status === 500) {
          throw new Error(errorMessage || "Internal server error");
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Unwrap data if response is wrapped in { data: ... }
      if (data.data && typeof data.data === 'object') {
        return data.data;
      }
      
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyOTP(data: OTPVerifyRequest): Promise<OTPVerifyResponse> {
    return this.request<OTPVerifyResponse>("/api/v1/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async resendOTP(data: ResendOTPRequest): Promise<ResendOTPResponse> {
    return this.request<ResendOTPResponse>("/api/v1/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  // Protected endpoints
  async getProfile(accessToken: string): Promise<{ user: User }> {
    return this.request<{ user: User }>("/api/v1/user/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async updateProfile(
    accessToken: string,
    data: { username?: string }
  ): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>(
      "/api/v1/user/profile",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      }
    );
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.request<{ status: string; service: string }>("/health");
  }
}

// Create API client instance
export const api = new ApiClient(API_BASE_URL);

// Token management utilities
export class TokenManager {
  private static ACCESS_TOKEN_KEY = "access_token";
  private static REFRESH_TOKEN_KEY = "refresh_token";

  static setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  static getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  static clearTokens(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  static async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await api.refreshToken(refreshToken);
      this.setTokens(response.access_token, response.refresh_token);
      return response.access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearTokens();
      return null;
    }
  }
}
