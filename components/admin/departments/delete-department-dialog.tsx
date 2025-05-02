"use client"

import { useState } from "react" // Removed React import
import { Trash2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Define props for deleting a Department
interface DeleteDepartmentDialogProps {
  departmentId: string;
  departmentName: string;
  onDelete: () => void; // Function to call the server action
  isDeleting: boolean; // Loading state from parent
  // Removed children prop
}

export function DeleteDepartmentDialog({
  departmentId,
  departmentName,
  onDelete,
  isDeleting
  // Removed children from destructuring
}: DeleteDepartmentDialogProps) {
  const [open, setOpen] = useState(false)

  const handleDeleteConfirm = () => {
    onDelete(); // Call the passed function from the parent (which calls the server action)
    // Parent component (DepartmentTableClient) handles closing/feedback based on action result
    // We might want to close the dialog optimistically or wait for parent state update
    // For now, let the parent handle closing via re-render or state change
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Render trigger internally, remove cloneElement/children */}
      <DialogTrigger asChild>
         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isDeleting}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Department</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the department "{departmentName}"?
            This action cannot be undone and may fail if the department has associated users or exams.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
           <DialogClose asChild>
             <Button variant="outline" disabled={isDeleting}>
                Cancel
             </Button>
           </DialogClose>
          <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
             {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete Department
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}