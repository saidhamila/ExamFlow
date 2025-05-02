"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Calendar, LogOut, Menu, User, Bell, CalendarDays, ClipboardCheck, Briefcase } from "lucide-react" // Added Chef/Directeur icons
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NotificationsPopover } from "@/components/notifications-popover"
import { useToast } from "@/hooks/use-toast"
import { logoutAction } from "@/lib/actions";
import type { Notification } from "@/lib/data"; // Import Notification type

// Define props for the layout, including notifications
interface UserLayoutProps {
  children: React.ReactNode;
  notifications: Notification[]; // Add notifications prop
  userRole?: 'ADMIN' | 'USER' | 'CHEF' | 'DIRECTEUR'; // Add optional userRole prop
}

export function UserLayout({ children, notifications, userRole }: UserLayoutProps) { // Destructure props
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

  const handleLogout = async () => {
    try {
      await logoutAction(); // Call the server action to clear the cookie
      router.refresh(); // Force refresh to clear client router cache
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      router.push("/"); // Redirect to login page
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
                <h2 className="text-lg font-semibold">Exam Schedule</h2>
                <nav className="flex flex-col gap-1">
                  <Button variant={pathname === "/schedule" ? "secondary" : "ghost"} className="justify-start" asChild>
                    <Link href="/schedule">
                      <Calendar className="mr-2 h-4 w-4" />
                      List View
                    </Link>
                  </Button>
                  <Button
                    variant={pathname === "/schedule/calendar" ? "secondary" : "ghost"}
                    className="justify-start"
                    asChild
                  >
                    <Link href="/schedule/calendar">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Calendar View
                    </Link>
                  </Button>
                  {/* Conditional Chef Link - Mobile */}
                  {userRole === 'CHEF' && (
                    <Button variant={pathname === "/chef/dashboard" ? "secondary" : "ghost"} className="justify-start" asChild>
                      <Link href="/chef/dashboard">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Chef Dashboard
                      </Link>
                    </Button>
                  )}
                  {/* Conditional Directeur Link - Mobile */}
                  {userRole === 'DIRECTEUR' && (
                    <Button variant={pathname === "/directeur/dashboard" ? "secondary" : "ghost"} className="justify-start" asChild>
                      <Link href="/directeur/dashboard">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Directeur Dashboard
                      </Link>
                    </Button>
                  )}
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
        <h1 className="ml-4 text-lg font-semibold">Exam Schedule System</h1>
        <div className="ml-auto">
          {/* Pass notifications data down */}
          <NotificationsPopover initialNotifications={notifications} />
        </div>
      </header>

      <div className="flex flex-1 flex-row">
        {/* Sidebar (desktop) - Fixed position */}
        <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 bottom-0 w-64 border-r bg-white z-10 overflow-y-auto">
          <div className="flex h-14 items-center border-b px-4">
            <h2 className="text-lg font-semibold">Exam Schedule System</h2>
          </div>
          <div className="flex flex-1 flex-col gap-6 p-4">
            <nav className="flex flex-col gap-1">
              <Button variant={pathname === "/schedule" ? "secondary" : "ghost"} className="justify-start" asChild>
                <Link href="/schedule">
                  <Calendar className="mr-2 h-4 w-4" />
                  List View
                </Link>
              </Button>
              <Button
                variant={pathname === "/schedule/calendar" ? "secondary" : "ghost"}
                className="justify-start"
                asChild
              >
                <Link href="/schedule/calendar">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Calendar View
                </Link>
              </Button>
              {/* Conditional Chef Link - Desktop */}
              {userRole === 'CHEF' && (
                <Button variant={pathname === "/chef/dashboard" ? "secondary" : "ghost"} className="justify-start" asChild>
                  <Link href="/chef/dashboard">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Chef Dashboard
                  </Link>
                </Button>
              )}
              {/* Conditional Directeur Link - Desktop */}
              {userRole === 'DIRECTEUR' && (
                <Button variant={pathname === "/directeur/dashboard" ? "secondary" : "ghost"} className="justify-start" asChild>
                  <Link href="/directeur/dashboard">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Directeur Dashboard
                  </Link>
                </Button>
              )}
              <Button variant={pathname === "/profile" ? "secondary" : "ghost"} className="justify-start" asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </Button>
              <Button variant={pathname === "/notifications" ? "secondary" : "ghost"} className="justify-start" asChild>
                <Link href="/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
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
