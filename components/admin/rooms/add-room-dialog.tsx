"use client"

import type React from "react"
import { useState, useTransition, useRef } from "react"
import { Loader2 } from "lucide-react"
// PlusCircle import removed as it's no longer needed here

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox" // Added Checkbox
import { useToast } from "@/hooks/use-toast"
import { addRoomAction } from "@/lib/actions" // Import room action

// Props for the dialog, including children for the trigger
interface AddRoomDialogProps {
  children: React.ReactElement; // Must be a single element for asChild
}

export function AddRoomDialog({ children }: AddRoomDialogProps) { // children added back to params
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await addRoomAction(formData);

      if (result?.errors) {
        console.error("Validation Errors:", result.errors);
        toast({
          title: "Validation Failed",
          description: result.message || "Please check the form fields.",
          variant: "destructive",
        });
      } else if (result?.message && (result.message.includes("Failed") || result.message.includes("Error") || result.message.includes("Invalid") || result.message.includes("exist"))) {
         toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: result?.message || "Room added successfully.",
        });
        setOpen(false); // Close dialog on success
        formRef.current?.reset(); // Reset form fields
      }
    });
  };


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
            formRef.current?.reset();
        }
    }}>
      {/* Use asChild and render the passed children */}
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
          <DialogDescription>Enter the details for the new room. Click save when you're done.</DialogDescription>
        </DialogHeader>
        {/* Use form action */}
        <form ref={formRef} action={handleSubmit} className="grid gap-4 py-4">
            {/* Room Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomName" className="text-right">
                Name/Number
              </Label>
              <Input id="roomName" name="roomName" className="col-span-3" required />
            </div>
            {/* Capacity */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacity
              </Label>
              <Input id="capacity" name="capacity" type="number" min="1" className="col-span-3" required />
            </div>
             {/* Location (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input id="location" name="location" placeholder="e.g., Building A, Floor 2" className="col-span-3" />
            </div>
             {/* Availability (Checkbox) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isAvailable" className="text-right">
                Available
              </Label>
              <div className="col-span-3 flex items-center">
                 <Checkbox id="isAvailable" name="isAvailable" defaultChecked={true} />
                 <span className="ml-2 text-sm text-muted-foreground">Is the room currently available?</span>
              </div>
            </div>

          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
             </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}