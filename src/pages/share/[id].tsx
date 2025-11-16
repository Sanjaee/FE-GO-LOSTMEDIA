import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Navbar } from "@/components/general/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, Share2, Eye, Repeat2, ChevronLeft, ChevronRight, X, Send } from "lucide-react";
import { Post } from "@/lib/api-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface Comment {
  commentId: string;
  content: string;
  createdAt: string;
  user: {
    userId: string;
    username: string;
    profilePic?: string;
  };
}

interface PostWithSections extends Omit<Post, 'user'> {
  sections?: Array<{
    type: string;
    imageDetail?: string[];
    content?: string;
  }>;
  commentsCount?: number;
  author?: {
    userId: string;
    username: string;
    profilePic?: string;
  };
  user?: {
    full_name: string;
    profile_photo?: string;
  } | Post['user'];
}

export default function SharePost() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [post, setPost] = useState<PostWithSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Collect all images: featured image + content section images
  const getAllImages = () => {
    if (!post) return [];
    const images: string[] = [];
    
    if (post.mediaUrl) {
      images.push(post.mediaUrl);
    }
    
    if (post?.sections) {
      post.sections.forEach((section) => {
        if (section.type === "image" && section.imageDetail) {
          section.imageDetail.forEach((imgUrl: string) => {
            if (imgUrl && imgUrl.trim() !== "") {
              images.push(imgUrl);
            }
          });
        }
      });
    }
    
    return images;
  };

  const allImages = getAllImages();

  useEffect(() => {
    if (id) {
      fetchPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Get initial image index from query parameter
  useEffect(() => {
    if (router.query.image) {
      const imageIndex = parseInt(router.query.image as string, 10);
      if (!isNaN(imageIndex) && imageIndex >= 0) {
        setCurrentImageIndex(imageIndex);
      }
    }
  }, [router.query.image]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const jwtToken = session?.accessToken;
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (jwtToken) {
        headers.Authorization = `Bearer ${jwtToken}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/v1/posts/${id}`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        const postData = data.data?.post || data.post;
        setPost(postData);
        setIsLiked(postData.isLiked || false);
        setLikesCount(postData.likesCount || 0);
        // Fetch comments if available
        if (postData.comments) {
          setComments(postData.comments);
        }
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!session?.accessToken) {
      router.push("/auth/login");
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/posts/${id}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.data?.isLiked || !isLiked);
        setLikesCount(data.data?.likesCount || likesCount);
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return "baru saja";
    }
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} menit yang lalu`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} jam yang lalu`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} hari yang lalu`;
    }
    return formatDate(dateString);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !session?.accessToken) {
      if (!session?.accessToken) {
        router.push("/auth/login");
      }
      return;
    }

    try {
      setIsSubmittingComment(true);
      const response = await fetch(
        `${BACKEND_URL}/api/v1/posts/${id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ content: commentText }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newComment = data.data?.comment || data.comment;
        if (newComment) {
          setComments([...comments, newComment]);
          setCommentText("");
        }
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-100 dark:bg-[#18191A] overflow-hidden flex flex-col">
        <Navbar enableSearch={false} />
        <div className="relative flex-1 overflow-hidden">
          {/* Blurred Background Skeleton */}
          <div className="fixed inset-0 bg-gray-200 dark:bg-gray-800 blur-3xl opacity-30 -z-10" />
          
          {/* Content Container */}
          <div className="relative z-10 h-full flex items-center justify-center p-4 md:p-6 overflow-hidden">
            <div className="w-full h-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
              {/* Image Section Skeleton */}
              <div className="lg:col-span-2 flex flex-col items-center order-1 lg:order-1 h-full overflow-hidden">
                <div className="relative w-full h-full bg-white dark:bg-[#242526] rounded-lg shadow-2xl overflow-hidden flex flex-col">
                  {/* Close Button Skeleton */}
                  <Skeleton className="absolute top-4 right-4 w-10 h-10 rounded-full z-10" />
                  
                  {/* Main Image Skeleton */}
                  <Skeleton className="w-full flex-1 min-h-0" />
                  
                  {/* Thumbnails Skeleton */}
                  <div className="p-3 bg-white dark:bg-[#242526] border-t border-gray-200 dark:border-gray-800 shrink-0">
                    <div className="flex gap-2">
                      {[...Array(3)].map((_, idx) => (
                        <Skeleton key={idx} className="w-20 h-20 rounded-lg shrink-0" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Skeleton */}
              <div className="lg:col-span-1 order-2 lg:order-2 h-full overflow-hidden">
                <div className="bg-white dark:bg-[#242526] rounded-lg shadow-2xl p-4 md:p-6 h-full flex flex-col overflow-hidden">
                  {/* Post Header Skeleton */}
                  <div className="mb-6">
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-4" />
                    
                    {/* Author Info Skeleton */}
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    
                    {/* Category Skeleton */}
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>

                  {/* Action Buttons Skeleton */}
                  <div className="grid grid-cols-5 gap-2 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                    {[...Array(5)].map((_, idx) => (
                      <Skeleton key={idx} className="h-16 w-full" />
                    ))}
                  </div>

                  {/* Comments Section Skeleton */}
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-32 mb-4" />
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="flex gap-3">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="flex-1">
                          <Skeleton className="h-16 w-full rounded-lg mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#18191A]">
        <Navbar enableSearch={false} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Post not found</p>
            <Button onClick={() => router.push("/")} className="mt-4">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = allImages[currentImageIndex];

  return (
    <div className="h-screen bg-gray-100 dark:bg-[#18191A] overflow-hidden flex flex-col">
      <Navbar enableSearch={false} />
      
      {/* Main Content with Blur Background */}
      <div className="relative flex-1 overflow-hidden">
        {/* Blurred Background */}
        {currentImage && (
          <div 
            className="fixed inset-0 bg-cover bg-center blur-3xl opacity-30 -z-10"
            style={{ backgroundImage: `url(${currentImage})` }}
          />
        )}

        {/* Content Container */}
        <div className="relative z-10 h-full flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <div className="w-full h-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
            {/* Image Section - Left/Main */}
            <div className="lg:col-span-2 flex flex-col items-center order-1 lg:order-1 h-full overflow-hidden">
              <div className="relative w-full h-full bg-white dark:bg-[#242526] rounded-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Close Button */}
                <button
                  onClick={() => {
                    // Get previous path and scroll position
                    const previousPath = sessionStorage.getItem("previousPath") || "/";
                    const scrollPosition = sessionStorage.getItem("scrollPosition");
                    
                    // Navigate back
                    router.push(previousPath).then(() => {
                      // Restore scroll position after navigation
                      if (scrollPosition && typeof window !== "undefined") {
                        setTimeout(() => {
                          window.scrollTo(0, parseInt(scrollPosition, 10));
                          // Clear stored values
                          sessionStorage.removeItem("scrollPosition");
                          sessionStorage.removeItem("previousPath");
                        }, 100);
                      }
                    });
                  }}
                  className="absolute top-4 right-4 z-20 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Main Image */}
                {currentImage ? (
                  <div className="relative w-full flex-1 bg-gray-900 min-h-0 overflow-hidden">
                    <img
                      src={currentImage}
                      alt={`Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Navigation Arrows */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={handlePreviousImage}
                          disabled={currentImageIndex === 0}
                          className={`absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all ${
                            currentImageIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          disabled={currentImageIndex === allImages.length - 1}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all ${
                            currentImageIndex === allImages.length - 1 ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {allImages.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full flex-1 bg-gray-200 dark:bg-gray-800 flex items-center justify-center min-h-0">
                    <p className="text-gray-500 dark:text-gray-400">No image available</p>
                  </div>
                )}

                {/* Image Thumbnails */}
                {allImages.length > 1 && (
                  <div className="p-3 bg-white dark:bg-[#242526] border-t border-gray-200 dark:border-gray-800 shrink-0">
                    <div className="flex gap-2 overflow-x-auto">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            currentImageIndex === idx
                              ? "border-blue-500 ring-2 ring-blue-500"
                              : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Right */}
            <div className="lg:col-span-1 order-2 lg:order-2 h-full overflow-hidden">
              <div className="bg-white dark:bg-[#242526] rounded-lg shadow-2xl p-4 md:p-6 h-full flex flex-col overflow-hidden">
                {/* Post Header */}
                <div className="mb-4 shrink-0">
                  {/* Author Info - Horizontal Layout */}
                  <div className="flex gap-3 mb-3">
                    {/* Profile Picture - Left */}
                    <div className="shrink-0">
                      {(post.user?.profile_photo || post.author?.profilePic) ? (
                        <Image
                          src={(post.user?.profile_photo || post.author?.profilePic) as string}
                          alt={(post.user?.full_name || post.author?.username || "User") as string}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {(post.user?.full_name || post.author?.username || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Username and Timestamp - Right */}
                    <div className="flex-1 min-w-0">
                      {/* Username */}
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                        {post.user?.full_name || post.author?.username || "User"}
                      </p>
                      
                      {/* Timestamp */}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {post.title}
                  </h1>
                  
                  {/* Description */}
                  {post.description && (
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-wrap">
                      {post.description}
                    </p>
                  )}

                  {/* Category */}
                  {post.category && (
                    <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-5 gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                  <button
                    onClick={handleLike}
                    className={`group relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                      isLiked ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                    }`}
                    title="Suka"
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                    <span className="font-medium text-xs">{likesCount}</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                      Suka
                    </span>
                  </button>
                  <button
                    className="group relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                    title="Komentar"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium text-xs">{post.commentsCount || comments.length || 0}</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                      Komentar
                    </span>
                  </button>
                  <button
                    className="group relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                    title="Repost"
                  >
                    <Repeat2 className="w-5 h-5" />
                    <span className="font-medium text-xs">0</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                      Repost
                    </span>
                  </button>
                  <button
                    className="group relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                    title="Lihat"
                  >
                    <Eye className="w-5 h-5" />
                    <span className="font-medium text-xs">{post.viewsCount || 0}</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                      Lihat
                    </span>
                  </button>
                  <button
                    className="group relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                    title="Bagikan"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium text-xs">{post.sharesCount || 0}</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                      Bagikan
                    </span>
                  </button>
                </div>

                {/* Comments Section */}
                <div className="flex-1 flex flex-col min-h-0 mt-4 overflow-hidden">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 shrink-0">
                    Komentar ({comments.length})
                  </h3>
                  
                  {/* Comments List */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-3 pr-2 min-h-0">
                    {comments.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                        Belum ada komentar. Jadilah yang pertama!
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.commentId} className="flex gap-3">
                          {/* Profile Picture - Left */}
                          <div className="shrink-0">
                            {comment.user.profilePic ? (
                              <Image
                                src={comment.user.profilePic}
                                alt={comment.user.username}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                  {comment.user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Content - Right */}
                          <div className="flex-1 min-w-0">
                            {/* Username */}
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                              {comment.user.username}
                            </p>
                            
                            {/* Timestamp */}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              {formatCommentDate(comment.createdAt)}
                            </p>
                            
                            {/* Comment Content */}
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap wrap-break-word">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-3 shrink-0">
                    {session ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Tulis komentar..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-[60px] max-h-[100px] resize-none dark:bg-gray-800 dark:border-gray-700 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              handleSubmitComment();
                            }
                          }}
                        />
                        <div className="flex justify-end">
                          <Button
                            onClick={handleSubmitComment}
                            disabled={!commentText.trim() || isSubmittingComment}
                            size="sm"
                            className="gap-2"
                          >
                            <Send className="w-4 h-4" />
                            {isSubmittingComment ? "Mengirim..." : "Kirim"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Silakan login untuk berkomentar
                        </p>
                        <Button
                          onClick={() => router.push("/auth/login")}
                          size="sm"
                          variant="outline"
                        >
                          Login
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

