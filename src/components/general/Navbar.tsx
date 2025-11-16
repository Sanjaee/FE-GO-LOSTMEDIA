import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { User, LogOut, Settings, Moon, Sun, Search } from "lucide-react";
import { SearchDialog } from "./SearchDialog";

interface NavbarProps {
  enableSearch?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ enableSearch = true }) => {
  const { data: session, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch - only render theme toggle after mount
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(timer);
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

  const handleSearchInputClick = () => {
    if (enableSearch) {
      setSearchOpen(true);
    }
  };

  const handleSearchOpenChange = (open: boolean) => {
    setSearchOpen(open);
    if (!open) {
      setSearchQuery("");
    }
  };

      return (
        <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/LM.png"
                alt="Lost Media"
                width={40}
                height={40}
                className="h-8 w-8 md:h-10 md:w-10 object-contain"
                priority
              />
            </Link>
          </div>

          {/* Search Input - Desktop & Mobile */}
          {enableSearch && (
            <div className="flex items-center flex-1 max-w-md mx-2 md:mx-4 min-w-0">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Input
                  type="text"
                  placeholder="Cari post..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={handleSearchInputClick}
                  onFocus={handleSearchInputClick}
                  className="w-full pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 cursor-pointer text-sm md:text-base"
                  readOnly
                />
              </div>
            </div>
          )}

          {/* Right side - Auth buttons or user menu */}
          <div className="flex items-center space-x-4">
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
                      <Link href="/profile" className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {/* Dark Mode Toggle */}
                    <DropdownMenuItem
                      className="flex items-center justify-between cursor-default focus:bg-transparent"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <div className="flex items-center">
                        {mounted && resolvedTheme === "dark" ? (
                          <Moon className="mr-2 h-4 w-4" />
                        ) : (
                          <Sun className="mr-2 h-4 w-4" />
                        )}
                        <span>Dark Mode</span>
                      </div>
                      <Switch
                        checked={mounted ? resolvedTheme === "dark" : false}
                        onCheckedChange={(checked) => {
                          setTheme(checked ? "dark" : "light");
                        }}
                        className="ml-auto cursor-pointer"
                      />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign In</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Theme Toggle for non-authenticated users */}
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
                <Button asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Dialog Component */}
      {enableSearch && (
        <SearchDialog
          open={searchOpen}
          onOpenChange={handleSearchOpenChange}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      )}
    </nav>
  );
};
