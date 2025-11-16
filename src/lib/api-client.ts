// Enhanced API client with JWT token management
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface User {
  id: string;
  email: string;
  username?: string;
  phone?: string;
  full_name: string;
  user_type: string;
  profile_photo?: string;
  date_of_birth?: string;
  gender?: string;
  is_active?: boolean;
  is_verified: boolean;
  last_login?: string;
  login_type: string;
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
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  user_type: string;
  gender?: string;
  date_of_birth?: string;
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
}

export interface OTPVerifyResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface Post {
  postId: string;
  userId: string;
  title: string;
  description?: string;
  content?: string;
  category: string;
  mediaUrl?: string;
  blurred: boolean;
  viewsCount: number;
  likesCount: number;
  sharesCount: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  isPublished: boolean;
  scheduledAt?: string;
  isScheduled: boolean;
  user?: User;
}

export interface CreatePostRequest {
  title: string;
  description?: string;
  content?: string;
  category: string;
  mediaUrl?: string;
  blurred?: boolean;
  isPublished?: boolean;
}

export interface UpdatePostRequest {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  mediaUrl?: string;
  blurred?: boolean;
  isPublished?: boolean;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SearchPostsRequest {
  q: string;
  limit?: number;
  offset?: number;
}

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  product_id: string;
  amount: number;
  admin_fee: number;
  total_amount: number;
  payment_method: string;
  payment_type: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "EXPIRED";
  notes?: string;
  snap_redirect_url?: string;
  midtrans_transaction_id?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_code?: string;
  va_number?: string;
  bank_type?: string;
  expiry_time?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  user: User;
  product?: {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    is_active: boolean;
  };
  actions?: Array<{
    name: string;
    method: string;
    url: string;
  }>;
}

export interface CreatePaymentRequest {
  product_id: string;
  amount: number;
  admin_fee: number;
  payment_method: string;
  bank_type?: string;
  notes?: string;
}

export interface PaymentListResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ResendOTPResponse {
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface VerifyResetPasswordRequest {
  email: string;
  otp_code: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerifyResetPasswordResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Product interfaces
export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  user: User;
  name: string;
  description: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  next_cursor?: string;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  cursor?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  is_active?: boolean;
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Set access token for authenticated requests
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken;
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

    // Add Authorization header if access token is available
    if (this.accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.accessToken}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Extract error message from nested error object if present
        // Handle format: { error: { code: "...", message: "..." } }
        let errorMessage = errorData.message || 
                          errorData.error?.message ||
                          (typeof errorData.error === 'string' ? errorData.error : null) ||
                          `HTTP ${response.status}: ${response.statusText}`;

        // Handle data wrapper if present: { data: { error: { message: "..." } } }
        if (errorData.data && typeof errorData.data === 'object') {
          errorMessage = errorData.data.message || 
                        errorData.data.error?.message || 
                        errorMessage;
        }

        // Ensure we have a string message, not an object
        if (typeof errorMessage !== 'string') {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        // Create error with response data preserved
        const error = new Error(errorMessage) as Error & {
          response?: {
            status: number;
            data: unknown;
          };
        };

        // Preserve response data for frontend error handling
        error.response = {
          status: response.status,
          data: errorData,
        };

        throw error;
      }

      const data = await response.json();
      
      // Unwrap data if response is wrapped in { data: ... }
      if (data.data) {
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

  async googleOAuth(data: {
    email: string;
    full_name: string;
    profile_photo: string;
    google_id: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/google-oauth", {
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

  async requestResetPassword(
    data: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    return this.request<ResetPasswordResponse>(
      "/api/v1/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  // Verify reset password token (just checks if token is valid)
  async verifyResetPasswordToken(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/v1/auth/verify-reset-password", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async verifyResetPassword(
    data: VerifyResetPasswordRequest
  ): Promise<VerifyResetPasswordResponse> {
    return this.request<VerifyResetPasswordResponse>(
      "/api/v1/auth/verify-reset-password",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  // Reset password endpoint
  async resetPassword(data: { token: string; newPassword: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: data.token, newPassword: data.newPassword }),
    });
  }

  // Verify email endpoint
  async verifyEmail(token: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  // Protected endpoints
  async getProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>("/api/v1/user/profile", {
      method: "GET",
    });
  }

  async updateProfile(data: {
    full_name?: string;
    phone?: string;
    gender?: string;
    date_of_birth?: string;
  }): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>(
      "/api/v1/user/profile",
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  // Post endpoints
  async getPosts(page: number = 1, limit: number = 20): Promise<PostListResponse> {
    return this.request<PostListResponse>(
      `/api/v1/posts?page=${page}&limit=${limit}`,
      {
        method: "GET",
      }
    );
  }

  async getPost(postId: string): Promise<Post> {
    return this.request<Post>(`/api/v1/posts/${postId}`, {
      method: "GET",
    });
  }

  async createPost(data: CreatePostRequest): Promise<Post> {
    return this.request<Post>("/api/v1/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePost(postId: string, data: UpdatePostRequest): Promise<Post> {
    return this.request<Post>(`/api/v1/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePost(postId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/posts/${postId}`, {
      method: "DELETE",
    });
  }

  async searchPosts(params: SearchPostsRequest): Promise<PostListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("q", params.q);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset !== undefined) queryParams.append("offset", params.offset.toString());

    const response = await this.request<{
      success: boolean;
      data: {
        posts: Post[];
        total: number;
        limit: number;
        offset: number;
      };
    }>(
      `/api/v1/search/posts?${queryParams.toString()}`,
      {
        method: "GET",
      }
    );

    // Transform response to PostListResponse format
    // Backend returns: { success: true, data: { posts: [], total: 0, limit: 10, offset: 0 } }
    // this.request already unwraps data.data, so response should be { posts: [], total: 0, ... }
    // But handle both cases: unwrapped and wrapped
    interface SearchResponseData {
      posts?: Post[];
      total?: number;
      limit?: number;
      offset?: number;
      data?: SearchResponseData;
    }
    
    const responseTyped = response as SearchResponseData;
    let responseData: SearchResponseData = responseTyped;
    
    // If response has a data property, use it (in case unwrap didn't happen)
    if (responseTyped.data && typeof responseTyped.data === 'object') {
      responseData = responseTyped.data;
    }
    
    const posts = responseData.posts || [];
    const total = responseData.total || 0;
    const limit = responseData.limit || 10;
    const offset = responseData.offset || 0;

    return {
      posts: posts,
      total: total,
      page: limit > 0 ? Math.floor(offset / limit) + 1 : 1,
      limit: limit,
      hasMore: offset + limit < total,
    };
  }

  async getPostsByCategory(
    category: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PostListResponse> {
    return this.request<PostListResponse>(
      `/api/v1/posts/category/${category}?page=${page}&limit=${limit}`,
      {
        method: "GET",
      }
    );
  }

  async getUserPosts(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PostListResponse> {
    return this.request<PostListResponse>(
      `/api/v1/users/${userId}/posts?page=${page}&limit=${limit}`,
      {
        method: "GET",
      }
    );
  }

}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

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
      const response = await apiClient.refreshToken(refreshToken);
      this.setTokens(response.access_token, response.refresh_token);
      return response.access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearTokens();
      return null;
    }
  }
}
