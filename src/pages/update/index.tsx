import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Loader } from "lucide-react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/general/Navbar";

// Backend URL with fallback
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface PostData {
  postId: string;
  title: string;
  description: string;
  category: string;
  mediaUrl?: string;
  author?: {
    userId: string;
    username: string;
    profilePic?: string;
  };
  likesCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  createdAt?: string;
}

const UpdatePostListPage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Helper function to get JWT token from session
  const getJWTToken = () => {
    // NextAuth stores token in session.accessToken
    if (session?.accessToken) {
      return session.accessToken;
    }
    return null;
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const jwtToken = getJWTToken();
      if (!jwtToken || !session?.user?.id) {
        toast({
          title: "Error",
          description: "JWT token or user ID not available",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Fetch hanya post milik user saat ini
      // Backend akan otomatis menggunakan userId dari JWT token (internal UUID)
      // Query parameter digunakan sebagai trigger, tapi value diabaikan untuk security
      // Backend akan menggunakan userId dari JWT token (UUID) bukan dari query param (Google ID)
      const url = `${BACKEND_URL}/api/v1/posts?userId=${encodeURIComponent(session.user.id)}`;
      
      const res = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      // Check response status
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      // Debug: log response untuk troubleshooting
      console.log("Fetch posts response:", data);
      
      // Backend returns { data: { success: true, posts: [...], total: ... } }
      let posts = [];
      if (data.data?.success && Array.isArray(data.data?.posts)) {
        posts = data.data.posts;
      } else if (Array.isArray(data.data?.posts)) {
        // Alternative response format without success field
        posts = data.data.posts;
      } else if (data.success && Array.isArray(data.posts)) {
        // Direct response format
        posts = data.posts;
      } else if (Array.isArray(data.posts)) {
        // Direct posts array
        posts = data.posts;
      } else if (data.data && Array.isArray(data.data)) {
        // Data is direct array
        posts = data.data;
      }
      
      if (Array.isArray(posts)) {
        setPosts(posts);
        if (posts.length === 0) {
          console.log("No posts found for user");
        }
      } else {
        console.error("Unexpected response format:", data);
        toast({
          title: "Error",
          description: data.error?.message || data.message || "Failed to parse posts response",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Error fetching posts:", e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to fetch posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchPosts();
  }, [session]);

  const handleEdit = (postId: string) => {
    router.push(`/update/${postId}`);
  };

  const handleDeleteClick = (postId: string) => {
    setDeletePostId(postId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePostId) return;
    setDeleteLoading(true);
    try {
      const jwtToken = getJWTToken();
      if (!jwtToken) throw new Error("JWT token not available");
      const res = await fetch(
        `${BACKEND_URL}/api/v1/posts/${deletePostId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jwtToken}` },
          credentials: "include",
        }
      );
      const data = await res.json();
      // Backend returns { data: { success: true, message: "..." } }
      const isSuccess = data.data?.success || data.success || res.ok;
      if (isSuccess) {
        toast({
          title: "Success",
          description: "Post deleted successfully!",
          variant: "default",
        });
        fetchPosts();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete post",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeletePostId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletePostId(null);
  };

  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar enableSearch={false} />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          My Posts
        </h1>
        {loading ? (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Loader className="animate-spin w-16 h-16 text-green-400 mb-4" />
            <div className="text-xl text-black font-semibold tracking-wide flex items-center">
              Loading
              <span className="inline-block w-8 text-green-400">
                {".".repeat(dotCount)}
              </span>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No posts found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {posts.map((post) => (
              <div
                key={post.postId}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {post.mediaUrl && (
                  <img
                    src={post.mediaUrl}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    {post.author?.profilePic && (
                      <Image
                        width={40}
                        height={40}
                        src={post.author.profilePic}
                        alt={post.author.username}
                        className="w-8 h-8 rounded-full mr-3"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {post.author?.username}
                      </p>
                      {post.createdAt && (
                        <p className="text-sm text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {post.description}
                  </p>
                  {post.category && (
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mb-4">
                      {post.category}
                    </span>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      onClick={() => handleEdit(post.postId)}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(post.postId)}
                      variant="destructive"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {showDeleteModal && (
          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this post? This action cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={handleDeleteCancel}
                  variant="outline"
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  variant="destructive"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
};

export default UpdatePostListPage;
