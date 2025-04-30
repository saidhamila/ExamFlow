"use client"

import { useState, useEffect } from "react" // Import useEffect
import Link from "next/link"
// Import necessary icons, add Clock for upcoming, CheckCircle for finished
import { Bell, Check, Clock, CheckCircle, Loader2 } from "lucide-react"
import { getNotifications, type Notification } from "@/lib/data" // Import data fetching function and type

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Notification } from "@/lib/data" // Import only the type

// Define props interface
interface NotificationsPopoverProps {
  initialNotifications: Notification[];
}

export function NotificationsPopover({ initialNotifications }: NotificationsPopoverProps) {
  const [open, setOpen] = useState(false)
  // Initialize state with props, manage read status locally
  const [userNotifications, setUserNotifications] = useState<Notification[]>(
    initialNotifications.map(n => ({ ...n, read: false })) // Start all as unread client-side
  );
  const [isLoading, setIsLoading] = useState(false) // Remove loading state related to fetching

  // Remove useEffect for fetching data

  // --- Read status management (remains client-side) ---
  // Note: Read status is currently client-side only and resets on refresh.
  // For persistence, you'd need to store read status (e.g., in localStorage or backend)
  const unreadCount = userNotifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setUserNotifications(userNotifications.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setUserNotifications(userNotifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4 mr-2" />
          Notifications
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-primary text-primary-foreground">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {/* Remove isLoading check here */}
          {userNotifications.length > 0 ? (
            <div className="divide-y">
              {userNotifications.map((notification) => {
                // Determine icon and color based on notification type
                const Icon = notification.type === 'upcoming_exam' ? Clock : CheckCircle;
                const iconBgColor = notification.type === 'upcoming_exam' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600';

                return (
                  <div
                    key={notification.id}
                    className={`p-4 cursor-pointer hover:bg-muted/30 ${notification.read ? "" : "bg-muted/50"}`}
                    onClick={() => markAsRead(notification.id)}
                    role="button" // Improve accessibility
                    tabIndex={0} // Make it focusable
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') markAsRead(notification.id); }} // Allow keyboard activation
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 rounded-full p-1.5 ${iconBgColor}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-1 flex-1"> {/* Use flex-1 to allow text wrapping */}
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">{notification.title}</p>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-primary block" title="Unread"></span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground break-words">{notification.message}</p> {/* Allow message wrapping */}
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center h-full">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground">You're all caught up!</p>
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
