import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/general/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import PostCard from "@/components/posts/PostCard";
import { Post } from "@/lib/api-client";

// Backend URL with fallback
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  // Helper function to get JWT token from session
  const getJWTToken = () => {
    if (session?.accessToken) {
      return session.accessToken;
    }
    return null;
  };

  const loadPosts = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      const jwtToken = getJWTToken();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (jwtToken) {
        headers.Authorization = `Bearer ${jwtToken}`;
      }

      const response = await fetch(
        `${BACKEND_URL}/api/v1/posts?limit=${limit}&offset=${currentOffset}`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json();
      
      // Backend returns { data: { success: true, posts: [...], total: ... } }
      const postsData = (data.data?.posts || data.posts || []).map((post: any) => ({
        ...post,
        // Map author to user for compatibility
        user: post.user || (post.author ? {
          id: post.author.userId,
          full_name: post.author.username,
          username: post.author.username,
          profile_photo: post.author.profilePic,
          is_verified: false,
        } : undefined),
      }));
      const total = data.data?.total || data.total || 0;

      if (reset) {
        setPosts(postsData);
      } else {
        setPosts((prev) => [...prev, ...postsData]);
      }

      setHasMore(postsData.length === limit && (currentOffset + limit) < total);
      setOffset(currentOffset + postsData.length);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset, session]);

  useEffect(() => {
    loadPosts(true);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadPosts(false);
    }
  };

  const handleLike = (postId: string) => {
    // Update local state if needed
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.postId === postId
          ? { ...post, likesCount: post.likesCount + 1 }
          : post
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#18191A] font-sans">
      <Navbar enableSearch={true} />
      
      {/* Main Container with max width */}
      <div className="max-w-[680px] mx-auto px-4 py-4">
        {/* Create Post Button */}
        {session && (
          <div className="mb-4">
            <Button
              onClick={() => router.push("/post")}
              className="w-full bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#2F3031] border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Buat Post Baru
            </Button>
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="bg-white dark:bg-[#242526] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Belum ada post
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                onLike={handleLike}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="bg-white dark:bg-[#242526] text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#2F3031] border border-gray-200 dark:border-gray-700"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    "Muat Lebih Banyak"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
