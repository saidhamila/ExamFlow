"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import { Search, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { AddInvigilatorDialog } from "@/components/add-invigilator-dialog" // Should be AddUserDialog conceptually
import { EditUserDialog } from "@/components/edit-invigilator-dialog" // Import the renamed component
import { DeleteInvigilatorDialog } from "@/components/delete-invigilator-dialog"
import { useToast } from "@/hooks/use-toast"
// Import the correct types and action
import type { InvigilatorAssignmentWithUser } from "@/lib/data"
import { deleteUserAction } from "@/lib/actions" // Import renamed action
import type { User as PrismaUser } from "@prisma/client"; // Import User type if needed

// Define props with the correct type
interface InvigilatorTableClientProps {
  initialInvigilators: InvigilatorAssignmentWithUser[]; // Use the assignment type
}

export function InvigilatorTableClient({ initialInvigilators }: InvigilatorTableClientProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition(); // For delete action

  // State with correct types
  const [invigilators, setInvigilators] = useState<InvigilatorAssignmentWithUser[]>(initialInvigilators)
  const [filteredInvigilators, setFilteredInvigilators] = useState<InvigilatorAssignmentWithUser[]>(initialInvigilators)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInvigilatorIds, setSelectedInvigilatorIds] = useState<string[]>([]) // Store assignment IDs

   // Update list when initial data changes (after add/update)
  useEffect(() => {
    setInvigilators(initialInvigilators);
    // Re-apply search filter when initial data changes
    if (searchTerm.trim() === "") {
      setFilteredInvigilators(initialInvigilators);
    } else {
      const term = searchTerm.toLowerCase();
      // Filter based on user details within the assignment
      const filtered = initialInvigilators.filter(
        (assignment) =>
          assignment.user?.name?.toLowerCase().includes(term) ||
          assignment.user?.email?.toLowerCase().includes(term) ||
          assignment.user?.departmentId?.toLowerCase().includes(term) // Search departmentId if needed
      );
      setFilteredInvigilators(filtered);
    }
    // Reset selection when data changes
    setSelectedInvigilatorIds([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInvigilators]);

  // Client-side search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    const lowerCaseTerm = term.toLowerCase();

    if (term.trim() === "") {
      setFilteredInvigilators(invigilators); // Reset to full list
    } else {
      // Filter based on user details within the assignment
      const filtered = invigilators.filter(
        (assignment) =>
          assignment.user?.name?.toLowerCase().includes(lowerCaseTerm) ||
          assignment.user?.email?.toLowerCase().includes(lowerCaseTerm) ||
          assignment.user?.departmentId?.toLowerCase().includes(lowerCaseTerm)
      );
      setFilteredInvigilators(filtered);
    }
     // Reset selection on search
    setSelectedInvigilatorIds([]);
  };

  // --- CRUD Handlers ---
  // Add/Update handled by dialogs calling server actions (addUserAction, updateUserAction)
  // Delete handler for User:
  const handleDeleteUser = (userId: string) => { // Takes userId
    startTransition(async () => {
      // Call renamed action with userId
      const result = await deleteUserAction(userId);
      if (result?.message) {
        toast({
          title: result.message.includes("success") ? "Success" : "Error",
          description: result.message,
          variant: result.message.includes("success") ? "default" : "destructive",
        });
        // Revalidation should update the list via initialInvigilators prop change
        // Ensure assignments related to the deleted user are removed from selection
        // This requires filtering selectedInvigilatorIds based on the deleted userId
        const assignmentsOfDeletedUser = invigilators
            .filter(a => a.userId === userId)
            .map(a => a.invigilatorId);
        setSelectedInvigilatorIds(prev => prev.filter(id => !assignmentsOfDeletedUser.includes(id)));
      }
    });
  };

  // --- Selection Handlers (using assignment ID) ---
  const toggleSelectInvigilator = (assignmentId: string) => {
    setSelectedInvigilatorIds((prev) =>
      prev.includes(assignmentId) ? prev.filter((selectedId) => selectedId !== assignmentId) : [...prev, assignmentId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedInvigilatorIds.length === filteredInvigilators.length) {
      setSelectedInvigilatorIds([]);
    } else {
      // Select all assignment IDs
      setSelectedInvigilatorIds(filteredInvigilators.map((assignment) => assignment.invigilatorId));
    }
  };

  // --- Export Handler ---
  const exportToCSV = () => {
    // Update headers and data based on InvigilatorAssignmentWithUser
    const headers = ["AssignmentID", "UserID", "UserName", "UserEmail", "UserDepartmentID", "UserRole", "UserIsActive", "ExamID", "RoomID", "AssignmentCreatedAt"];
    const csvContent = [
      headers.join(","),
      ...filteredInvigilators.map((assignment) =>
        [
          assignment.invigilatorId,
          assignment.userId,
          `"${assignment.user?.name ?? ''}"`,
          assignment.user?.email ?? '',
          assignment.user?.departmentId ?? '',
          assignment.user?.role ?? '',
          assignment.user?.isActive ?? '',
          assignment.examId,
          assignment.roomId,
          assignment.createdAt.toISOString(), // Format date
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "invigilators_export.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "Filtered invigilator assignments have been exported to CSV",
    });
  };

  // --- Status Badge Logic (Removed - Status field doesn't exist) ---
  // Can add logic for user.isActive or user.role if needed

  return (
     <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col xs:flex-row items-center justify-between py-4 border-b sticky top-0 bg-white z-10 px-4 md:px-6">
          {/* Update title */}
          <h1 className="text-xl xs:text-2xl font-semibold mb-2 xs:mb-0">User / Invigilator Assignment Management</h1>
          <div className="flex items-center gap-2 w-full xs:w-auto justify-end flex-wrap">
            {/* Use AddUserDialog (conceptually) */}
            <AddInvigilatorDialog />
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <div className="relative w-full xs:w-auto mt-2 xs:mt-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users/assignments..." // Update placeholder
                className="w-full pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Table Card */}
        <Card className="m-4 md:m-6">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          filteredInvigilators.length > 0 &&
                          selectedInvigilatorIds.length === filteredInvigilators.length // Use selectedInvigilatorIds
                        }
                        onCheckedChange={toggleSelectAll}
                        disabled={filteredInvigilators.length === 0}
                      />
                    </TableHead>
                    {/* Update table headers */}
                    <TableHead>User Name</TableHead>
                    <TableHead className="hidden sm:table-cell">User Department</TableHead>
                    <TableHead className="hidden xs:table-cell">User Role / Status</TableHead>
                    <TableHead className="hidden md:table-cell">Assignment Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvigilators.length > 0 ? (
                    filteredInvigilators.map((assignment) => (
                      // Use assignment ID as key
                      <TableRow key={assignment.invigilatorId} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <Checkbox
                            // Check selection using assignment ID
                            checked={selectedInvigilatorIds.includes(assignment.invigilatorId)}
                            onCheckedChange={() => toggleSelectInvigilator(assignment.invigilatorId)}
                          />
                        </TableCell>
                        <TableCell>
                          {/* Display user details */}
                          <div className="font-medium">{assignment.user?.name ?? 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{assignment.user?.email ?? 'N/A'}</div>
                          {/* Remove phone */}
                           {/* Show role/active status on small screens */}
                          <div className="text-sm text-muted-foreground xs:hidden">
                             <Badge variant={assignment.user?.isActive ? "success" : "secondary"} className="mt-1">
                               {assignment.user?.isActive ? 'Active' : 'Inactive'}
                             </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground sm:hidden mt-1">{assignment.user?.departmentId ?? 'N/A'}</div>
                        </TableCell>
                        {/* Display user department ID */}
                        <TableCell className="hidden sm:table-cell">{assignment.user?.departmentId ?? 'N/A'}</TableCell>
                        <TableCell className="hidden xs:table-cell">
                           {/* Display user role or active status */}
                           <Badge variant={assignment.user?.isActive ? "success" : "secondary"}>
                               {assignment.user?.isActive ? 'Active' : 'Inactive'}
                           </Badge>
                           <div className="text-xs text-muted-foreground mt-1">{assignment.user?.role}</div>
                        </TableCell>
                         {/* Display assignment details */}
                         <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                           <div>Exam: {assignment.examId}</div>
                           <div>Room: {assignment.roomId}</div>
                           <div>Assign ID: {assignment.invigilatorId}</div>
                         </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Use EditUserDialog, pass the user object */}
                            {assignment.user && <EditUserDialog user={assignment.user} />}
                            {/* Use DeleteInvigilatorDialog, pass userId and userName */}
                            {assignment.user && <DeleteInvigilatorDialog
                                invigilatorId={assignment.user.userId} // Pass userId
                                invigilatorName={assignment.user.name ?? assignment.user.email} // Pass userName/email
                                onDelete={() => handleDeleteUser(assignment.user!.userId)} // Call handleDeleteUser with userId
                                isDeleting={isPending}
                             />}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No assignments found matching your search." : "No assignments found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination (Placeholder) */}
            <div className="flex flex-col xs:flex-row items-center justify-between p-4 border-t gap-4 xs:gap-2">
               <div className="flex items-center gap-2">
                 <Select defaultValue="10">
                   <SelectTrigger className="w-[70px]">
                     <SelectValue placeholder="10" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="10">10</SelectItem>
                     <SelectItem value="20">20</SelectItem>
                     <SelectItem value="50">50</SelectItem>
                     <SelectItem value="100">100</SelectItem>
                   </SelectContent>
                 </Select>
                 <span className="text-sm text-muted-foreground">items per page</span>
               </div>
               <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" disabled>
                   <ChevronLeft className="h-4 w-4" />
                 </Button>
                 <span className="text-sm">Page 1 of 1</span> {/* Needs dynamic update */}
                 <Button variant="outline" size="icon" disabled>
                   <ChevronRight className="h-4 w-4" />
                 </Button>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Footer (Placeholder - actions need update based on assignment IDs) */}
        {selectedInvigilatorIds.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center shadow-md lg:left-64 z-20">
            <div className="text-sm">{selectedInvigilatorIds.length} assignments selected</div>
            <div className="flex gap-2">
              {/* Update bulk actions if needed */}
              <Button variant="outline" size="sm" disabled>
                Bulk Action 1
              </Button>
              <Button variant="destructive" size="sm" disabled>
                Bulk Action 2
              </Button>
            </div>
          </div>
        )}
      </div>
  )
}