// This is now a Server Component

import Link from "next/link"
import { List } from "lucide-react"

import { Button } from "@/components/ui/button"
import { UserLayout } from "@/components/user-layout"
import { ScheduleCalendarClient } from "@/components/schedule-calendar-client" // Import the new client component
import { getExams, getNotifications } from "@/lib/data" // Import data fetching functions

export default async function CalendarViewPage() {

  // Fetch initial exam data and notifications in parallel
  const [initialExams, notifications] = await Promise.all([
    getExams().catch(error => {
      console.error("Failed to fetch initial exams on server (calendar):", error);
      return []; // Return empty array on error
    }),
    getNotifications().catch(error => {
      console.error("Failed to fetch notifications on server (calendar):", error);
      return []; // Return empty array on error
    })
  ]);

  return (
    <UserLayout notifications={notifications}>
      <div className="flex flex-col h-full">
        {/* Header remains similar, handled within the Server Component */}
        <div className="flex flex-col xs:flex-row items-center justify-between py-4 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 px-4 md:px-6">
          <h1 className="text-xl xs:text-2xl font-semibold mb-2 xs:mb-0">Calendar View</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/schedule">
                <List className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">List View</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Render the client component with fetched data */}
        <ScheduleCalendarClient initialExams={initialExams} />

      </div>
    </UserLayout>
  )
}
