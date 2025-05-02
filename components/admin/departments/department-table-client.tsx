"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import { Search, ChevronLeft, ChevronRight, Download, Loader2, Trash2, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { AddDepartmentDialog } from "@/components/admin/departments/add-department-dialog" // Will be created
import { EditDepartmentDialog } from "@/components/admin/departments/edit-department-dialog" // Will be created
import { DeleteDepartmentDialog } from "@/components/admin/departments/delete-department-dialog" // Will be created
import { useToast } from "@/hooks/use-toast"
import type { Department as PrismaDepartment, User as PrismaUser } from "@prisma/client";
import { deleteDepartmentAction } from "@/lib/actions" // Import department action

// Define a more detailed Department type for the table
export type DepartmentWithDetails = PrismaDepartment & {
  head: PrismaUser | null;
  _count: {
    users: number;
    exams: number;
  };
};

// Define props including head options for dialogs
interface DepartmentTableClientProps {
  initialData: DepartmentWithDetails[];
  headOptions: { value: string; label: string }[]; // Options for selecting head
}

export function DepartmentTableClient({ initialData, headOptions }: DepartmentTableClientProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition(); // For delete action

  // State for departments
  const [departments, setDepartments] = useState<DepartmentWithDetails[]>(initialData)
  const [filteredDepartments, setFilteredDepartments] = useState<DepartmentWithDetails[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]) // Store department IDs

  // Update list when initial data changes
  useEffect(() => {
    setDepartments(initialData);
    // Re-apply search filter
    if (searchTerm.trim() === "") {
      setFilteredDepartments(initialData);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = initialData.filter(
        (dept) =>
          dept.name.toLowerCase().includes(term) ||
          dept.head?.name?.toLowerCase().includes(term) ||
          dept.head?.email?.toLowerCase().includes(term)
      );
      setFilteredDepartments(filtered);
    }
    setSelectedDepartmentIds([]); // Reset selection
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // Client-side search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    const lowerCaseTerm = term.toLowerCase();

    if (term.trim() === "") {
      setFilteredDepartments(departments); // Reset to full list
    } else {
      const filtered = departments.filter(
        (dept) =>
          dept.name.toLowerCase().includes(lowerCaseTerm) ||
          dept.head?.name?.toLowerCase().includes(lowerCaseTerm) ||
          dept.head?.email?.toLowerCase().includes(lowerCaseTerm)
      );
      setFilteredDepartments(filtered);
    }
    setSelectedDepartmentIds([]); // Reset selection on search
  };

  // --- Delete Handler ---
  const handleDeleteDepartment = (departmentId: string) => {
    startTransition(async () => {
      const result = await deleteDepartmentAction(departmentId);
      if (result?.message) {
        toast({
          title: result.message.includes("success") ? "Success" : "Error",
          description: result.message,
          variant: result.message.includes("success") ? "default" : "destructive",
        });
        // Revalidation should update the list via initialData prop change
        // Remove deleted department from selection
        setSelectedDepartmentIds(prev => prev.filter(id => id !== departmentId));
      }
    });
  };

  // --- Selection Handlers ---
  const toggleSelectDepartment = (departmentId: string) => {
    setSelectedDepartmentIds((prev) =>
      prev.includes(departmentId) ? prev.filter((selectedId) => selectedId !== departmentId) : [...prev, departmentId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedDepartmentIds.length === filteredDepartments.length) {
      setSelectedDepartmentIds([]);
    } else {
      setSelectedDepartmentIds(filteredDepartments.map((dept) => dept.departmentId));
    }
  };

  // --- Export Handler ---
  const exportToCSV = () => {
    const headers = ["DepartmentID", "DepartmentName", "HeadUserID", "HeadName", "HeadEmail", "UserCount", "ExamCount", "CreatedAt", "UpdatedAt"];
    const csvContent = [
      headers.join(","),
      ...filteredDepartments.map((dept) =>
        [
          dept.departmentId,
          `"${dept.name}"`, // Enclose name in quotes
          dept.head?.userId ?? '',
          `"${dept.head?.name ?? ''}"`,
          dept.head?.email ?? '',
          dept._count.users,
          dept._count.exams,
          dept.createdAt.toISOString(),
          dept.updatedAt.toISOString(),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "departments_export.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "Filtered departments have been exported to CSV",
    });
  };

  return (
     <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col xs:flex-row items-center justify-between py-4 border-b sticky top-0 bg-background z-10 px-4 md:px-6">
          <h1 className="text-xl xs:text-2xl font-semibold mb-2 xs:mb-0">Department Management</h1>
          <div className="flex items-center gap-2 w-full xs:w-auto justify-end flex-wrap">
            {/* Add Department Dialog Trigger */}
            <AddDepartmentDialog headOptions={headOptions}>
                <Button size="sm">
                    <Download className="h-4 w-4 mr-2" /> {/* TODO: Change Icon */}
                    Add Department
                </Button>
            </AddDepartmentDialog>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <div className="relative w-full xs:w-auto mt-2 xs:mt-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search departments..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Table Card */}
        <Card className="m-4 md:m-6 flex-grow">
          <CardContent className="p-0 h-full">
            <div className="overflow-x-auto h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          filteredDepartments.length > 0 &&
                          selectedDepartmentIds.length === filteredDepartments.length
                        }
                        onCheckedChange={toggleSelectAll}
                        disabled={filteredDepartments.length === 0}
                      />
                    </TableHead>
                    <TableHead>Department Name</TableHead>
                    <TableHead className="hidden md:table-cell">Head of Department</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">Users</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">Exams</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments.length > 0 ? (
                    filteredDepartments.map((dept) => (
                      <TableRow key={dept.departmentId} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <Checkbox
                            checked={selectedDepartmentIds.includes(dept.departmentId)}
                            onCheckedChange={() => toggleSelectDepartment(dept.departmentId)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{dept.name}</div>
                           {/* Show head on smaller screens */}
                          <div className="text-sm text-muted-foreground md:hidden">
                            Head: {dept.head?.name ?? dept.head?.email ?? 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            {dept.head ? (
                                <>
                                    <div>{dept.head.name ?? 'N/A'}</div>
                                    <div className="text-xs text-muted-foreground">{dept.head.email}</div>
                                </>
                            ) : (
                                <span className="text-muted-foreground">N/A</span>
                            )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center">{dept._count.users}</TableCell>
                        <TableCell className="hidden sm:table-cell text-center">{dept._count.exams}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Edit Department Dialog Trigger - Button is now rendered inside the dialog component */}
                            <EditDepartmentDialog department={dept} headOptions={headOptions} />
                            {/* Delete Department Dialog Trigger - Button is now rendered inside the dialog component */}
                            <DeleteDepartmentDialog
                                departmentId={dept.departmentId}
                                departmentName={dept.name}
                                onDelete={() => handleDeleteDepartment(dept.departmentId)}
                                isDeleting={isPending}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No departments found matching your search." : "No departments found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination (Placeholder - Needs implementation) */}
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

        {/* Bulk Actions Footer (Placeholder) */}
        {selectedDepartmentIds.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-between items-center shadow-md lg:left-64 z-20">
            <div className="text-sm">{selectedDepartmentIds.length} departments selected</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Bulk Action 1
              </Button>
              <Button variant="destructive" size="sm" disabled>
                Bulk Delete
              </Button>
            </div>
          </div>
        )}
      </div>
  )
}