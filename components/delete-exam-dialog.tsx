"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react" // Import Loader2

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose, // Import DialogClose
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
// Remove useToast, feedback is handled by the caller

// Define props
interface DeleteExamDialogProps {
  examId: string;
  examName: string; // Add examName for display
  onDelete: () => void; // Function to call the server action
  isDeleting: boolean; // Loading state from parent
}

export function DeleteExamDialog({ examId, examName, onDelete, isDeleting }: DeleteExamDialogProps) {
  const [open, setOpen] = useState(false)

  const handleDeleteConfirm = () => {
    onDelete(); // Call the passed function (which triggers the server action)
    // Don't close the dialog immediately, wait for the action to complete (handled by parent re-render/toast)
    // setOpen(false); // Remove this
    // Remove internal toast logic
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Use destructive variant for the trigger button */}
        <Button variant="destructive" size="icon">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Exam</DialogTitle>
          <DialogDescription>
            {/* Display the exam name */}
            Are you sure you want to delete the exam "{examName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
           <DialogClose asChild>
             <Button variant="outline" disabled={isDeleting}>
                Cancel
             </Button>
           </DialogClose>
          {/* Disable button and show loader when deleting */}
          <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
             {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
