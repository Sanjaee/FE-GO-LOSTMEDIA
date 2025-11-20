import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Heart, MessageCircle, Share2, Eye, MoreHorizontal, Repeat2 } from "lucide-react";
import { Post as ApiPost } from "@/lib/api-client";

interface PostCardProps {
  post: ApiPost & {
    sections?: Array<{
      type: string;
      imageDetail?: string[];
      content?: string;
      src?: string;
      order?: number;
    }>;
    commentsCount?: number;
    author?: {
      userId: string;
      username: string;
      profilePic?: string;
      isVerified?: boolean;
    };
  };
  onLike?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  
  // Dummy counts for action buttons
  const dummyCounts = {
    likes: likesCount || 0,
    comments: post.commentsCount || 0,
    shares: post.sharesCount || 0,
    views: post.viewsCount || 0,
    reposts: Math.floor((post.sharesCount || 0) * 0.6) || 0, // 60% of shares are reposts
  };
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Collect all images: featured image + content section images
  const getAllImages = () => {
    const images: string[] = [];
    
    // Add featured image first if exists
    if (post.mediaUrl) {
      images.push(post.mediaUrl);
    }
    
    // Add content section images
    if (post.sections) {
      post.sections.forEach((section) => {
        if (section.type === "image" && section.imageDetail) {
          section.imageDetail.forEach((imgUrl) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Baru saja";
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

    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleLike = async () => {
    if (!session?.accessToken) {
      router.push("/auth/login");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/v1/posts/${post.postId}/like`,
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
        if (onLike) onLike(post.postId);
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = () => {
    // Save scroll position before navigation
    if (typeof window !== "undefined") {
      sessionStorage.setItem("scrollPosition", window.scrollY.toString());
      sessionStorage.setItem("previousPath", router.asPath);
    }
    router.push(`/share/${post.postId}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description || post.title,
        url: `${window.location.origin}/share/${post.postId}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/share/${post.postId}`);
    }
  };

  return (
    <div className="bg-white dark:bg-[#18191A] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 mb-4 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Profile Picture */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
              {(post.author?.profilePic || post.user?.profile_photo) ? (
                <Image
                  src={(post.author?.profilePic || post.user?.profile_photo) as string}
                  alt={(post.author?.username || post.user?.full_name || "User") as string}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {((post.user?.full_name || post.author?.username || post.user?.username || "U") as string).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm hover:underline cursor-pointer">
                  {(post.user?.full_name || post.author?.username || post.user?.username || "User") as string}
                </h3>
                {(post.user?.is_verified || post.author?.isVerified) && (
                  <span className="text-blue-500 text-xs">✓</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatDate(post.createdAt)}</span>
                {post.category && (
                  <>
                    <span>·</span>
                    <span className="hover:underline cursor-pointer">{post.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* More Options */}
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        {post.title && (
          <h2 className="text-gray-900 dark:text-gray-100 font-medium mb-2 text-[15px] leading-5">
            {post.title}
          </h2>
        )}
        {post.description && (
          <p className="text-gray-800 dark:text-gray-200 text-[15px] leading-5 mb-2 whitespace-pre-wrap">
            {post.description}
          </p>
        )}
        {post.content && (
          <p className="text-gray-800 dark:text-gray-200 text-[15px] leading-5 mb-2 whitespace-pre-wrap">
            {post.content}
          </p>
        )}
      </div>

      {/* Combined Media Gallery */}
      {allImages.length > 0 && (
        <div className="w-full bg-gray-100 dark:bg-gray-900">
          {(() => {
            const imageCount = allImages.length;
            const featuredImage = allImages[0];
            const otherImages = allImages.slice(1);

            // Single image - full width
            if (imageCount === 1) {
              return (
                <div className={`relative w-full ${post.blurred ? "blur-sm" : ""}`}>
                  <img
                    src={featuredImage}
                    alt={post.title}
                    className="w-full h-auto object-cover cursor-pointer"
                    style={{ maxHeight: "600px" }}
                    onClick={() => {
                      // Save scroll position before navigation
                      if (typeof window !== "undefined") {
                        sessionStorage.setItem("scrollPosition", window.scrollY.toString());
                        sessionStorage.setItem("previousPath", router.asPath);
                      }
                      router.push(`/share/${post.postId}`);
                    }}
                  />
                  {post.blurred && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <p className="text-white font-semibold">Blurred Content</p>
                    </div>
                  )}
                </div>
              );
            }

            // Two images - 2 columns equal
            if (imageCount === 2) {
              return (
                <div className="grid grid-cols-2 gap-1">
                  {allImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square bg-gray-200 dark:bg-gray-800 cursor-pointer ${idx === 0 && post.blurred ? "blur-sm" : ""}`}
                      onClick={() => {
                        // Save scroll position before navigation
                        if (typeof window !== "undefined") {
                          sessionStorage.setItem("scrollPosition", window.scrollY.toString());
                          sessionStorage.setItem("previousPath", router.asPath);
                        }
                        router.push(`/share/${post.postId}?image=${idx}`);
                      }}
                    >
                      <img
                        src={img}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && post.blurred && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <p className="text-white font-semibold text-xs">Blurred</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            }

            // Three images - 1 large (featured) + 2 small
            if (imageCount === 3) {
              return (
                <div className="grid grid-cols-3 gap-1">
                  {/* Featured image - takes 2 columns */}
                  <div
                    className={`relative col-span-2 row-span-2 bg-gray-200 dark:bg-gray-800 cursor-pointer ${post.blurred ? "blur-sm" : ""}`}
                    onClick={() => {
                      // Save scroll position before navigation
                      if (typeof window !== "undefined") {
                        sessionStorage.setItem("scrollPosition", window.scrollY.toString());
                        sessionStorage.setItem("previousPath", router.asPath);
                      }
                      router.push(`/share/${post.postId}`);
                    }}
                  >
                    <img
                      src={featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    {post.blurred && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <p className="text-white font-semibold text-xs">Blurred</p>
                      </div>
                    )}
                  </div>
                  {/* Two small images */}
                  {otherImages.slice(0, 2).map((img, idx) => (
                    <div
                      key={idx + 1}
                      className="relative aspect-square bg-gray-200 dark:bg-gray-800 cursor-pointer"
                      onClick={() => {
                        // Save scroll position before navigation
                        if (typeof window !== "undefined") {
                          sessionStorage.setItem("scrollPosition", window.scrollY.toString());
                          sessionStorage.setItem("previousPath", router.asPath);
                        }
                        router.push(`/share/${post.postId}?image=${idx + 1}`);
                      }}
                    >
                      <img
                        src={img}
                        alt={`Image ${idx + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              );
            }

            // Four images - 1 large featured (left) + 3 small (right, vertical)
            if (imageCount === 4) {
              return (
                <div className="grid grid-cols-3 gap-1">
                  {/* Featured image on the left - takes 3 rows (larger) */}
                  <div
                    className={`relative col-span-2 row-span-3 bg-gray-200 dark:bg-gray-800 cursor-pointer ${post.blurred ? "blur-sm" : ""}`}
                    onClick={() => {
                      // Save scroll position before navigation
                      if (typeof window !== "undefined") {
                        sessionStorage.setItem("scrollPosition", window.scrollY.toString());
                        sessionStorage.setItem("previousPath", router.asPath);
                      }
                      router.push(`/share/${post.postId}`);
                    }}
                  >
                    <img
                      src={featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    {post.blurred && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <p className="text-white font-semibold text-xs">Blurred</p>
                      </div>
                    )}
                  </div>
                  {/* Three small images on the right - vertical stack */}
                  <div className="col-span-1 grid grid-rows-3 gap-1">
                    {otherImages.slice(0, 3).map((img, idx) => (
                      <div
                        key={idx + 1}
                        className="relative aspect-square bg-gray-200 dark:bg-gray-800 cursor-pointer"
                        onClick={() => {
                        // Save scroll position before navigation
                        if (typeof window !== "undefined") {
                          sessionStorage.setItem("scrollPosition", window.scrollY.toString());
                          sessionStorage.setItem("previousPath", router.asPath);
                        }
                        router.push(`/share/${post.postId}?image=${idx + 1}`);
                      }}
                      >
                        <img
                          src={img}
                          alt={`Image ${idx + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // Five images - 1 large (featured) + 4 small (2x2 grid)
            if (imageCount === 5) {
              return (
                <div className="grid grid-cols-3 gap-1">
                  {/* Featured image - takes 2 rows */}
                  <div
                    className={`relative col-span-2 row-span-2 bg-gray-200 dark:bg-gray-800 cursor-pointer ${post.blurred ? "blur-sm" : ""}`}
                    onClick={() => setSelectedImageIndex(0)}
                  >
                    <img
                      src={featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    {post.blurred && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <p className="text-white font-semibold text-xs">Blurred</p>
                      </div>
                    )}
                  </div>
                  {/* Four small images in 2x2 grid */}
                  {otherImages.slice(0, 4).map((img, idx) => (
                    <div
                      key={idx + 1}
                      className="relative aspect-square bg-gray-200 dark:bg-gray-800 cursor-pointer"
                      onClick={() => {
                        // Save scroll position before navigation
                        if (typeof window !== "undefined") {
                          sessionStorage.setItem("scrollPosition", window.scrollY.toString());
                          sessionStorage.setItem("previousPath", router.asPath);
                        }
                        router.push(`/share/${post.postId}?image=${idx + 1}`);
                      }}
                    >
                      <img
                        src={img}
                        alt={`Image ${idx + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              );
            }

            // Six or more images - 1 large (featured) + 5 small (2x3 grid)
            return (
              <div className="grid grid-cols-3 gap-1">
                {/* Featured image - takes 2 rows */}
                <div
                  className={`relative col-span-2 row-span-2 bg-gray-200 dark:bg-gray-800 cursor-pointer ${post.blurred ? "blur-sm" : ""}`}
                  onClick={() => setSelectedImageIndex(0)}
                >
                  <img
                    src={featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  {post.blurred && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <p className="text-white font-semibold text-xs">Blurred</p>
                    </div>
                  )}
                </div>
                {/* Show up to 5 more images */}
                {otherImages.slice(0, 5).map((img, idx) => (
                  <div
                    key={idx + 1}
                    className="relative aspect-square bg-gray-200 dark:bg-gray-800 cursor-pointer group"
                    onClick={() => setSelectedImageIndex(idx + 1)}
                  >
                    <img
                      src={img}
                      alt={`Image ${idx + 2}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Show overlay with count if more than 6 images */}
                    {idx === 4 && otherImages.length > 6 && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          +{otherImages.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Image Lightbox Modal */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={allImages[selectedImageIndex]}
              alt={`Image ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev === null ? null : (prev - 1 + allImages.length) % allImages.length));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev === null ? null : (prev + 1) % allImages.length));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                  {selectedImageIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
           
            {post.commentsCount !== undefined && post.commentsCount > 0 && (
              <button
                onClick={handleComment}
                className="hover:underline"
              >
                {post.commentsCount} komentar
              </button>
            )}
            {post.sharesCount > 0 && (
              <span>{post.sharesCount} kali dibagikan</span>
            )}
          </div>
         
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-2 border-t border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-5 divide-x divide-gray-200 dark:divide-gray-800">
          <button
            onClick={handleLike}
            title="Suka"
            className={`group relative flex items-center justify-center gap-1.5 py-3 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              isLiked ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            <span className="font-medium text-xs">{dummyCounts.likes}</span>
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              Suka
            </span>
          </button>
          <button
            onClick={handleComment}
            title="Komentar"
            className="group relative flex items-center justify-center gap-1.5 py-3 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium text-xs">{dummyCounts.comments}</span>
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              Komentar
            </span>
          </button>
          <button
            title="Repost"
            className="group relative flex items-center justify-center gap-1.5 py-3 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
          >
            <Repeat2 className="w-5 h-5" />
            <span className="font-medium text-xs">{dummyCounts.reposts}</span>
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              Repost
            </span>
          </button>
          <button
            title="Lihat"
            className="group relative flex items-center justify-center gap-1.5 py-3 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
          >
            <Eye className="w-5 h-5" />
            <span className="font-medium text-xs">{dummyCounts.views}</span>
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              Lihat
            </span>
          </button>
          <button
            onClick={handleShare}
            title="Bagikan"
            className="group relative flex items-center justify-center gap-1.5 py-3 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium text-xs">{dummyCounts.shares}</span>
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              Bagikan
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;

