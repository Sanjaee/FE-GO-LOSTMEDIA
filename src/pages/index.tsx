import { useState, useEffect } from "react";
import { Navbar } from "@/components/general/Navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

  const loadPosts = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      const jwtToken = session?.accessToken ?? null;

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

      // Bentuk author yang dikirim backend di dalam setiap post
      interface AuthorPayload {
        id: string;
        username: string;
        email?: string;
        full_name?: string;
        profile_photo?: string;
        user_type?: string;
        login_type?: string;
        is_verified?: boolean;
        created_at?: string;
        userId?: string;
        profilePic?: string;
        isVerified?: boolean;
      }

      interface RawPostPayload extends Post {
        author?: AuthorPayload;
        [key: string]: unknown;
      }

      // Backend returns { data: { posts: [...], total: ... } }
      const rawPosts = (data.data?.posts || data.posts || []) as RawPostPayload[];

      const postsData = rawPosts.map((post) => {
        const author = post.author;

        // Normalisasi author dari backend
        const normalizedAuthor = author
          ? {
              userId: author.userId || author.id,
              username: author.username,
              profilePic: author.profilePic || author.profile_photo,
              isVerified: author.isVerified ?? author.is_verified,
            }
          : undefined;

        return {
          ...post,
          author: normalizedAuthor,
          // Map author ke user untuk kompatibilitas dengan PostCard / tipe User
          user:
            post.user ||
            (author
              ? {
                  id: author.id,
                  full_name: author.full_name || author.username,
                  username: author.username,
                  profile_photo: author.profile_photo,
                  is_verified: author.is_verified,
                  user_type: author.user_type,
                  login_type: author.login_type,
                  email: author.email,
                  created_at: author.created_at,
                }
              : undefined),
        };
      });
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
  };

  useEffect(() => {
    // Initial load only once on mount
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore scroll position when returning from share page
  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof window !== "undefined" && router.asPath === "/") {
        const scrollPosition = sessionStorage.getItem("scrollPosition");
        const previousPath = sessionStorage.getItem("previousPath");
        
        // Only restore if we're coming from share page and on home page
        if (scrollPosition && previousPath === "/") {
          // Wait for posts to load, then restore scroll
          if (!loading) {
            setTimeout(() => {
              window.scrollTo(0, parseInt(scrollPosition, 10));
              // Clear stored values
              sessionStorage.removeItem("scrollPosition");
              sessionStorage.removeItem("previousPath");
            }, 200);
          }
        }
      }
    };

    // Check on mount and route change
    handleRouteChange();
    router.events.on("routeChangeComplete", handleRouteChange);
    
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [loading, router]);

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
          <div className="space-y-4">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-[#18191A] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                {/* Header Skeleton */}
                <div className="p-4 pb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
                
                {/* Content Skeleton */}
                <div className="px-4 pb-3">
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                
                {/* Image Skeleton */}
                <div className="w-full bg-gray-100 dark:bg-gray-900">
                  <Skeleton className="w-full h-96" />
                </div>
                
                {/* Actions Skeleton */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                  <div className="grid grid-cols-5 gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
