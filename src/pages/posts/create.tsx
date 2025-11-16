import { useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useApi } from "@/components/contex/ApiProvider";
import { Navbar } from "@/components/general/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuth";

export default function CreatePost() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { apiClient } = useApi();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: "",
    mediaUrl: "",
    blurred: false,
    isPublished: true,
  });

  useRequireAuth();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Judul harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category.trim()) {
      toast({
        title: "Error",
        description: "Kategori harus diisi",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await apiClient.createPost({
        title: formData.title,
        description: formData.description || undefined,
        content: formData.content || undefined,
        category: formData.category,
        mediaUrl: formData.mediaUrl || undefined,
        blurred: formData.blurred,
        isPublished: formData.isPublished,
      });

      toast({
        title: "✅ Post Berhasil Dibuat!",
        description: "Post Anda telah berhasil dibuat.",
      });

      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "❌ Gagal Membuat Post",
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat membuat post. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 dark:text-gray-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl dark:text-gray-50">Buat Post Baru</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Bagikan cerita atau konten menarik Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Judul *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Masukkan judul post"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={500}
                  disabled={loading}
                  className="dark:bg-gray-900 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Input
                  id="category"
                  name="category"
                  type="text"
                  placeholder="Contoh: Technology, Lifestyle, dll"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  maxLength={100}
                  disabled={loading}
                  className="dark:bg-gray-900 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Deskripsi singkat tentang post Anda"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="dark:bg-gray-900 dark:border-gray-700"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Konten</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Tulis konten lengkap di sini..."
                  value={formData.content}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="dark:bg-gray-900 dark:border-gray-700"
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mediaUrl">URL Media (Gambar/Video)</Label>
                <Input
                  id="mediaUrl"
                  name="mediaUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.mediaUrl}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="dark:bg-gray-900 dark:border-gray-700"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="blurred"
                    name="blurred"
                    checked={formData.blurred}
                    onChange={handleCheckboxChange}
                    disabled={loading}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="blurred" className="dark:text-gray-300">
                    Blur gambar (untuk konten sensitif)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleCheckboxChange}
                    disabled={loading}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isPublished" className="dark:text-gray-300">
                    Publikasikan segera
                  </Label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    "Buat Post"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="dark:bg-gray-800 dark:border-gray-700"
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

