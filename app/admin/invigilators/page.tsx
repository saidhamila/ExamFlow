import { AdminLayout } from "@/components/admin-layout";
import { InvigilatorTableClient } from "@/components/invigilator-table-client"; // Import the new client component
// Import getNotifications and the correct function/type for users
import { getPotentialInvigilators, getNotifications } from "@/lib/data"; // Use getPotentialInvigilators
import type { User as PrismaUser } from '@prisma/client'; // Import User type
import type { Notification } from '@/lib/data'; // Keep Notification import if needed by AdminLayout

// This is now a Server Component
export default async function AdminInvigilatorsPage() {
  // Fetch initial data and notifications in parallel
  // Use getInvigilatorAssignments and cast the result if necessary
   const [users, notifications] = await Promise.all([
     getPotentialInvigilators(), // Fetch potential invigilator users
     getNotifications()
   ]);

   // No casting needed if getPotentialInvigilators returns PrismaUser[]
   const initialUsers = users;

  return (
    // Pass notifications to the layout
    <AdminLayout notifications={notifications}>
      {/* Render the client component responsible for interaction */}
       <InvigilatorTableClient initialUsers={initialUsers} /> {/* Pass users with new prop name */}
    </AdminLayout>
  );
}
