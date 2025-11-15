import React, { useEffect } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { LoginForm } from "@/components/auth/LoginForm";
import { toast } from "@/hooks/use-toast";

const LoginPage = () => {
  const router = useRouter();

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const { error } = router.query;

    if (error) {
      let errorMessage = "An error occurred during authentication";

      switch (error) {
        case "AccessDenied":
          errorMessage =
            "Email ini sudah terdaftar dengan password. Silakan login dengan email dan password.";
          break;
        case "Configuration":
          errorMessage = "Terjadi masalah pada konfigurasi server. Silakan hubungi admin.";
          break;
        case "Verification":
          errorMessage =
            "Token verifikasi sudah kedaluwarsa atau sudah digunakan.";
          break;
        case "CredentialsSignin":
          errorMessage =
            "Email ini sudah terdaftar dengan Google. Silakan gunakan Google Sign In.";
          break;
        default:
          errorMessage = typeof error === 'string' ? error : "Terjadi kesalahan saat autentikasi. Silakan coba lagi.";
      }

      toast({
        title: "❌ Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Clean up the URL by removing the error parameter
      router.replace("/auth/login", undefined, { shallow: true });
    }
  }, [router]);

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        // Get callback URL from query params or default to dashboard
        const callbackUrl =
          (router.query.callbackUrl as string) || "/";
        router.push(callbackUrl);
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
};

export default LoginPage;
