"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Calendar, Users, LogOut, Menu, Home, User, Bell, BarChart } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { NotificationsPopover } from "@/components/notifications-popover"
import { useToast } from "@/hooks/use-toast"
import { logoutAction } from "@/lib/actions" // Import the logout action
import type { Notification } from "@/lib/data" // Import Notification type

// Define props for the layout, including notifications
interface AdminLayoutProps {
  children: React.ReactNode;
  notifications: Notification[]; // Add notifications prop
}

export function AdminLayout({ children, notifications }: AdminLayoutProps) { // Destructure notifications from props
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  // Check window width on resize to handle sidebar collapse
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true)
      } else {
        setIsSidebarCollapsed(false)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleLogout = async () => { // Make the function async
    try {
      await logoutAction(); // Call the server action
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      router.push("/"); // Redirect to login page (assuming '/' is the login page)
      router.refresh(); // Optional: Force refresh to ensure state is cleared
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile Header */}
      <header className="flex h-14 items-center border-b bg-white px-4 lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex flex-col gap-6 py-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">Admin Panel</h2>
                <nav className="flex flex-col gap-1">
                  <Button variant={pathname === "/admin" ? "secondary" : "ghost"} className="justify-start" asChild>
                    <Link href="/admin">
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button
                    variant={pathname.includes("/admin/exams") ? "secondary" : "ghost"}
                    className="justify-start"
                    asChild
                  >
                    <Link href="/admin/exams">
                      <Calendar className="mr-2 h-4 w-4" />
                      Exams
                    </Link>
                  </Button>
                  <Button
                    variant={pathname.includes("/admin/invigilators") ? "secondary" : "ghost"}
                    className="justify-start"
                    asChild
                  >
                    <Link href="/admin/invigilators">
                      <Users className="mr-2 h-4 w-4" />
                      Invigilators
                    </Link>
                  </Button>
                  <Button
                    variant={pathname.includes("/admin/reports") ? "secondary" : "ghost"}
                    className="justify-start"
                    asChild
                  >
                    <Link href="/admin/reports">
                      <BarChart className="mr-2 h-4 w-4" />
                      Reports
                    </Link>
                  </Button>
                  <Button variant={pathname === "/profile" ? "secondary" : "ghost"} className="justify-start" asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </Button>
                  <Button
                    variant={pathname === "/notifications" ? "secondary" : "ghost"}
                    className="justify-start"
                    asChild
                  >
                    <Link href="/notifications">
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </Link>
                  </Button>
                </nav>
              </div>
              <div className="mt-auto">
                <Button variant="ghost" className="justify-start w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="ml-4 text-lg font-semibold">Admin Panel</h1>
        <div className="ml-auto">
          {/* Pass notifications data down */}
          <NotificationsPopover initialNotifications={notifications} />
        </div>
      </header>

      <div className="flex flex-1 flex-row">
        {/* Sidebar (desktop) - Fixed position */}
        <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 bottom-0 w-64 border-r bg-white z-10 overflow-y-auto">
          <div className="flex h-14 items-center border-b px-4">
            <h2 className="text-lg font-semibold">Admin Panel</h2>
          </div>
          <div className="flex flex-1 flex-col gap-6 p-4">
            <nav className="flex flex-col gap-1">
              <Button variant={pathname === "/admin" ? "secondary" : "ghost"} className="justify-start" asChild>
                <Link href="/admin">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant={
                  pathname.includes("/admin/exams") && !pathname.includes("/admin/exams/[id]")
                    ? "secondary"
                    : pathname.includes("/admin/exams/")
                      ? "default"
                      : "ghost"
                }
                className={cn(
                  "justify-start",
                  pathname.includes("/admin/exams/") && !pathname.includes("/admin/exams/[id]") && "bg-muted",
                )}
                asChild
              >
                <Link href="/admin/exams">
                  <Calendar className="mr-2 h-4 w-4" />
                  Exams
                </Link>
              </Button>
              <Button
                variant={
                  pathname.includes("/admin/invigilators") && !pathname.includes("/admin/invigilators/[id]")
                    ? "secondary"
                    : pathname.includes("/admin/invigilators/")
                      ? "default"
                      : "ghost"
                }
                className={cn(
                  "justify-start",
                  pathname.includes("/admin/invigilators/") &&
                    !pathname.includes("/admin/invigilators/[id]") &&
                    "bg-muted",
                )}
                asChild
              >
                <Link href="/admin/invigilators">
                  <Users className="mr-2 h-4 w-4" />
                  Invigilators
                </Link>
              </Button>
              <Button
                variant={pathname.includes("/admin/reports") ? "secondary" : "ghost"}
                className="justify-start"
                asChild
              >
                <Link href="/admin/reports">
                  <BarChart className="mr-2 h-4 w-4" />
                  Reports
                </Link>
              </Button>
              <Button variant={pathname === "/profile" ? "secondary" : "ghost"} className="justify-start" asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </Button>
            </nav>
            <div className="mt-auto">
              {/* Pass notifications data down */}
              <NotificationsPopover initialNotifications={notifications} />
              <Button variant="ghost" className="justify-start w-full mt-2" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content - With padding to account for fixed sidebar */}
        <main className="flex-1 lg:ml-64">{children}</main>
      </div>
    </div>
  )
}
