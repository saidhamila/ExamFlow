// This is now a Server Component - no "use client" directive

// Import data fetching functions and actions
import { getExams, getNotifications } from "@/lib/data";
import { getPrioritizedNotifications } from "@/lib/actions"; // Import the new action
import { cookies } from 'next/headers'; // Import cookies
import { UserLayout } from "@/components/user-layout"; // Layout component
import { ScheduleClient } from "@/components/schedule-client"; // Import the new client component
import type { Exam } from "@prisma/client"; // Import Exam type directly from Prisma

// Define the shape of the session data (can be moved to a shared types file)
type AuthSession = {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'CHEF' | 'DIRECTEUR';
};

// The page component is now async to allow awaiting data fetching
export default async function SchedulePage() {
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
         console.warn("Invalid role found in session cookie:", sessionData?.role);
      }
    } catch (error) {
      console.error("Failed to parse session cookie:", error);
      // Keep userRole as undefined if cookie is invalid
    }
  }

  // Fetch initial exam data and notifications in parallel
  // Explicitly type the results from Promise.all
  const [initialExams, notifications] = await Promise.all([
    getExams().catch(error => {
      console.error("Failed to fetch initial exams on server:", error);
      return [] as Exam[]; // Return typed empty array on error
    }),
    // Replace getNotifications with getPrioritizedNotifications
    getPrioritizedNotifications().catch(error => {
      console.error("Failed to fetch prioritized notifications on server:", error);
      // Assuming Notification type is correctly exported or defined elsewhere
      return []; // Return empty array on error (adjust type if needed)
    })
  ]);


  // Render the layout and pass the fetched data to the client component
  return (
    // Pass notifications AND userRole to the layout
    <UserLayout notifications={notifications} userRole={userRole}>
      {/* Ensure initialExams is passed correctly */}
      <ScheduleClient initialExams={initialExams} />
    </UserLayout>
  );
}
