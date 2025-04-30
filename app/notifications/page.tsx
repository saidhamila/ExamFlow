// This is now a Server Component

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { UserLayout } from "@/components/user-layout"
import { NotificationsClient } from "@/components/notifications-client" // Import the new client component
import { getNotifications } from "@/lib/data" // Import data fetching function

// Make the page component async
export default async function NotificationsPage() {

  // Fetch notifications on the server
  const notifications = await getNotifications().catch(error => {
      console.error("Failed to fetch notifications on server (notifications page):", error);
      return []; // Return empty array on error
  });

  // The unread count and mark all read logic is now handled client-side in NotificationsClient

  return (
    // Pass notifications to the layout
    <UserLayout notifications={notifications}>
      <div className="flex flex-col h-full">
        {/* Header remains similar */}
        <div className="flex items-center justify-between py-4 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              {/* Link back to a relevant page, e.g., schedule */}
              <Link href="/schedule">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold">Notifications</h1>
          </div>
          {/* "Mark all read" button is now inside NotificationsClient */}
        </div>

        {/* Render the client component with fetched data */}
        <NotificationsClient initialNotifications={notifications} />

      </div>
    </UserLayout>
  )
}
