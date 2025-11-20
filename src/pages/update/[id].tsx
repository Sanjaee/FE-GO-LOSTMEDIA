import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ImageIcon,
  Plus,
  Trash2,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { DateTimePicker } from "@/components/general/DateTimePicker";
import ImageLightbox from "@/components/general/ImageLightbox";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
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

interface ContentSection {
  id?: string;
  type: "image" | "code" | "video" | "link" | "html";
  content?: string | null;
  src?: string | null;
  imageDetail?: string[];
  order: number;
}


const AdminUpdatePostPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [blurred, setBlurred] = useState(false);
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Scheduled post state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    undefined
  );
  const [scheduledTime, setScheduledTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
  });

  // Add new state for featured image file upload
  const [selectedFeaturedImage, setSelectedFeaturedImage] =
    useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<
    string | null
  >(null);
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);

  // Add new state for content section image files and previews
  const [contentSectionImageFiles, setContentSectionImageFiles] = useState<
    (File | null)[][]
  >([]);
  const [contentSectionImagePreviews, setContentSectionImagePreviews] =
    useState<string[][]>([]);

  // State for image lightbox
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Helper function to get JWT token from session
  const getJWTToken = () => {
    // NextAuth stores token in session.accessToken
    if (session?.accessToken) {
      return session.accessToken;
    }
    return null;
  };

  // Helper to check if user is privileged
  const isPrivilegedRole = (role: string | null | undefined) => {
    return ["owner", "admin", "mod"].includes(role || "");
  };

  // Set default scheduled date when scheduling is enabled
  useEffect(() => {
    if (isScheduled && !scheduledDate) {
      const now = new Date();
      setScheduledDate(now);
    }
  }, [isScheduled, scheduledDate]);

  // Fetch post data for edit
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/v1/posts/${id}`
        );
        const data = await res.json();
        // Backend returns { data: { success: true, post: {...} } } or { success: true, post: {...} }
        const post = data.data?.post || data.post;
        const isSuccess = data.data?.success || data.success;
        if (isSuccess && post) {
          setTitle(post.title || "");
          setDescription(post.description || "");
          setCategory(post.category || "");
          setMediaUrl(post.mediaUrl || "");
          setBlurred(post.blurred !== undefined ? post.blurred : false);
          setContentSections(post.sections || []);

          // Load scheduling data if post is scheduled
          if (post.isScheduled && post.scheduledAt) {
            setIsScheduled(true);
            const scheduledDateTime = new Date(post.scheduledAt);
            setScheduledDate(scheduledDateTime);
            setScheduledTime(scheduledDateTime.toTimeString().slice(0, 8));
          }

          // Set featured image preview if mediaUrl exists
          if (post.mediaUrl) {
            setFeaturedImagePreview(post.mediaUrl);
          }

          // Initialize content section image files and previews
          const initialFiles: (File | null)[][] = [];
          const initialPreviews: string[][] = [];

          post.sections?.forEach((section: ContentSection) => {
            if (section.type === "image" && section.imageDetail) {
              // For existing images, set files as null and previews as URLs
              initialFiles.push(
                new Array(section.imageDetail.length).fill(null)
              );
              initialPreviews.push([...section.imageDetail]);
            } else {
              initialFiles.push([]);
              initialPreviews.push([]);
            }
          });

          setContentSectionImageFiles(initialFiles);
          setContentSectionImagePreviews(initialPreviews);
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to load post",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load post",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPost();
  }, [id]);

  // Cleanup object URLs when component unmounts or featuredImagePreview changes
  useEffect(() => {
    return () => {
      // Cleanup any object URLs when component unmounts
      if (featuredImagePreview && featuredImagePreview !== mediaUrl) {
        URL.revokeObjectURL(featuredImagePreview);
      }
    };
  }, [featuredImagePreview, mediaUrl]);

  // Content section handlers (same as post.tsx)
  const addContentSection = (type: ContentSection["type"]) => {
    const newSection: ContentSection = {
      type,
      content: type === "code" || type === "html" ? "" : undefined,
      src:
        type === "image" || type === "video" || type === "link"
          ? ""
          : undefined,
      imageDetail: type === "image" ? [""] : undefined,
      order: contentSections.length,
    };
    setContentSections([...contentSections, newSection]);

    // If it's an image section, also add corresponding arrays for files and previews
    if (type === "image") {
      setContentSectionImageFiles((prevFiles) => [...prevFiles, [null]]);
      setContentSectionImagePreviews((prevPreviews) => [...prevPreviews, [""]]);
    }
  };
  const addImageDetail = (sectionIndex: number) => {
    // Sama seperti di post.tsx: batasi jumlah gambar dan update state aman
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

    // Update files dan previews
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

    // Update files dan previews agar index tetap sinkron
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
    const updatedSections = contentSections.map((section, i) =>
      i === index ? { ...section, ...updates } : section
    );
    setContentSections(updatedSections);
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
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === contentSections.length - 1)
    ) {
      return;
    }
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updatedSections = [...contentSections];
    const temp = updatedSections[index];
    updatedSections[index] = updatedSections[newIndex];
    updatedSections[newIndex] = temp;
    updatedSections.forEach((section, i) => {
      section.order = i;
    });
    setContentSections(updatedSections);
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

  // Handler untuk pilih & preview gambar featured image
  const handleFeaturedImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 3MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "File must be an image",
        variant: "destructive",
      });
      return;
    }

    // Clear any existing preview first
    if (featuredImagePreview && featuredImagePreview !== mediaUrl) {
      URL.revokeObjectURL(featuredImagePreview);
    }

    setSelectedFeaturedImage(file);
    setFeaturedImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveFeaturedImage = () => {
    // Cleanup object URL if it exists and is different from mediaUrl
    if (featuredImagePreview && featuredImagePreview !== mediaUrl) {
      URL.revokeObjectURL(featuredImagePreview);
    }

    setSelectedFeaturedImage(null);
    setFeaturedImagePreview(null);
    // Don't clear mediaUrl here as it might contain the existing image URL
    // The preview will show the existing image if no new file is selected
  };


  // Fungsi untuk handle update setelah konfirmasi
  const handleUpdateConfirm = async () => {
    setConfirmLoading(true);
    if (!session) {
      toast({
        title: "Error",
        description: "Please sign in to update a post",
        variant: "destructive",
      });
      setConfirmLoading(false);
      return;
    }
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive",
      });
      setConfirmLoading(false);
      return;
    }
    setLoading(true);
    try {
      const jwtToken = getJWTToken();
      if (!jwtToken) throw new Error("JWT token not available");

      // Upload all content section images first
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

            // Upload new files
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

            // Keep existing URLs for images that weren't changed
            const existingUrls = (section.imageDetail || []).filter(
              (url, idx) => {
                const file = contentSectionImageFiles[sectionIdx]?.[idx];
                return !file && url.trim() !== ""; // Keep URL if no new file was uploaded
              }
            );

            // Combine existing URLs with new uploaded URLs
            const allUrls = [...existingUrls, ...urls];

            return {
              ...section,
              imageDetail: allUrls,
            };
          }
          return section;
        })
      );

      // Upload featured image if a new file was selected
      let finalMediaUrl = mediaUrl.trim() || undefined;
      if (selectedFeaturedImage) {
        try {
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
          if (!res.ok)
            throw new Error(data.error || "Featured image upload failed");
          finalMediaUrl = data.url;
        } catch {
          toast({
            title: "Error",
            description: "Failed to upload featured image",
            variant: "destructive",
          });
          setConfirmLoading(false);
          setUploadingFeaturedImage(false);
          return;
        } finally {
          setUploadingFeaturedImage(false);
        }
      }

      // Calculate scheduledAt if post is scheduled
      let scheduledAt: string | undefined = undefined;
      if (isScheduled && scheduledDate && scheduledTime) {
        const [hours, minutes, seconds] = scheduledTime.split(":").map(Number);
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(hours, minutes, seconds, 0);
        scheduledAt = scheduledDateTime.toISOString();
      }

      const postData = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        mediaUrl: finalMediaUrl,
        blurred: blurred,
        scheduledAt: scheduledAt || undefined,
        isScheduled: isScheduled,
        sections: updatedSections.map((section, index) => ({
          type: section.type,
          content: section.content || null,
          src: section.src || null,
          imageDetail:
            section.type === "image"
              ? section.imageDetail?.filter((url) => url.trim() !== "") || []
              : undefined,
          order: section.order || index + 1,
        })),
      };

      const response = await fetch(
        `${BACKEND_URL}/api/v1/posts/${id}`,
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
      const data = await response.json();
      // Backend returns { data: { success: true, post: {...} } }
      const isSuccess = data.data?.success || data.success;
      if (isSuccess) {
        const successMessage =
          isScheduled && scheduledAt
            ? `Post scheduled successfully! It will be published on ${new Date(
                scheduledAt
              ).toLocaleString()}`
            : "Post updated successfully!";

        toast({
          title: "Success",
          description: successMessage,
          variant: "default",
        });
        router.push("/share/" + id);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update post",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setConfirmLoading(false);
      setShowUpdateModal(false);
    }
  };

  // Render content section editor (same as post.tsx)
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
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
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
            <div>
              <div className="mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Additional Images (
                  {(() => {
                    const existingImages =
                      section.imageDetail?.filter(
                        (url) => url && url.trim() !== ""
                      ).length || 0;
                    const newImages =
                      contentSectionImageFiles[index]?.filter(
                        (file) => file !== null
                      ).length || 0;
                    return existingImages + newImages;
                  })()}
                  ):
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
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
                {(() => {
                  // Get existing images from section.imageDetail
                  const existingImages = section.imageDetail || [];

                  // Get new images from contentSectionImageFiles
                  const newImages = contentSectionImageFiles[index] || [];

                  // Combine all images for display
                  type ImageItem = {
                    url: string;
                    index: number;
                    isExisting: boolean;
                    imageIndex: number;
                  };

                  const allImages: ImageItem[] = [];

                  // Add existing images
                  existingImages.forEach((imageUrl, idx) => {
                    allImages.push({
                      url: imageUrl,
                      index: idx,
                      isExisting: true,
                      imageIndex: idx,
                    });
                  });

                  // Add new images
                  newImages.forEach((file, idx) => {
                    if (file) {
                      allImages.push({
                        url: contentSectionImagePreviews[index]?.[idx] || "",
                        index: existingImages.length + idx,
                        isExisting: false,
                        imageIndex: idx,
                      });
                    }
                  });

                  return allImages.map((image, displayIndex) => (
                    <div
                      key={`${image.isExisting ? "existing" : "new"}-${
                        image.imageIndex
                      }`}
                      className="flex gap-2 items-center"
                    >
                      <span className="text-sm text-gray-500 w-8 text-center">
                        {displayIndex + 1}.
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleContentSectionImageChange(
                            index,
                            image.imageIndex,
                            file
                          );
                        }}
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {image.url && (
                        <ImageLightbox
                          width={64}
                          height={64}
                          src={image.url}
                          alt={`Preview ${displayIndex + 1}`}
                          className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      )}
                      <Button
                        type="button"
                        onClick={() =>
                          removeImageDetail(index, image.imageIndex)
                        }
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ));
                })()}
              </div>
              {(() => {
                const existingImages = section.imageDetail || [];
                const newImages = contentSectionImageFiles[index] || [];
                const hasExistingImages = existingImages.length > 0;
                const hasNewImages = newImages.some((file) => file !== null);

                if (!hasExistingImages && !hasNewImages) {
                  return (
                    <div className="text-center py-4 text-gray-500 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      No additional images added yet. Click &quot;Add Image&quot; to
                      start.
                    </div>
                  );
                }
                return null;
              })()}
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


  return (
    <>
      <Navbar enableSearch={false} />
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Post
            </h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowUpdateModal(true);
              }}
              className="space-y-6"
            >
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
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DATA LEAKED">DATA LEAKED</SelectItem>
                      <SelectItem value="NEWS">NEWS</SelectItem>
                      <SelectItem value="GLOBAL">GLOBAL</SelectItem>
                      <SelectItem value="CRYPTO">CRYPTO</SelectItem>
                    </SelectContent>
                  </Select>
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
                          <>Post will be published at the scheduled time</>
                        ) : (
                          "Post will be published immediately"
                        )}
                      </span>
                    </div>
                    {isScheduled && (
                      <div className="pl-6">
                        <DateTimePicker
                          date={scheduledDate}
                          onDateChange={setScheduledDate}
                          timeValue={scheduledTime}
                          onTimeChange={setScheduledTime}
                          className="max-w-md"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Select the date and time when you want this post to be
                          published
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Content Sections */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex flex-col mb-4 space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Content Sections
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Untuk menambah gambar, gunakan tombol <b>Add Image</b> di dalam Image Section. Di sini hanya untuk menambah section teks / video / link.
                  </p>
                  <div className="flex flex-wrap gap-2">
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
                      + Description
                    </Button>
                    <Button
                      type="button"
                      onClick={() => addContentSection("html")}
                      variant="outline"
                      size="sm"
                    >
                      + HTML
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
                  disabled={loading || !title.trim()}
                  className="px-8 py-3"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    <>Update Post</>
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
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                  {title || "Untitled Post"}
                </h1>
                {(featuredImagePreview || mediaUrl) && (
                  <div className="mb-4">
                    <ImageLightbox
                      width={800}
                      height={400}
                      src={featuredImagePreview || mediaUrl}
                      alt={title}
                      className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </div>
                )}
                <p className="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap break-words">
                  {description || "No description provided"}
                </p>
                {category && (
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mb-4">
                    {category}
                  </span>
                )}
                <div className="prose max-w-none whitespace-pre-wrap break-words">
                  {contentSections
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => {
                      if (section.type === "image") {
                        return (
                          <div key={index} className="mb-4">
                            {/* Main image */}
                            {section.src && (
                              <div className="mb-4">
                                <ImageLightbox
                                  width={800}
                                  height={600}
                                  src={section.src}
                                  alt="Main image"
                                  className="w-full h-auto rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                                />
                              </div>
                            )}
                            {/* Additional images label */}
                            {section.imageDetail &&
                              section.imageDetail.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Additional Images (
                                    {(() => {
                                      const existingImages =
                                        section.imageDetail.filter(
                                          (url) => url && url.trim() !== ""
                                        ).length;
                                      const newImages =
                                        contentSectionImageFiles[index]?.filter(
                                          (file) => file !== null
                                        ).length || 0;
                                      return existingImages + newImages;
                                    })()}
                                    ):
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {(() => {
                                      // Get existing images
                                      const existingImages = section.imageDetail
                                        .filter(
                                          (url) => url && url.trim() !== ""
                                        )
                                        .map((imageUrl, idx) => {
                                          const previewUrl =
                                            contentSectionImagePreviews[
                                              index
                                            ]?.[idx];
                                          const displayUrl =
                                            previewUrl || imageUrl;
                                          return {
                                            url: displayUrl,
                                            index: idx,
                                            isNew: false,
                                          };
                                        });

                                      // Get new uploaded images
                                      const newImages =
                                        contentSectionImageFiles[index]
                                          ?.map((file, idx) => {
                                            if (file) {
                                              const previewUrl =
                                                contentSectionImagePreviews[
                                                  index
                                                ]?.[idx];
                                              if (previewUrl) {
                                                return {
                                                  url: previewUrl,
                                                  index:
                                                    existingImages.length + idx,
                                                  isNew: true,
                                                };
                                              }
                                            }
                                            return null;
                                          })
                                          .filter(Boolean) || [];

                                      // Combine and display all images
                                      const allImages = [
                                        ...existingImages,
                                        ...newImages,
                                      ];

                                      return allImages.map((image, idx) => {
                                        if (!image) return null;
                                        return (
                                          <div
                                            key={`${
                                              image.isNew ? "new" : "existing"
                                            }-${image.index}`}
                                            className="relative cursor-pointer"
                                            onClick={() => {
                                              setGalleryImages(
                                                allImages
                                                  .filter((img) => img !== null)
                                                  .map((img) => img!.url)
                                              );
                                              setCurrentImageIndex(idx);
                                              setShowGallery(true);
                                            }}
                                          >
                                            <ImageLightbox
                                              width={400}
                                              height={300}
                                              src={image.url}
                                              alt={`Additional image ${
                                                image.index + 1
                                              }`}
                                              className="w-full h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow"
                                            />
                                            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                              {image.index + 1}
                                            </div>
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>
                              )}
                          </div>
                        );
                      }
                      if (section.type === "code") {
                        return (
                          <div key={index} className="mb-4">
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
                      }
                      if (section.type === "video" && section.src) {
                        return (
                          <div key={index} className="mb-4">
                            <video controls className="w-full rounded-lg">
                              <source src={section.src} />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        );
                      }
                      if (section.type === "link" && section.src) {
                        return (
                          <div key={index} className="mb-4">
                            <a
                              href={section.src}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {section.src}
                            </a>
                          </div>
                        );
                      }
                      if (section.type === "html") {
                        return (
                          <div key={index} className="mb-4">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: section.content || "",
                              }}
                            />
                          </div>
                        );
                      }
                      return null;
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showUpdateModal && (
        <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Update</DialogTitle>
              <DialogDescription>
                Are you sure you want to update this post?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => setShowUpdateModal(false)}
                variant="outline"
                disabled={confirmLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateConfirm}
                variant="default"
                disabled={confirmLoading}
              >
                {confirmLoading ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Lightbox Gallery */}
      {showGallery && (
        <Lightbox
          open={showGallery}
          close={() => setShowGallery(false)}
          slides={galleryImages.map((src) => ({
            src,
            width: 1920,
            height: 1080,
          }))}
          index={currentImageIndex}
          plugins={[Zoom]}
          zoom={{
            maxZoomPixelRatio: 3,
            scrollToZoom: true,
            doubleClickMaxStops: 2,
            doubleClickDelay: 300,
          }}
          carousel={{ finite: true }}
          styles={{
            container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
            root: { "--yarl__color_backdrop": "rgba(0, 0, 0, 0.9)" },
          }}
        />
      )}
    </>
  );
};

export default AdminUpdatePostPage;
