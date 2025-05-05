"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteStudentAction } from "@/lib/actions"; // Import the server action
import type { StudentWithDetails } from "@/lib/data";
import { Loader2 } from "lucide-react";

interface DeleteStudentDialogProps {
  student: StudentWithDetails | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentDeleted: () => void; // Callback to refresh data
}

export function DeleteStudentDialog({ student, isOpen, onOpenChange, onStudentDeleted }: DeleteStudentDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!student) return;

    setIsDeleting(true);
    try {
      const result = await deleteStudentAction(student.userId);

      if (result.message.includes("successfully")) {
        toast({
          title: "Success",
          description: result.message,
        });
        onStudentDeleted(); // Trigger data refresh
        onOpenChange(false); // Close dialog
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete student:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the student account
            for <span className="font-semibold">{student?.name ?? student?.email ?? 'this student'}</span> and remove their associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Student
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}