import { getDepartments, getPotentialInvigilators } from '@/lib/data'; // Fetch potential heads (e.g., teachers)
import type { DepartmentWithDetails } from '@/lib/data'; // Import the detailed type
import { DepartmentTableClient } from '@/components/admin/departments/department-table-client';
import { Button } from '@/components/ui/button'; // Import Button again
import { AddDepartmentDialog } from '@/components/admin/departments/add-department-dialog';
import { PlusCircle } from 'lucide-react';

export default async function DepartmentsPage() {
  // Fetch departments and potential heads (users who can be department heads)
  const [departments, potentialHeads]: [DepartmentWithDetails[], any[]] = await Promise.all([ // Type the fetched departments
    getDepartments(),
    getPotentialInvigilators() // Assuming teachers/specific roles can be heads
  ]);

  // Format potential heads for the select dropdown in dialogs
  const headOptions = potentialHeads.map(user => ({
    value: user.userId,
    label: user.name ?? user.email, // Use name or email as label
  }));

  return (
    <div className="space-y-6">
      {/* Remove the redundant header div from the page component */}
      {/* The DepartmentTableClient will render the correct header */}
      <DepartmentTableClient initialData={departments} headOptions={headOptions} />
    </div>
  );
}