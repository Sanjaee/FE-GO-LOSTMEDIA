import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/general/Navbar";
import { useApi } from "@/components/contex/ApiProvider";
import { Post } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Eye, Heart, Share2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Home() {
  const { apiClient } = useApi();
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await apiClient.getPosts(pageNum, 20);

      if (reset) {
        setPosts(response.posts);
      } else {
        setPosts((prev) => [...prev, ...response.posts]);
      }

      setHasMore(response.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [apiClient]);

  useEffect(() => {
    loadPosts(1, true);
  }, [loadPosts]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadPosts(page + 1, false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Create Post Button */}
        {session && (
          <div className="mb-6">
            <Button
              onClick={() => router.push("/post")}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Buat Post Baru
            </Button>
          </div>
        )}

        {/* Posts List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
          </div>
        ) : !posts || posts.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Belum ada post
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card
                key={post.postId}
                className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.user && (
                          <>
                            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              {post.user.profile_photo ? (
                                <img
                                  src={post.user.profile_photo}
                                  alt={post.user.full_name}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                  {post.user.full_name?.charAt(0).toUpperCase() || "U"}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {post.user.full_name || post.user.username || "User"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(post.createdAt)}
          </p>
        </div>
                          </>
                        )}
                      </div>
                      <CardTitle className="text-xl mt-2 dark:text-gray-50">{post.title}</CardTitle>
                      {post.category && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                          {post.category}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {post.description && (
                    <CardDescription className="text-gray-700 dark:text-gray-300 mb-4">
                      {post.description}
                    </CardDescription>
                  )}
                  {post.content && (
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
                      {post.content}
                    </p>
                  )}
                  {post.mediaUrl && (
                    <div className="mb-4">
                      <img
                        src={post.mediaUrl}
                        alt={post.title}
                        className={`w-full rounded-lg ${post.blurred ? "blur-sm" : ""}`}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{post.viewsCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{post.likesCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="h-4 w-4" />
                      <span>{post.sharesCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center py-6">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="dark:bg-gray-800 dark:border-gray-700"
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
      </main>
    </div>
  );
}
