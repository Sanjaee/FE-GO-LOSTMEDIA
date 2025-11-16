import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Settings, ShoppingBag, Moon, Sun, Search, Loader2 } from "lucide-react";
import { useApi } from "@/components/contex/ApiProvider";
import { Post } from "@/lib/api-client";

export const Navbar = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { apiClient } = useApi();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch - only render theme toggle after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
    if (!searchOpen) {
      setSearchQuery("");
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
  }, [searchQuery, searchOpen, performSearch]);

  const handleSearchInputClick = () => {
    setSearchOpen(true);
  };

  const handlePostClick = () => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/`);
    // Scroll to post or navigate to detail page when available
    // For now, just go to home page
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
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-50">
                Lost Media
              </span>
            </Link>
          </div>

          {/* Search Input */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari post..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={handleSearchInputClick}
                onFocus={handleSearchInputClick}
                className="w-full pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100  cursor-pointer"
              />
            </div>
          </div>

          {/* Right side - Auth buttons or user menu */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="relative"
              aria-label="Toggle theme"
            >
              {mounted ? (
                resolvedTheme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )
              ) : (
                <div className="h-5 w-5" />
              )}
            </Button>

            {status === "loading" ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : session ? (
              <div className="flex items-center space-x-4">
              

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={session.user?.image || ""}
                          alt={session.user?.name || "User"}
                        />
                        <AvatarFallback>
                          {getInitials(session.user?.name || "User")}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.user?.name || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user?.email || ""}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Cari Post</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Ketik untuk mencari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
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
    </nav>
  );
};
