import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username?: string; // Alias for name
      image?: string;
      isVerified?: boolean;
      role?: string; // Alias for userType
    };
    accessToken: string;
    refreshToken: string;
    isVerified: boolean;
    userType: string;
    loginType: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    accessToken: string;
    refreshToken: string;
    isVerified: boolean;
    userType: string;
    loginType: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    isVerified: boolean;
    userType: string;
    loginType: string;
    image?: string;
  }
}
