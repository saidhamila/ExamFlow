"use client";

import { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import type { StudentWithDetails } from "@/lib/data";
import { AddStudentDialog } from "./add-student-dialog";
import { EditStudentDialog } from "./edit-student-dialog";
import { DeleteStudentDialog } from "./delete-student-dialog";

interface StudentTableClientProps {
  initialStudents: StudentWithDetails[];
}

export function StudentTableClient({ initialStudents }: StudentTableClientProps) {
  const [students, setStudents] = useState<StudentWithDetails[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentWithDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentWithDetails | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Function to log refresh attempt (rely on revalidatePath for actual refresh)
  const triggerRefresh = useCallback(() => {
    console.log("Refreshing student list (triggered by add/edit/delete)...");
    // In a real app with client-side state updates, you'd refetch here.
    // For now, we rely on Next.js cache revalidation triggered by server actions.
  }, []);

  // Filtering logic
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentProfile?.program?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers for dialogs
  const handleAddStudent = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditStudent = (studentId: string) => {
    const student = students.find(s => s.userId === studentId);
    if (student) {
      setStudentToEdit(student);
      setIsEditDialogOpen(true);
    } else {
      console.error("Student not found for editing:", studentId);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = students.find(s => s.userId === studentId);
    if (student) {
      setStudentToDelete(student);
      setIsDeleteDialogOpen(true);
    } else {
      console.error("Student not found for deletion:", studentId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter and Add Button */}
      <div className="flex justify-between items-center gap-2">
        <Input
          placeholder="Filter students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAddStudent}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Student
        </Button>
      </div>

      {/* Student Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Program</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow key={student.userId}>
                  <TableCell>{student.name || "N/A"}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.studentProfile?.program || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditStudent(student.userId)}
                      className="mr-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStudent(student.userId)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No students found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <AddStudentDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onStudentAdded={triggerRefresh}
      />
      <EditStudentDialog
        student={studentToEdit}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onStudentUpdated={() => {
          triggerRefresh();
          setStudentToEdit(null);
        }}
      />
      <DeleteStudentDialog
        student={studentToDelete}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onStudentDeleted={() => {
          triggerRefresh();
          setStudentToDelete(null);
        }}
      />
    </div>
  );
}