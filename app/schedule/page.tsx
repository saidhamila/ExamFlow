// This is now a Server Component - no "use client" directive

// Import getNotifications
import { getExams, getNotifications, type Exam } from "@/lib/data" // Import the server-side data fetching function AND the Exam type
import { UserLayout } from "@/components/user-layout" // Layout component
import { ScheduleClient } from "@/components/schedule-client" // Import the new client component

// The page component is now async to allow awaiting data fetching
export default async function SchedulePage() {
  // Remove the initial declaration: let initialExams: Exam[] = [];

  // Fetch initial exam data and notifications in parallel
  // Declare initialExams here directly
  const [initialExams, notifications] = await Promise.all([
    getExams().catch(error => { // Add catch to individual promises in Promise.all
      console.error("Failed to fetch initial exams on server:", error);
      return []; // Return empty array on error
    }),
    getNotifications().catch(error => {
      console.error("Failed to fetch notifications on server:", error);
      return []; // Return empty array on error
    })
  ]);


  // Render the layout and pass the fetched data to the client component
  return (
    // Pass notifications to the layout
    <UserLayout notifications={notifications}>
      <ScheduleClient initialExams={initialExams} />
    </UserLayout>
  );
}
