import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Loader2 } from "lucide-react";
import { useApi } from "@/components/contex/ApiProvider";
import { Post } from "@/lib/api-client";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({
  open,
  onOpenChange,
  searchQuery,
  onSearchQueryChange,
}) => {
  const router = useRouter();
  const { apiClient } = useApi();
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await apiClient.searchPosts({
        q: query,
        page: 1,
        limit: 10,
      });
      setSearchResults(response.posts);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [apiClient]);

  // Debounce search input
  useEffect(() => {
    if (!open) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, open, performSearch]);

  const handlePostClick = () => {
    onOpenChange(false);
    onSearchQueryChange("");
    router.push(`/`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-2xl md:max-h-[80vh] w-full h-full md:w-full md:h-auto md:rounded-lg fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[50%] md:top-[50%] md:translate-x-[-50%] md:translate-y-[-50%] overflow-hidden flex flex-col dark:bg-gray-800 dark:border-gray-700 p-4 md:p-6">
        <DialogHeader className="md:pb-4 pb-4">
          <DialogTitle className="dark:text-gray-100 text-xl md:text-lg">Cari Post</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 flex-1 overflow-hidden min-h-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Ketik untuk mencari..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-12 md:pl-10 h-12 md:h-10 text-base md:text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {searchLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-600 dark:text-gray-400" />
              </div>
            ) : searchQuery.trim() === "" ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ketik untuk mencari post...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Tidak ada hasil ditemukan untuk &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((post) => (
                  <div
                    key={post.postId}
                    onClick={handlePostClick}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {post.title}
                        </h3>
                        {post.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {post.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {post.user && (
                            <span className="font-medium">
                              {post.user.full_name || post.user.username || "User"}
                            </span>
                          )}
                          <span>•</span>
                          <span>{formatDate(post.createdAt)}</span>
                          {post.category && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                                {post.category}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

