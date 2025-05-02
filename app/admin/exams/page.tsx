import { AdminLayout } from "@/components/admin-layout";
import { ExamTableClient } from "@/components/exam-table-client";
import { getExams, getNotifications, PaginatedExamsResult } from "@/lib/data"; // Import PaginatedExamsResult
// Import actions to fetch options for dialogs
import {
  getDepartmentOptionsAction,
  getRoomOptionsAction,
  getInvigilatorOptionsAction
} from "@/lib/actions";

// This is now a Server Component
export default async function AdminExamsPage() {
  // Fetch initial data and notifications in parallel
  // Fetch initial data, notifications, and options in parallel
  const [
      initialPaginatedExams, // Rename to reflect paginated data
      notifications,
      departmentOptions, // Add back
      roomOptions, // Add back
      invigilatorOptions
  ] = await Promise.all([
    getExams(), // Fetch first page by default
    getNotifications(),
    getDepartmentOptionsAction(), // Add back
    getRoomOptionsAction(), // Add back
    getInvigilatorOptionsAction()
  ]);

  return (
    // Pass notifications to the layout
    <AdminLayout notifications={notifications}>
      {/* Render the client component responsible for interaction, passing options */}
      <ExamTableClient
        initialPaginatedExams={initialPaginatedExams} // Pass paginated data
        departmentOptions={departmentOptions} // Add back prop
        roomOptions={roomOptions} // Add back prop
        invigilatorOptions={invigilatorOptions}
      />
    </AdminLayout>
  );
}
