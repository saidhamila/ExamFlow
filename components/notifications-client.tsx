"use client"

import { useState } from "react"
import { CalendarPlus, Edit, Info, Check, Clock, CheckCircle } from "lucide-react" // Import necessary icons
import { format } from 'date-fns'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Notification } from "@/lib/data" // Import Notification type

// Props for the client component
interface NotificationsClientProps {
  initialNotifications: Notification[];
}

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  // Manage notification state, including read status, client-side
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications.map(n => ({ ...n, read: false })) // Start all as unread
  );

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  // Group notifications by date (using the original dateTime)
  const groupedNotifications = notifications.reduce(
    (acc, notification) => {
      const dateStr = format(notification.dateTime, 'yyyy-MM-dd'); // Group by actual date
      if (!acc[dateStr]) {
        acc[dateStr] = []
      }
      acc[dateStr].push(notification)
      return acc
    },
    {} as Record<string, Notification[]>,
  )

  // Sort dates chronologically (most recent first)
  const sortedDates = Object.keys(groupedNotifications).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Notifications</CardTitle>
           {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {sortedDates.length > 0 ? (
            sortedDates.map((date) => (
              <div key={date}>
                <div className="px-6 py-2 bg-muted/50 font-medium text-sm">{format(new Date(date), 'PPPP')}</div>
                <div className="divide-y">
                  {groupedNotifications[date].map((notification) => {
                    // Determine icon and color based on notification type
                    const Icon = notification.type === 'upcoming_exam' ? Clock : CheckCircle;
                    const iconBgColor = notification.type === 'upcoming_exam' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600';

                    return (
                      <div key={notification.id} className={`p-6 ${notification.read ? "" : "bg-muted/30"}`}>
                        <div className="flex gap-4">
                          <div className={`mt-0.5 rounded-full p-2 ${iconBgColor}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-muted-foreground break-words">{notification.message}</p>
                            <p className="text-xs text-muted-foreground">{notification.time}</p>
                          </div>
                           {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-primary block flex-shrink-0 mt-1" title="Unread"></span>
                            )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
             <div className="p-6 text-center text-muted-foreground">
                No notifications found.
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}