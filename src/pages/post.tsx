import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Upload,
  ImageIcon,
  Trash2,
  Heart,
  MessageCircle,
  Eye,
  Plus,
  X,
  Loader,
  Loader2,
  Clock,
  Calendar,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/router";
import { z } from "zod";
import ImageLightbox from "@/components/general/ImageLightbox";
import { DateTimePicker } from "@/components/general/DateTimePicker";
import { Navbar } from "@/components/general/Navbar";

// Backend URL with fallback
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// Types
interface ContentSection {
  id?: string;
  type: "image" | "code" | "video" | "link" | "html";
  content?: string | null;
  src?: string | null;
  imageDetail?: string[]; // Array of additional image URLs
  order: number;
}

interface PostData {
  postId?: string;
  title: string;
  description: string;
  category: string;
  mediaUrl?: string;
  blurred?: boolean;
  sections: ContentSection[];
  author?: {
    userId: string;
    username: string;
    profilePic?: string;
  };
  likesCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  createdAt?: string;
  isLiked?: boolean;
  scheduledAt?: string;
  isScheduled?: boolean;
}

// BlogPostPreview Component
const BlogPostPreview: React.FC<{
  postData: PostData;
  contentSectionImagePreviews?: string[][];
}> = ({ postData, contentSectionImagePreviews }) => {
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const renderGallery = (images: string[]) => (
    <div className="grid grid-cols-3 gap-2">
      {images.map((imageUrl, idx) => (
        <div
          key={idx}
          className="relative rounded-lg overflow-hidden cursor-pointer"
          onClick={() => {
            setCurrentImageIndex(idx);
            setShowGallery(true);
          }}
        >
          {/* Order number badge */}
          <span className="absolute top-2 left-2 z-10 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-0.5 rounded">
            {idx + 1}
          </span>
          <Image
            src={imageUrl}
            alt={`Detail Image ${idx + 1}`}
            width={400}
            height={300}
            className="w-full h-[200px] object-cover hover:scale-105 transition-transform duration-200"
          />
        </div>
      ))}
    </div>
  );

  const renderFullGallery = (images: string[]) => {
    if (!showGallery) return null;
    return (
      <ImageLightbox
        images={images}
        currentIndex={currentImageIndex}
        onClose={() => setShowGallery(false)}
      />
    );
  };

  const renderSection = (section: ContentSection, sectionIdx: number) => {
    switch (section.type) {
      case "image": {
        // Use preview images if available, else fallback to imageDetail URLs
        const previews = contentSectionImagePreviews?.[sectionIdx] || [];
        const imageUrls = (section.imageDetail || []).map((url, idx) =>
          previews[idx] && previews[idx].length > 0 ? previews[idx] : url
        );
        if (imageUrls.length === 0) return null;
        return (
          <div className="mb-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Images ({imageUrls.length}):
              </p>
              <div className="grid grid-cols-3 gap-2">
                {imageUrls.map((imageUrl, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => {
                      setCurrentImageIndex(idx);
                      setShowGallery(true);
                    }}
                  >
                    {/* Order number badge */}
                    <span className="absolute top-2 left-2 z-10 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-0.5 rounded">
                      {idx + 1}
                    </span>
                    <Image
                      src={imageUrl}
                      alt={`Detail Image ${idx + 1}`}
                      width={400}
                      height={300}
                      className="w-full h-[200px] object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
              {showGallery && (
                <ImageLightbox
                  images={imageUrls}
                  currentIndex={currentImageIndex}
                  onClose={() => setShowGallery(false)}
                />
              )}
            </div>
          </div>
        );
      }
      case "code":
        return (
          <div className="mb-4">
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm whitespace-pre-wrap break-words">
                {section.content?.split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {"\n"}
                  </React.Fragment>
                ))}
              </code>
            </pre>
          </div>
        );
      case "video":
        return section.src ? (
          <div className="mb-4">
            <video controls className="w-full rounded-lg">
              <source src={section.src} />
              Your browser does not support the video tag.
            </video>
          </div>
        ) : null;
      case "link":
        return section.src ? (
          <div className="mb-4">
            <a
              href={section.src}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {section.src}
            </a>
          </div>
        ) : null;
      case "html":
        return (
          <div className="mb-4">
            <div dangerouslySetInnerHTML={{ __html: section.content || "" }} />
          </div>
        );
      default:
        return null;
    }
  };

  const sortedSections = [...postData.sections].sort(
    (a, b) => a.order - b.order
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white whitespace-pre-wrap break-words">
        {postData.title || "Untitled Post"}
      </h1>

      {postData.mediaUrl && (
        <img
          src={postData.mediaUrl}
          alt={postData.title}
          className="w-full h-64 object-cover rounded-lg mb-4"
        />
      )}

      <p className="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap break-words">
        {postData.description || "No description provided"}
      </p>

      {postData.category && (
        <span className="inline-block bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-sm mb-4">
          {postData.category}
        </span>
      )}

      <div className="prose max-w-none whitespace-pre-wrap break-words">
        {sortedSections.map((section, index) => (
          <div key={index}>{renderSection(section, index)}</div>
        ))}
      </div>
    </div>
  );
};

// PostCard Component for listing posts
const PostCard: React.FC<{
  post: PostData;
  onLike: (postId: string) => void;
  onDelete?: (postId: string) => void;
  showActions?: boolean;
}> = ({ post, onLike, onDelete, showActions = true }) => {
  const { data: session } = useSession();
  const isOwner = session?.user?.id === post.author?.userId;
  const [mounted] = useState(true);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
            {post.createdAt && mounted && (
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
          <span className="inline-block bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded text-sm mb-4">
            {post.category}
          </span>
        )}

        {showActions && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => post.postId && onLike(post.postId!)}
                className={`flex items-center space-x-1 ${
                  post.isLiked ? "text-red-500" : "text-gray-500"
                } hover:text-red-500 transition-colors`}
              >
                <Heart
                  className={`w-5 h-5 ${post.isLiked ? "fill-current" : ""}`}
                />
                <span>{post.likesCount || 0}</span>
              </button>

              <div className="flex items-center space-x-1 text-gray-500">
                <MessageCircle className="w-5 h-5" />
                <span>{post.commentsCount || 0}</span>
              </div>

              <div className="flex items-center space-x-1 text-gray-500">
                <Eye className="w-5 h-5" />
                <span>{post.viewsCount || 0}</span>
              </div>
            </div>

            {isOwner && onDelete && (
              <Button
                onClick={() => post.postId && onDelete(post.postId!)}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Post Component
const Post: React.FC<{
  mode?: "create" | "edit" | "list";
  postId?: string;
}> = ({ mode = "create", postId }) => {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Redirect ke / jika belum login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // Load post for edit mode
  useEffect(() => {
    if (mode === "edit" && postId && session?.user) {
      loadPostForEdit();
    }
  }, [mode, postId, session?.user]);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const isCustomCategory = category === "__CUSTOM__";
  const [mediaUrl, setMediaUrl] = useState("");
  const [blurred, setBlurred] = useState(false);
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);

  // Tambahkan state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Tambahkan state untuk featured image upload
  const [selectedFeaturedImage, setSelectedFeaturedImage] =
    useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<
    string | null
  >(null);
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);

  // Tambahkan state untuk postsCount dan role user
  const [userPostsCount, setUserPostsCount] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [postLimitReached, setPostLimitReached] = useState(false);

  // Scheduled post states
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    undefined
  );
  const [scheduledTime, setScheduledTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
  });

  // Set default scheduled date to current date if scheduling is enabled
  useEffect(() => {
    if (isScheduled && !scheduledDate) {
      const now = new Date();
      setScheduledDate(now);
    }
  }, [isScheduled, scheduledDate]);

  // Tambahkan new state for content section image files and previews
  const [contentSectionImageFiles, setContentSectionImageFiles] = useState<
    (File | null)[][]
  >([]);
  const [contentSectionImagePreviews, setContentSectionImagePreviews] =
    useState<string[][]>([]);

  // Limit per role
  const roleLimit: Record<string, number> = { member: 1, vip: 5, god: 20 };

  // Fetch postsCount & role user saat mode create
  useEffect(() => {
    if (mode === "create" && session?.user) {
      const fetchPostsCount = async () => {
        try {
          const jwtToken = getJWTToken();
          const res = await fetch(
            `${BACKEND_URL}/api/v1/posts/user/posts-count`,
            {
              headers: { Authorization: `Bearer ${jwtToken}` },
            }
          );
          const data = await res.json();
          if (data.success) {
            setUserPostsCount(data.postsCount);
            setUserRole(data.role);
            if (["member", "vip", "god"].includes(data.role)) {
              setPostLimitReached(data.postsCount >= roleLimit[data.role]);
            } else {
              setPostLimitReached(false);
            }
          }
        } catch (error) {
          // Error fetching posts count
          toast({
            title: "Error",
            description: "Failed to fetch posts count",
            variant: "destructive",
          });
        }
      };

      // Panggil saat mount
      fetchPostsCount();

      // Panggil ulang setiap kali route berubah ke /post
      const handleRouteChange = (url: string) => {
        if (url === "/post") {
          fetchPostsCount();
        }
      };

      router.events.on("routeChangeComplete", handleRouteChange);

      return () => {
        router.events.off("routeChangeComplete", handleRouteChange);
      };
    }
  }, [mode, session?.user, router]);

  // Zod schema untuk validasi gambar
  const imageSchema = z
    .instanceof(File)
    .refine((file) => file.size <= 3 * 1024 * 1024, {
      message: "Image size must be less than 3MB",
    })
    .refine((file) => file.type.startsWith("image/"), {
      message: "File must be an image",
    });

  // Zod schema khusus untuk Title, Description, Category
  const postMainFieldsSchema = z.object({
    title: z
      .string()
      .min(3, { message: "Title must be at least 3 characters" }),
    description: z
      .string()
      .max(5000, { message: "Description max 500 characters" })
      .optional(),
    category: z.string().min(1, { message: "Category is required" }),
  });

  // Helper function to get JWT token from session
  const getJWTToken = () => {
    // NextAuth stores token in session.accessToken
    if (session?.accessToken) {
      return session.accessToken;
    }
    return null;
  };

  // API Functions with JWT Bearer token
  const postAPI = {
    createPost: async (postData: Omit<PostData, "postId">) => {
      const jwtToken = getJWTToken();
      if (!jwtToken) {
        throw new Error("JWT token not available. Please login again.");
      }

      const response = await fetch(
        `${BACKEND_URL}/api/v1/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          credentials: "include",
          body: JSON.stringify(postData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create post");
      }
      return response.json();
    },

    updatePost: async (postId: string, postData: Partial<PostData>) => {
      const jwtToken = getJWTToken();
      if (!jwtToken) {
        throw new Error("JWT token not available. Please login again.");
      }

      const response = await fetch(
        `${BACKEND_URL}/api/v1/posts/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          credentials: "include",
          body: JSON.stringify(postData),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update post");
      }
      return response.json();
    },

    deletePost: async (postId: string) => {
      const jwtToken = getJWTToken();
      if (!jwtToken) {
        throw new Error("JWT token not available. Please login again.");
      }

      const response = await fetch(
        `${BACKEND_URL}/api/v1/posts/${postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete post");
      }
      return response.json();
    },

    getPost: async (postId: string) => {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/posts/${postId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch post");
      }
      return response.json();
    },

    getAllPosts: async () => {
      const response = await fetch(
        `${BACKEND_URL}/api/v1/posts`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch posts");
      }
      return response.json();
    },

    likePost: async (postId: string) => {
      const jwtToken = getJWTToken();
      if (!jwtToken) {
        throw new Error("JWT token not available. Please login again.");
      }

      const response = await fetch(
        `${BACKEND_URL}/api/v1/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to like post");
      }
      return response.json();
    },
  };

  // Load post data for edit mode
  const loadPostForEdit = async () => {
    if (!postId) return;

    setLoading(true);
    try {
      const response = await postAPI.getPost(postId);
      if (response.success && response.post) {
        const post = response.post;
        setTitle(post.title || "");
        setDescription(post.description || "");
        setCategory(post.category || "");
        setMediaUrl(post.mediaUrl || "");
        setBlurred(post.blurred !== undefined ? post.blurred : false);
        setContentSections(post.sections || []);

        // Handle scheduled post data
        if (post.isScheduled && post.scheduledAt) {
          setIsScheduled(true);
          setScheduledDate(new Date(post.scheduledAt));
          const scheduledDateTime = new Date(post.scheduledAt);
          const timeString = scheduledDateTime.toTimeString().slice(0, 8);
          setScheduledTime(timeString);
        }

        // Initialize featured image for member users
        if (session?.userType === "member" && post.mediaUrl) {
          setSelectedFeaturedImage(null);
          setFeaturedImagePreview(post.mediaUrl);
        }
      }
    } catch (error) {
      // Error loading post
      toast({
        title: "Error",
        description: "Failed to load post for editing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllPosts = async () => {
    setLoading(true);
    try {
      const response = await postAPI.getAllPosts();
      if (response.success && response.posts) {
        setPosts(response.posts);
      }
    } catch (error) {
      // Error loading posts
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Content section handlers
  const addContentSection = (type: ContentSection["type"]) => {
    // Check if section type already exists
    if (contentSections.some((section) => section.type === type)) {
      const typeNames = {
        image: "Image",
        code: "Copy Text",
        video: "Video",
        link: "Link",
        html: "HTML",
      };

      toast({
        title: "Limit reached",
        description: `Only one ${typeNames[type]} Section is allowed.`,
        variant: "destructive",
      });
      return;
    }

    // Add the new section
    setContentSections((prevSections) => [
      ...prevSections,
      {
        type,
        content: type === "code" || type === "html" ? "" : undefined,
        src:
          type === "image" || type === "video" || type === "link"
            ? ""
            : undefined,
        imageDetail: type === "image" ? [""] : undefined, // Initialize with one empty URL for images
        order: contentSections.length,
      },
    ]);

    // If it's an image section, also add corresponding arrays for files and previews
    if (type === "image") {
      setContentSectionImageFiles((prevFiles) => [...prevFiles, [null]]);
      setContentSectionImagePreviews((prevPreviews) => [...prevPreviews, [""]]);
    }
  };

  // Helper to check if user is privileged
  const isPrivilegedRole = (role: string | null | undefined) => {
    return ["owner", "admin", "mod"].includes(role || "");
  };

  // In addImageDetail, check limit and show toast if exceeded
  const addImageDetail = (sectionIndex: number) => {
    // Limit to 5 images for non-privileged roles, 30 for god role
    const currentRole = session?.userType;
    const isPrivileged = isPrivilegedRole(currentRole);
    const isGod = currentRole === "god";
    const imageLimit = isGod ? 30 : 5;
    const currentCount =
      contentSections[sectionIndex]?.imageDetail?.length || 0;
    if (!isPrivileged && currentCount >= imageLimit) {
      toast({
        title: "Limit reached",
        description: `You can only add up to ${imageLimit} images per section.`,
        variant: "destructive",
      });
      return;
    }

    // Update sections
    setContentSections((prevSections) =>
      prevSections.map((section, i) => {
        if (i === sectionIndex && section.type === "image") {
          return {
            ...section,
            imageDetail: [...(section.imageDetail || []), ""],
          };
        }
        return section;
      })
    );

    // Update files and previews arrays
    setContentSectionImageFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      if (!newFiles[sectionIndex]) newFiles[sectionIndex] = [];
      newFiles[sectionIndex] = [...newFiles[sectionIndex], null];
      return newFiles;
    });

    setContentSectionImagePreviews((prevPreviews) => {
      const newPreviews = [...prevPreviews];
      if (!newPreviews[sectionIndex]) newPreviews[sectionIndex] = [];
      newPreviews[sectionIndex] = [...newPreviews[sectionIndex], ""];
      return newPreviews;
    });
  };

  const updateImageDetail = (
    sectionIndex: number,
    imageIndex: number,
    value: string
  ) => {
    setContentSections((prevSections) =>
      prevSections.map((section, i) => {
        if (i === sectionIndex && section.type === "image") {
          const newImageDetail = [...(section.imageDetail || [])];
          newImageDetail[imageIndex] = value;
          return {
            ...section,
            imageDetail: newImageDetail,
          };
        }
        return section;
      })
    );
  };

  const removeImageDetail = (sectionIndex: number, imageIndex: number) => {
    // Update sections
    setContentSections((prevSections) =>
      prevSections.map((section, i) => {
        if (i === sectionIndex && section.type === "image") {
          const newImageDetail =
            section.imageDetail?.filter((_, idx) => idx !== imageIndex) || [];
          return {
            ...section,
            imageDetail: newImageDetail,
          };
        }
        return section;
      })
    );

    // Update files and previews arrays
    setContentSectionImageFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      if (newFiles[sectionIndex]) {
        newFiles[sectionIndex] = newFiles[sectionIndex].filter(
          (_, idx) => idx !== imageIndex
        );
      }
      return newFiles;
    });

    setContentSectionImagePreviews((prevPreviews) => {
      const newPreviews = [...prevPreviews];
      if (newPreviews[sectionIndex]) {
        newPreviews[sectionIndex] = newPreviews[sectionIndex].filter(
          (_, idx) => idx !== imageIndex
        );
      }
      return newPreviews;
    });
  };

  const updateContentSection = (
    index: number,
    updates: Partial<ContentSection>
  ) => {
    setContentSections((prevSections) =>
      prevSections.map((section, i) =>
        i === index ? { ...section, ...updates } : section
      )
    );
  };

  const removeContentSection = (index: number) => {
    const updatedSections = contentSections
      .filter((_, i) => i !== index)
      .map((section, i) => ({ ...section, order: i }));
    setContentSections(updatedSections);

    // Also remove the corresponding image files and previews
    const updatedFiles = contentSectionImageFiles.filter((_, i) => i !== index);
    const updatedPreviews = contentSectionImagePreviews.filter(
      (_, i) => i !== index
    );
    setContentSectionImageFiles(updatedFiles);
    setContentSectionImagePreviews(updatedPreviews);
  };

  const moveContentSection = (index: number, direction: "up" | "down") => {
    setContentSections((prevSections) => {
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === prevSections.length - 1)
      ) {
        return prevSections;
      }

      const newIndex = direction === "up" ? index - 1 : index + 1;
      const updatedSections = [...prevSections];
      const temp = updatedSections[index];
      updatedSections[index] = updatedSections[newIndex];
      updatedSections[newIndex] = temp;

      // Update order values
      updatedSections.forEach((section, i) => {
        section.order = i;
      });

      return updatedSections;
    });
  };

  // Handler untuk pilih & preview gambar
  const handleFeaturedImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = imageSchema.safeParse(file);
    if (!result.success) {
      toast({
        title: "Error",
        description: result.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setSelectedFeaturedImage(file);
    setFeaturedImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveFeaturedImage = () => {
    setSelectedFeaturedImage(null);
    setFeaturedImagePreview(null);
    setMediaUrl("");
  };

  // Add handler for file input change for content section images
  const handleContentSectionImageChange = (
    sectionIndex: number,
    imageIndex: number,
    file: File | null
  ) => {
    setContentSectionImageFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      if (!newFiles[sectionIndex]) newFiles[sectionIndex] = [];
      newFiles[sectionIndex][imageIndex] = file;
      return newFiles;
    });

    setContentSectionImagePreviews((prevPreviews) => {
      const newPreviews = [...prevPreviews];
      if (!newPreviews[sectionIndex]) newPreviews[sectionIndex] = [];
      newPreviews[sectionIndex][imageIndex] = file
        ? URL.createObjectURL(file)
        : "";
      return newPreviews;
    });

    updateImageDetail(sectionIndex, imageIndex, "");

    // Show toast if user reaches image limit (non-privileged roles)
    const currentRole = session?.userType;
    const isPrivileged = isPrivilegedRole(currentRole);
    const isGod = currentRole === "god";
    const imageLimit = isGod ? 30 : 5;
    const currentCount = (contentSectionImageFiles[sectionIndex] || []).filter(
      (f) => !!f
    ).length;
    if (!isPrivileged && currentCount === imageLimit) {
      toast({
        title: "Limit reached",
        description: `You have added ${imageLimit} images. This is the maximum allowed per section.`,
        variant: "destructive",
      });
    }
  };

  // Form submission handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSubmitModal(true);
  };

  // Pada handleSubmitConfirm, tambahkan proses upload featured image sebelum submit post
  const handleSubmitConfirm = async () => {
    setConfirmLoading(true);
    if (!session) {
      toast({
        title: "Error",
        description: "Please sign in to create a post",
        variant: "destructive",
      });
      setConfirmLoading(false);
      return;
    }
    // Validasi Title, Description, Category
    const mainFieldsValidation = postMainFieldsSchema.safeParse({
      title: title.trim(),
      description: description?.trim() || undefined,
      category: isCustomCategory ? customCategory.trim() : category.trim(),
    });
    if (!mainFieldsValidation.success) {
      toast({
        title: "Error",
        description: mainFieldsValidation.error.issues[0].message,
        variant: "destructive",
      });
      setConfirmLoading(false);
      return;
    }

    setLoading(true);
    try {
      let finalMediaUrl = mediaUrl.trim() || undefined;

      // Handle featured image based on user role
      if (session?.userType === "member") {
        // For member role, use the image URL directly
        if (selectedFeaturedImage) {
          setUploadingFeaturedImage(true);
          const toBase64 = (file: File) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (error) => reject(error);
            });
          const base64 = await toBase64(selectedFeaturedImage);
          const res = await fetch("/api/cloudnary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file: base64 }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast({
              title: "Error",
              description: data.error || "Failed to upload image",
              variant: "destructive",
            });
            setUploadingFeaturedImage(false);
            setConfirmLoading(false);
            setLoading(false);
            return;
          }
          finalMediaUrl = data.url; // gunakan url hasil upload
          setMediaUrl(data.url); // tetap update state untuk preview
          setUploadingFeaturedImage(false);
        }
      } else {
        // For other roles, handle file upload
        if (selectedFeaturedImage) {
          setUploadingFeaturedImage(true);
          const toBase64 = (file: File) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (error) => reject(error);
            });
          const base64 = await toBase64(selectedFeaturedImage);
          const res = await fetch("/api/cloudnary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file: base64 }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast({
              title: "Error",
              description: data.error || "Failed to upload image",
              variant: "destructive",
            });
            setUploadingFeaturedImage(false);
            setConfirmLoading(false);
            setLoading(false);
            return;
          }
          finalMediaUrl = data.url; // gunakan url hasil upload
          setMediaUrl(data.url); // tetap update state untuk preview
          setUploadingFeaturedImage(false);
        }
      }

      // Upload all content section images
      const uploadToCloudinary = async (base64: string): Promise<string> => {
        const res = await fetch("/api/cloudnary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        return data.url;
      };
      // For each image section, upload all files and collect URLs
      const updatedSections = await Promise.all(
        contentSections.map(async (section, sectionIdx) => {
          if (
            section.type === "image" &&
            contentSectionImageFiles[sectionIdx]
          ) {
            const files = (contentSectionImageFiles[sectionIdx] || []).filter(
              (f): f is File => !!f
            );
            const urls: string[] = [];
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (file) {
                // Convert to base64
                const toBase64 = (file: File) =>
                  new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = (error) => reject(error);
                  });
                const base64 = await toBase64(file);
                const url = await uploadToCloudinary(base64);
                urls.push(url);
              }
            }
            return {
              ...section,
              imageDetail: urls,
            };
          }
          return section;
        })
      );

      const filteredSections = updatedSections.filter(
        (section) => section.type !== "html"
      );

      // Calculate scheduled date if scheduling is enabled
      let scheduledAt = null;
      if (isScheduled && scheduledDate) {
        const [hours, minutes, seconds] = scheduledTime.split(":").map(Number);
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(hours, minutes, seconds, 0);
        scheduledAt = scheduledDateTime.toISOString();
      }

      const postData: Omit<PostData, "postId"> = {
        title: title.trim(),
        description: description.trim(),
        category: isCustomCategory ? customCategory.trim() : category.trim(),
        mediaUrl: finalMediaUrl, // gunakan url yang sudah pasti
        blurred: blurred,
        sections: filteredSections.map((section, index) => ({
          type: section.type,
          content: section.content || null,
          src: section.src || null,
          imageDetail:
            section.type === "image"
              ? section.imageDetail?.filter((url) => url.trim() !== "") || []
              : undefined,
          order: section.order || index + 1,
        })),
        author: {
          userId: session.user.id!,
          username: session.user.name || session.user.email?.split("@")[0] || "User",
          profilePic: session.user.image || undefined,
        },
        scheduledAt: scheduledAt || undefined,
        isScheduled: isScheduled,
      };
      let response;
      if (mode === "edit" && postId) {
        response = await postAPI.updatePost(postId, postData);
        toast({
          title: "Success",
          description: "Post updated successfully!",
          variant: "default",
        });
      } else {
        response = await postAPI.createPost(postData);
        toast({
          title: "Success",
          description: isScheduled
            ? `Post scheduled successfully! It will be published on ${scheduledDate?.toLocaleDateString()} at ${scheduledTime}`
            : "Post created successfully!",
          variant: "default",
        });

        // Refresh postsCount setelah berhasil membuat post
        if (session?.user) {
          try {
            const jwtToken = getJWTToken();
            const res = await fetch(
              `${BACKEND_URL}/api/v1/posts/user/posts-count`,
              {
                headers: { Authorization: `Bearer ${jwtToken}` },
              }
            );
            const data = await res.json();
            if (data.success) {
              setUserPostsCount(data.postsCount);
              setUserRole(data.role);
              if (["member", "vip", "god"].includes(data.role)) {
                setPostLimitReached(data.postsCount >= roleLimit[data.role]);
              } else {
                setPostLimitReached(false);
              }
            }
          } catch (error) {
            // Error refreshing posts count
          }
        }

        if (response && response.post && response.post.postId) {
          router.push(`/share/${response.post.postId}`);
          return;
        }
      }
      if (mode === "create") {
        setTitle("");
        setDescription("");
        setCategory("");
        setMediaUrl("");
        setBlurred(false);
        setContentSections([]);
        setSelectedFeaturedImage(null);
        setFeaturedImagePreview(null);
        setContentSectionImageFiles([]);
        setContentSectionImagePreviews([]);
      }
    } catch (error) {
      // Error saving post
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setConfirmLoading(false);
      setShowSubmitModal(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!session) {
      toast({
        title: "Error",
        description: "Please sign in to like posts",
        variant: "destructive",
      });
      return;
    }
    try {
      await postAPI.likePost(postId);
      if (mode === "list") {
        loadAllPosts();
      }
      toast({
        title: "Success",
        description: "Post liked!",
        variant: "default",
      });
    } catch (error) {
      // Error liking post
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }
    try {
      await postAPI.deletePost(postId);
      toast({
        title: "Success",
        description: "Post deleted successfully!",
        variant: "default",
      });
      if (mode === "list") {
        loadAllPosts();
      }
    } catch (error) {
      // Error deleting post
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  // Render content section editor
  const renderContentSectionEditor = (
    section: ContentSection,
    index: number
  ) => {
    // Disable Add Image button if limit reached for non-privileged
    const currentRole = session?.userType;
    const isPrivileged = isPrivilegedRole(currentRole);
    const isGod = currentRole === "god";
    const imageLimit = isGod ? 30 : 5;
    const currentCount = contentSections[index]?.imageDetail?.length || 0;
    const isDisabled = !isPrivileged && currentCount >= imageLimit;

    return (
      <div
        key={index}
        className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-700"
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">
              {section.type.charAt(0).toUpperCase() + section.type.slice(1)}{" "}
              Section
            </h4>
            {section.type === "image" && section.imageDetail && (
              <span className="text-xs bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded">
                {section.imageDetail.filter((url) => url.trim() !== "").length}{" "}
                additional images
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              onClick={() => moveContentSection(index, "up")}
              disabled={index === 0}
              variant="outline"
              size="sm"
              title="Move up"
            >
              ↑
            </Button>
            <Button
              type="button"
              onClick={() => moveContentSection(index, "down")}
              disabled={index === contentSections.length - 1}
              variant="outline"
              size="sm"
              title="Move down"
            >
              ↓
            </Button>
            <Button
              type="button"
              onClick={() => removeContentSection(index)}
              variant="destructive"
              size="sm"
              title="Remove section"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {(section.type === "code" || section.type === "html") && (
          <textarea
            value={section.content || ""}
            onChange={(e) =>
              updateContentSection(index, { content: e.target.value })
            }
            placeholder={`Enter ${section.type} content...`}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-vertical min-h-[100px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={section.type === "code" ? 8 : 4}
          />
        )}

        {section.type === "image" && (
          <div className="space-y-4">
            {/* Additional images */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Additional Images (
                  {section.imageDetail?.filter((url) => url.trim() !== "")
                    .length || 0}
                  )
                </label>
                <Button
                  type="button"
                  onClick={() => addImageDetail(index)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                  disabled={isDisabled}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Image</span>
                </Button>
              </div>
              <div className="space-y-2">
                {section.imageDetail &&
                  section.imageDetail.map((_, imageIndex) => (
                    <div
                      key={imageIndex}
                      className="flex flex-row items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                    >
                      <span className="text-sm text-gray-500 w-8 text-center mb-1 md:mb-0 md:w-8">
                        {imageIndex + 1}.
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleContentSectionImageChange(
                            index,
                            imageIndex,
                            file
                          );
                        }}
                        className="w-full w-full h-10 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {contentSectionImagePreviews[index]?.[imageIndex] && (
                        <img
                          src={contentSectionImagePreviews[index][imageIndex]}
                          alt={`Preview ${imageIndex + 1}`}
                          className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600 shrink-0"
                        />
                      )}
                      <Button
                        type="button"
                        onClick={() => removeImageDetail(index, imageIndex)}
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
              {(!section.imageDetail || section.imageDetail.length === 0) && (
                <div className="text-center py-4 text-gray-500 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  No additional images added yet. Click &quot;Add Image&quot; to start.
                </div>
              )}
            </div>
          </div>
        )}

        {(section.type === "video" || section.type === "link") && (
          <input
            type="url"
            value={section.src || ""}
            onChange={(e) =>
              updateContentSection(index, { src: e.target.value })
            }
            placeholder={`Enter ${section.type} URL...`}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
      </div>
    );
  };

  // List mode rendering
  if (mode === "list") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          All Posts
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                onLike={handleLike}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Create/Edit form rendering
  const currentPostData: PostData = {
    title,
    description,
    category: isCustomCategory ? customCategory : category,
    mediaUrl: featuredImagePreview || mediaUrl || undefined,
    sections: contentSections,
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white text-black">
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {mode === "edit" ? "Edit Post" : "Create New Post"}
              </h1>

              {userRole &&
                ["member", "vip", "god"].includes(userRole) &&
                postLimitReached && (
                  <div className="bg-red-100 text-red-700 p-4 rounded mb-4 text-center font-semibold">
                    <div className="mb-3">
                      Limit reached: <b>{userRole}</b> (
                      {roleLimit[userRole!] || 0} posts)
                    </div>

                    <div className="bg-white bg-opacity-80 p-3 rounded mb-4">
                      <div className="text-xs font-bold text-red-700 mb-2">
                        📊 ROLE LIMITS
                      </div>
                      <div className="text-xs text-gray-800 space-y-1">
                        <div>• Member: 3 posts (AI review)</div>
                        <div>• VIP: 5 posts (AI review)</div>
                        <div>• God: 10 posts (Instant)</div>
                        <div>• Mod: Unlimited (Instant)</div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        onClick={() => router.push("/update")}
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-gray-100 text-gray-900 border-gray-300 hover:border-gray-400"
                      >
                        Go to Update Page
                      </Button>
                      <Button
                        onClick={() => router.push("/crypto-payment")}
                        variant="default"
                        size="sm"
                        className="bg-gray-900 hover:bg-gray-800 text-white border-gray-900"
                      >
                        Upgrade Your Role
                      </Button>
                    </div>
                  </div>
                )}
              {userRole && ["owner", "admin"].includes(userRole) && (
                <div className="bg-green-100 text-green-700 p-4 rounded mb-4 text-center font-semibold">
                  You have no post limit.
                </div>
              )}

              {userRole && ["god", "mod"].includes(userRole) && (
                <div className="bg-green-100 text-green-800 p-4 rounded mb-4 text-center font-semibold">
                  <div className="mb-2">💎 INSTANT PUBLISHING</div>
                  <div className="text-sm font-normal">
                    Posts published instantly, no review required
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Basic Information
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter post title..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter post description..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-vertical min-h-[100px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <Select
                      value={category}
                      onValueChange={(val) => {
                        setCategory(val);
                        if (val !== "__CUSTOM__") setCustomCategory("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOKSIL">DOKSIL</SelectItem>
                        <SelectItem value="NEWS">NEWS</SelectItem>
                        <SelectItem value="GLOBAL">GLOBAL</SelectItem>
                        <SelectItem value="CRYPTO">CRYPTO</SelectItem>
                        <SelectItem value="__CUSTOM__">Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                    {isCustomCategory && (
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter custom category..."
                        className="mt-2 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Featured Image
                    </label>
                    <div
                      className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer py-6 group"
                      onClick={() =>
                        !uploadingFeaturedImage &&
                        !loading &&
                        document.getElementById("featured-image-input")?.click()
                      }
                      style={{ minHeight: 140 }}
                    >
                      <input
                        id="featured-image-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFeaturedImageChange}
                        disabled={uploadingFeaturedImage || loading}
                      />
                      {featuredImagePreview ? (
                        <div className="relative w-32 h-32">
                          <img
                            src={featuredImagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg border border-gray-300 dark:border-gray-600 shadow-md"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFeaturedImage();
                            }}
                            className="absolute -top-3 -right-3 bg-white text-red-600 hover:bg-red-600 hover:text-white rounded-full p-2 shadow-lg z-10 border-2 border-white transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
                            title="Remove image"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          <Upload className="w-8 h-8 mb-2" />
                          <span className="font-semibold">
                            Click or drag to upload
                          </span>
                          <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                            Max size 3MB
                          </span>
                        </div>
                      )}
                      {uploadingFeaturedImage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-60  text-xs rounded-lg animate-fade-in z-20 transition-opacity duration-300">
                          <Loader2 className="w-6 h-6 animate-spin mb-2" />
                          <span className="font-semibold text-base text-neutral-950 drop-shadow">
                            Uploading image...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {session?.userType !== "member" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Blur Protection
                      </label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={blurred}
                          onCheckedChange={setBlurred}
                          className="data-[state=checked]:bg-neutral-900"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {blurred ? "Enabled" : "Disabled"} -{" "}
                          {blurred ? (
                            <>
                              Images will be blurred for{" "}
                              <span className="text-red-500 font-semibold">
                                non-VIP
                              </span>{" "}
                              users
                            </>
                          ) : (
                            "Images will be shown normally"
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Scheduled Post Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Schedule Post
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={isScheduled}
                          onCheckedChange={setIsScheduled}
                          className="data-[state=checked]:bg-neutral-900"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {isScheduled ? "Enabled" : "Disabled"} -{" "}
                          {isScheduled ? (
                            <>
                              Post will be published at{" "}
                              <span className="text-blue-500 font-semibold">
                                scheduled time
                              </span>
                            </>
                          ) : (
                            "Post will be published immediately"
                          )}
                        </span>
                      </div>

                      {isScheduled && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2 mb-3">
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Schedule Settings
                            </span>
                          </div>
                          <DateTimePicker
                            date={scheduledDate}
                            onDateChange={setScheduledDate}
                            timeValue={scheduledTime}
                            onTimeChange={setScheduledTime}
                            className="w-full"
                          />
                          {scheduledDate && (
                            <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Post will be published on{" "}
                              <span className="font-semibold">
                                {scheduledDate.toLocaleDateString()} at{" "}
                                {scheduledTime}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Sections */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Content Sections
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => addContentSection("image")}
                        variant="outline"
                        size="sm"
                      >
                        <ImageIcon className="w-4 h-4 mr-1" />
                        Image
                      </Button>
                      <Button
                        type="button"
                        onClick={() => addContentSection("code")}
                        variant="outline"
                        size="sm"
                      >
                        + COPY / CA
                      </Button>
                      <Button
                        type="button"
                        onClick={() => addContentSection("video")}
                        variant="outline"
                        size="sm"
                      >
                        + Video
                      </Button>
                      <Button
                        type="button"
                        onClick={() => addContentSection("link")}
                        variant="outline"
                        size="sm"
                      >
                        + Link
                      </Button>
                      <Button
                        type="button"
                        onClick={() => addContentSection("html")}
                        variant="outline"
                        size="sm"
                      >
                        + Description
                      </Button>
                    </div>
                  </div>

                  {contentSections.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      No content sections added yet. Click the buttons above to
                      add content.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contentSections.map((section, index) =>
                        renderContentSectionEditor(section, index)
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading || !title.trim() || postLimitReached}
                    className=" py-3 w-full"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {mode === "edit" ? "Updating..." : "Creating..."}
                      </div>
                    ) : (
                      <>{mode === "edit" ? "Update Post" : "Create Post"}</>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Preview Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Live Preview
              </h2>
              <div className="sticky top-6">
                <BlogPostPreview
                  postData={currentPostData}
                  contentSectionImagePreviews={contentSectionImagePreviews}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tambahkan modal konfirmasi di bawah */}
        {showSubmitModal && (
          <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Confirm {mode === "edit" ? "Update" : "Create"}
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to{" "}
                  {mode === "edit" ? "update" : "create"} this post?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={() => setShowSubmitModal(false)}
                  variant="outline"
                  disabled={confirmLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitConfirm}
                  variant="default"
                  disabled={confirmLoading}
                >
                  {confirmLoading
                    ? mode === "edit"
                      ? "Updating..."
                      : "Creating..."
                    : mode === "edit"
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </>
  );
};

export default Post;
