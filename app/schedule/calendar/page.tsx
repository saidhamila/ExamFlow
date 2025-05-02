// This is now a Server Component

import Link from "next/link"
import { List } from "lucide-react"
import { cookies } from 'next/headers'; // Import cookies

import { Button } from "@/components/ui/button"
import { UserLayout } from "@/components/user-layout"
import { ScheduleCalendarClient } from "@/components/schedule-calendar-client" // Import the new client component
import { getExams, getNotifications, type ExamWithDetails } from "@/lib/data" // Import data fetching functions AND ExamWithDetails
// Remove unused import: import type { Exam } from "@prisma/client";

// Define the shape of the session data (can be moved to a shared types file)
type AuthSession = {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'CHEF' | 'DIRECTEUR';
};

export default async function CalendarViewPage() {

  // Get session data
  const cookieStore = await cookies(); // Await cookies()
  const sessionCookie = cookieStore.get('auth-session');
  let userRole: AuthSession['role'] | undefined = undefined;

  if (sessionCookie) {
    try {
      const sessionData: AuthSession = JSON.parse(sessionCookie.value);
      // Validate that role is one of the expected values
      if (['ADMIN', 'USER', 'CHEF', 'DIRECTEUR'].includes(sessionData?.role)) {
        userRole = sessionData.role;
      } else {
         console.warn("Invalid role found in session cookie (calendar):", sessionData?.role);
      }
    } catch (error) {
      console.error("Failed to parse session cookie (calendar):", error);
      // Keep userRole as undefined if cookie is invalid
    }
  }

  // Fetch initial exam data and notifications in parallel
  const [initialExams, notifications] = await Promise.all([
    getExams().catch(error => {
      console.error("Failed to fetch initial exams on server (calendar):", error);
      // Return typed empty array matching the success type
      return [] as ExamWithDetails[];
    }),
    getNotifications().catch(error => {
      console.error("Failed to fetch notifications on server (calendar):", error);
      // Assuming Notification type is correctly exported or defined elsewhere
      return []; // Return empty array on error (adjust type if needed)
    })
  ]);

  return (
    // Pass notifications AND userRole to the layout
    <UserLayout notifications={notifications} userRole={userRole}>
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
        {/* Ensure initialExams type matches what ScheduleCalendarClient expects */}
        <ScheduleCalendarClient initialExams={initialExams} />

      </div>
    </UserLayout>
  )
}
