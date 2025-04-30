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
// Remove useToast

// Define props
interface DeleteInvigilatorDialogProps {
  invigilatorId: string;
  invigilatorName: string; // Add invigilatorName
  onDelete: () => void; // Function to call the server action
  isDeleting: boolean; // Loading state from parent
}

export function DeleteInvigilatorDialog({
  invigilatorId,
  invigilatorName,
  onDelete,
  isDeleting
}: DeleteInvigilatorDialogProps) {
  const [open, setOpen] = useState(false)

  const handleDeleteConfirm = () => {
    onDelete(); // Call the passed function
    // Parent handles closing/feedback based on action result
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="icon"> {/* Use destructive variant */}
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Invigilator</DialogTitle>
          <DialogDescription>
            {/* Display the invigilator name */}
            Are you sure you want to delete the invigilator "{invigilatorName}"? This action cannot be undone and may fail if they are assigned to exams.
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
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
