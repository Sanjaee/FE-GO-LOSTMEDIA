import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Navbar } from "@/components/general/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Shield, 
  LogIn, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  Settings
} from "lucide-react";
import Image from "next/image";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#18191A]">
        <Navbar enableSearch={true} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#18191A]">
        <Navbar enableSearch={true} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Silakan login untuk melihat profile
            </p>
            <Button
              onClick={() => {
                const currentPath = router.asPath;
                router.push(`/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`);
              }}
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserTypeLabel = (userType: string) => {
    const labels: Record<string, string> = {
      admin: "Administrator",
      moderator: "Moderator",
      member: "Member",
      premium: "Premium Member",
    };
    return labels[userType] || userType;
  };

  const getLoginTypeLabel = (loginType: string) => {
    const labels: Record<string, string> = {
      google: "Google",
      password: "Email & Password",
      email: "Email",
    };
    return labels[loginType] || loginType;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#18191A]">
      <Navbar enableSearch={true} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card className="mb-6 dark:bg-[#242526] dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white dark:border-gray-800">
                  <AvatarImage
                    src={session.user?.image || ""}
                    alt={session.user?.name || "User"}
                  />
                  <AvatarFallback className="text-2xl md:text-3xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {getInitials(session.user?.name || "User")}
                  </AvatarFallback>
                </Avatar>
                {session.isVerified && (
                  <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-white dark:border-gray-800">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {session.user?.name || "User"}
                  </h1>
                  <Badge
                    variant="secondary"
                    className="w-fit mx-auto md:mx-0 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                  >
                    {getUserTypeLabel(session.userType || session.user?.role || "member")}
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {session.user?.email || ""}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {session.isVerified ? (
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details Card */}
        <Card className="dark:bg-[#242526] dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Informasi Akun
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Name */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Nama
                  </p>
                  <p className="text-base text-gray-900 dark:text-gray-100">
                    {session.user?.name || "Tidak tersedia"}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Email
                  </p>
                  <p className="text-base text-gray-900 dark:text-gray-100">
                    {session.user?.email || "Tidak tersedia"}
                  </p>
                </div>
              </div>

              {/* User Type */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Tipe Akun
                  </p>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  >
                    {getUserTypeLabel(session.userType || session.user?.role || "member")}
                  </Badge>
                </div>
              </div>

              {/* Login Type */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <LogIn className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Metode Login
                  </p>
                  <p className="text-base text-gray-900 dark:text-gray-100">
                    {getLoginTypeLabel(session.loginType || "password")}
                  </p>
                </div>
              </div>

              {/* Verification Status */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  {session.isVerified ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Status Verifikasi
                  </p>
                  <div className="flex items-center gap-2">
                    {session.isVerified ? (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Email Terverifikasi
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Email Belum Terverifikasi
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/update")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Kelola Post Saya
          </Button>
        </div>
      </div>
    </div>
  );
}

