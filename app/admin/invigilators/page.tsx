import { AdminLayout } from "@/components/admin-layout";
import { InvigilatorTableClient } from "@/components/invigilator-table-client"; // Import the new client component
// Import getNotifications and the renamed function/type
import { getInvigilatorAssignments, getNotifications, type InvigilatorAssignmentWithUser } from "@/lib/data";
import type { Notification } from '@/lib/data'; // Keep Notification import if needed by AdminLayout

// This is now a Server Component
export default async function AdminInvigilatorsPage() {
  // Fetch initial data and notifications in parallel
  // Use getInvigilatorAssignments and cast the result if necessary
  const [invigilatorAssignments, notifications] = await Promise.all([
    getInvigilatorAssignments(true), // Fetch assignments with user details
    getNotifications()
  ]);

  // Cast to the correct type for the client component if needed
  // Assuming InvigilatorTableClient expects InvigilatorAssignmentWithUser[]
  const invigilators = invigilatorAssignments as InvigilatorAssignmentWithUser[];

  return (
    // Pass notifications to the layout
    <AdminLayout notifications={notifications}>
      {/* Render the client component responsible for interaction */}
      <InvigilatorTableClient initialInvigilators={invigilators} />
    </AdminLayout>
  );
}
