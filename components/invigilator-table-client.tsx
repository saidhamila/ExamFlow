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
import { deleteUserAction } from "@/lib/actions" // Import renamed action
import type { User as PrismaUser, UserRole } from "@prisma/client"; // Import User type and Role enum

// Define props with the correct type
interface InvigilatorTableClientProps {
  initialUsers: PrismaUser[]; // Expect an array of Users
}

 export function InvigilatorTableClient({ initialUsers }: InvigilatorTableClientProps) {
   const { toast } = useToast()
   const [isPending, startTransition] = useTransition(); // For delete action

   // State with correct types (Users)
   const [users, setUsers] = useState<PrismaUser[]>(initialUsers)
   const [filteredUsers, setFilteredUsers] = useState<PrismaUser[]>(initialUsers)
   const [searchTerm, setSearchTerm] = useState("")
   const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]) // Store user IDs

   // Update list when initial data changes (after add/update)
   useEffect(() => {
     setUsers(initialUsers);
     // Re-apply search filter when initial data changes
     if (searchTerm.trim() === "") {
       setFilteredUsers(initialUsers);
     } else {
       const term = searchTerm.toLowerCase();
       // Filter based on user properties directly
       const filtered = initialUsers.filter(
         (user) =>
           user.name?.toLowerCase().includes(term) ||
           user.email?.toLowerCase().includes(term) ||
           user.departmentId?.toLowerCase().includes(term)
       );
       setFilteredUsers(filtered);
     }
     // Reset selection when data changes
     setSelectedUserIds([]);
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [initialUsers]);

  // Client-side search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    const lowerCaseTerm = term.toLowerCase();

    if (term.trim() === "") {
       setFilteredUsers(users); // Reset to full list
     } else {
       // Filter based on user properties directly
       const filtered = users.filter(
         (user) =>
           user.name?.toLowerCase().includes(lowerCaseTerm) ||
           user.email?.toLowerCase().includes(lowerCaseTerm) ||
           user.departmentId?.toLowerCase().includes(lowerCaseTerm)
       );
       setFilteredUsers(filtered);
     }
      // Reset selection on search
     setSelectedUserIds([]);
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
         // Remove the deleted user ID from selection
         setSelectedUserIds(prev => prev.filter(id => id !== userId));
      }
    });
  };

   // --- Selection Handlers (using user ID) ---
   const toggleSelectUser = (userId: string) => {
     setSelectedUserIds((prev) =>
       prev.includes(userId) ? prev.filter((selectedId) => selectedId !== userId) : [...prev, userId],
    );
  };

   const toggleSelectAll = () => {
     if (selectedUserIds.length === filteredUsers.length) {
       setSelectedUserIds([]);
     } else {
       // Select all user IDs
       setSelectedUserIds(filteredUsers.map((user) => user.userId));
    }
  };

  // --- Export Handler ---
  const exportToCSV = () => {
     // Update headers and data based on User
     const headers = ["UserID", "UserName", "UserEmail", "UserDepartmentID", "UserRole", "UserIsActive", "CreatedAt", "UpdatedAt"];
     const csvContent = [
       headers.join(","),
       ...filteredUsers.map((user) =>
         [
           user.userId,
           `"${user.name ?? ''}"`,
           user.email ?? '',
           user.departmentId ?? '',
           user.role ?? '',
           user.isActive ?? '',
           user.createdAt.toISOString(), // Format date
           user.updatedAt.toISOString(), // Format date
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
       description: "Filtered users have been exported to CSV",
    });
  };

  // --- Status Badge Logic (Removed - Status field doesn't exist) ---
  // Can add logic for user.isActive or user.role if needed

  return (
     // Apply the consistent wrapper class
     <div className="space-y-6">
        {/* Header */}
        {/* Remove horizontal padding (px-4 md:px-6) */}
        <div className="flex flex-col xs:flex-row items-center justify-between py-4 border-b sticky top-0 bg-white z-10">
          {/* Update title */}
           <h1 className="text-xl xs:text-2xl font-semibold mb-2 xs:mb-0">User Management</h1>
           <div className="flex items-center gap-2 w-full xs:w-auto justify-end flex-wrap">
             {/* TODO: Replace AddInvigilatorDialog with a proper AddUserDialog */}
             <AddInvigilatorDialog />
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <div className="relative w-full xs:w-auto mt-2 xs:mt-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                 placeholder="Search users..." // Update placeholder
                className="w-full pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Table Card */}
        {/* Remove margins (m-4 md:m-6) */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                           filteredUsers.length > 0 &&
                           selectedUserIds.length === filteredUsers.length // Use selectedUserIds
                         }
                         onCheckedChange={toggleSelectAll}
                         disabled={filteredUsers.length === 0}
                      />
                    </TableHead>
                    {/* Update table headers */}
                    <TableHead>User Name</TableHead>
                     <TableHead className="hidden sm:table-cell">Department</TableHead>
                     <TableHead className="hidden xs:table-cell">Role / Status</TableHead>
                     {/* Removed Assignment Details Header */}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {filteredUsers.length > 0 ? (
                     filteredUsers.map((user) => (
                       // Use user ID as key
                       <TableRow key={user.userId} className="hover:bg-muted/50 transition-colors">
                         <TableCell>
                           <Checkbox
                             // Check selection using user ID
                             checked={selectedUserIds.includes(user.userId)}
                             onCheckedChange={() => toggleSelectUser(user.userId)}
                          />
                        </TableCell>
                        <TableCell>
                          {/* Display user details */}
                           <div className="font-medium">{user.name ?? 'N/A'}</div>
                           <div className="text-sm text-muted-foreground">{user.email ?? 'N/A'}</div>
                            {/* Show role/active status on small screens */}
                           <div className="text-sm text-muted-foreground xs:hidden">
                              <Badge variant={user.isActive ? "success" : "secondary"} className="mt-1">
                                 {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                           </div>
                           <div className="text-sm text-muted-foreground sm:hidden mt-1">{user.departmentId ?? 'N/A'}</div>
                         </TableCell>
                         {/* Display user department ID */}
                         <TableCell className="hidden sm:table-cell">{user.departmentId ?? 'N/A'}</TableCell>
                         <TableCell className="hidden xs:table-cell">
                            {/* Display user role or active status */}
                            <Badge variant={user.isActive ? "success" : "secondary"}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">{user.role}</div>
                         </TableCell>
                         {/* Removed Assignment Details Cell */}
                         <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                             {/* Pass the user object directly */}
                             <EditUserDialog user={user} />
                             {/* Pass user details to Delete dialog */}
                             <DeleteInvigilatorDialog
                                 invigilatorId={user.userId} // Pass userId
                                 invigilatorName={user.name ?? user.email} // Pass userName/email
                                 onDelete={() => handleDeleteUser(user.userId)} // Call handleDeleteUser with userId
                                isDeleting={isPending}
                             />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                         {searchTerm ? "No users found matching your search." : "No users found."}
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
        {selectedUserIds.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center shadow-md lg:left-64 z-20">
             <div className="text-sm">{selectedUserIds.length} users selected</div>
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