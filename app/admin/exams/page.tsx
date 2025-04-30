import { AdminLayout } from "@/components/admin-layout";
import { ExamTableClient } from "@/components/exam-table-client"; // Import the new client component
// Import getNotifications
import { getExams, getNotifications } from "@/lib/data"; // Import the data fetching function

// This is now a Server Component
export default async function AdminExamsPage() {
  // Fetch initial data and notifications in parallel
  const [exams, notifications] = await Promise.all([
    getExams(),
    getNotifications()
  ]);

  return (
    // Pass notifications to the layout
    <AdminLayout notifications={notifications}>
      {/* Render the client component responsible for interaction */}
      <ExamTableClient initialExams={exams} />
    </AdminLayout>
  );
}
