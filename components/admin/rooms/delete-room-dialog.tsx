"use client"

import { useState } from "react"
import { Trash2, Loader2, AlertCircle } from "lucide-react" // Added AlertCircle

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert" // Added Alert components
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

// Define props for deleting a Room
interface DeleteRoomDialogProps {
  roomId: string;
  roomName: string;
  onDelete: () => void; // Function to call the server action
  isDeleting: boolean; // Loading state from parent
  specificError?: string; // Optional prop for specific error message
  onOpenChange?: (open: boolean) => void; // Optional prop to handle dialog state changes
}

export function DeleteRoomDialog({
  roomId,
  roomName,
  onDelete,
  isDeleting,
  specificError, // Destructure new prop
  onOpenChange // Destructure new prop
}: DeleteRoomDialogProps) {
  const [open, setOpen] = useState(false)

  const handleDeleteConfirm = () => {
    onDelete(); // Call the passed function from the parent
  }

  // Combine internal state management with external callback
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (onOpenChange) {
      onOpenChange(isOpen); // Call the passed handler
    }
  };

  return (
    // Use the combined handler for onOpenChange
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Render trigger internally */}
      <DialogTrigger asChild>
         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isDeleting}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Room</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the room "{roomName}"?
            This action cannot be undone and may fail if the room is currently booked for exams.
          </DialogDescription>
        </DialogHeader>
        {/* Display specific error message if present */}
        {specificError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            {/* <AlertTitle>Error</AlertTitle> */}
            <AlertDescription>{specificError}</AlertDescription>
          </Alert>
        )}
        <DialogFooter className="gap-2 sm:gap-0 pt-4"> {/* Added pt-4 for spacing */}
           <DialogClose asChild>
             <Button variant="outline" disabled={isDeleting}>
                Cancel
             </Button>
           </DialogClose>
          <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
             {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}