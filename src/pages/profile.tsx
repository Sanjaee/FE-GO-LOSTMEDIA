import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Navbar } from "@/components/general/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  User, 
  Mail, 
  Shield, 
  LogIn, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  Settings,
  Edit,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function Profile() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<{
    id: string;
    username: string;
    email: string;
    fullName: string;
    profilePhoto?: string;
    isVerified: boolean;
    userType: string;
    loginType: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    profilePic: "",
  });
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");

  // Fetch profile from API so data selalu sesuai server
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.accessToken) {
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) {
          setProfileLoading(false);
          return;
        }

        const data = await res.json();
        // Backend bisa mengembalikan:
        // { success: true, data: { id, username, ... } }
        // atau { success: true, data: { user: { ... } } }
        let user = data.data?.user || data.user;
        if (!user && data.data && data.data.id) {
          user = data.data;
        }

        if (user) {
          setProfile({
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name || user.username,
            profilePhoto: user.profile_photo,
            isVerified: user.is_verified,
            userType: user.user_type,
            loginType: user.login_type,
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [session?.accessToken]);

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

  const handleEditClick = () => {
    if (session) {
      // Get current bio from session if available, or empty string
      const currentBio = ""; // Bio is not in session, will be fetched from API if needed
      setFormData({
        username: profile?.fullName || profile?.username || session.user?.name || "",
        bio: currentBio,
        profilePic: profile?.profilePhoto || session.user?.image || "",
      });
      setSelectedProfileImage(null);
      setProfileImagePreview("");
      setEditDialogOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "File must be an image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Store file for later upload
    setSelectedProfileImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedProfileImage(null);
    setProfileImagePreview("");
    setFormData((prev) => ({
      ...prev,
      profilePic: session?.user?.image || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) {
      toast({
        title: "Error",
        description: "Please login to update profile",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updateData: {
        username?: string;
        bio?: string | null;
        profilePic?: string;
      } = {};

      // Upload profile image if selected
      let finalProfilePic = formData.profilePic;
      if (selectedProfileImage) {
        setUploadingImage(true);
        try {
          // Convert file to base64
          const toBase64 = (file: File) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (error) => reject(error);
            });

          const base64 = await toBase64(selectedProfileImage);
          const res = await fetch("/api/cloudnary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file: base64 }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to upload image");
          }

          finalProfilePic = data.url;
          setUploadingImage(false);
        } catch (uploadError) {
          setUploadingImage(false);
          setLoading(false);
          toast({
            title: "Error",
            description: uploadError instanceof Error ? uploadError.message : "Failed to upload image",
            variant: "destructive",
          });
          return;
        }
      }

      // Prepare update data
      if (formData.username && formData.username !== session.user?.name) {
        updateData.username = formData.username;
      }
      if (formData.bio !== undefined) {
        updateData.bio = formData.bio || null;
      }
      if (finalProfilePic && finalProfilePic !== session.user?.image) {
        updateData.profilePic = finalProfilePic;
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "Info",
          description: "No changes to save",
        });
        setEditDialogOpen(false);
        setLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/v1/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to update profile");
      }

      // Trigger session update to refresh user data (tanpa perlu reload penuh)
      if (update) {
        const newName = updateData.username ?? session.user?.name ?? "";
        const newImage = updateData.profilePic ?? session.user?.image ?? "";

        await update({
          ...session,
          user: {
            ...session.user,
            name: newName,
            image: newImage,
          },
        });
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setEditDialogOpen(false);
      setSelectedProfileImage(null);
      setProfileImagePreview("");
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
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
                    src={profile?.profilePhoto || session.user?.image || ""}
                    alt={profile?.fullName || session.user?.name || "User"}
                  />
                  <AvatarFallback className="text-2xl md:text-3xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {getInitials(profile?.fullName || session.user?.name || "User")}
                  </AvatarFallback>
                </Avatar>
                {(profile?.isVerified ?? session.isVerified) && (
                  <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-white dark:border-gray-800">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {profile?.fullName || session.user?.name || "User"}
                  </h1>
                  <Badge
                    variant="secondary"
                    className="w-fit mx-auto md:mx-0 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                  >
                    {getUserTypeLabel(profile?.userType || session.userType || session.user?.role || "member")}
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {profile?.email || session.user?.email || ""}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {(profile?.isVerified ?? session.isVerified) ? (
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
                    {profile?.fullName || session.user?.name || "Tidak tersedia"}
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
                    {profile?.email || session.user?.email || "Tidak tersedia"}
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
                      {getUserTypeLabel(profile?.userType || session.userType || session.user?.role || "member")}
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
                    {getLoginTypeLabel(profile?.loginType || session.loginType || "password")}
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
                    {(profile?.isVerified ?? session.isVerified) ? (
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
          <Button
            className="flex-1"
            onClick={handleEditClick}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Edit Profile
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Picture Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Profile Picture
              </Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={profileImagePreview || formData.profilePic || session?.user?.image || ""} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {getInitials(formData.username || session?.user?.name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="text-sm"
                      disabled={loading || uploadingImage}
                    />
                    {profileImagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveImage}
                        disabled={loading || uploadingImage}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Max 5MB. JPG, PNG, or GIF. Image will be uploaded when you save.
                  </p>
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter username"
                minLength={3}
                maxLength={50}
                className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Min 3, max 50 characters
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Bio
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                maxLength={500}
                rows={4}
                className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formData.bio.length}/500 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

