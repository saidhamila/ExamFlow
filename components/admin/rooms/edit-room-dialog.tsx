"use client"

import { useState, useTransition, useRef, useEffect } from "react" // Removed React import
import { Loader2, Edit } from "lucide-react" // Added Edit icon

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
import { updateRoomAction } from "@/lib/actions" // Import room action
import type { Room as PrismaRoom } from "@prisma/client"; // Import Room type

// Define props for editing a Room
interface EditRoomDialogProps {
  room: PrismaRoom; // Prop is now a Room
  // Removed children prop
}

export function EditRoomDialog({ room }: EditRoomDialogProps) { // Removed children from destructuring
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null);
  // State for checkbox
  const [isAvailable, setIsAvailable] = useState(room.isAvailable);

  // Reset checkbox state if dialog closes or room changes
  useEffect(() => {
    if (!open) {
        setIsAvailable(room.isAvailable);
    }
  }, [open, room.isAvailable]);


  const handleSubmit = async (formData: FormData) => {
    // Manually set checkbox value if needed, or ensure it's handled by form data
    formData.set('isAvailable', isAvailable ? 'on' : 'off'); // Set based on state

    startTransition(async () => {
      const result = await updateRoomAction(room.roomId, formData);

      if (result?.errors) {
        console.error("Validation Errors:", result.errors);
        toast({
          title: "Validation Failed",
          description: result.message || "Please check the form fields.",
          variant: "destructive",
        });
      } else if (result?.message && (result.message.includes("Failed") || result.message.includes("Error") || result.message.includes("Invalid") || result.message.includes("not found") || result.message.includes("in use"))) {
         toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: result?.message || "Room updated successfully.",
        });
        setOpen(false); // Close dialog on success
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Render the trigger button directly inside */}
      <DialogTrigger asChild>
         <Button variant="ghost" size="icon" className="h-8 w-8">
             <Edit className="h-4 w-4" />
             <span className="sr-only">Edit</span>
         </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
          <DialogDescription>Make changes to the room details. Click save when you're done.</DialogDescription>
        </DialogHeader>
        {/* Use form action */}
        <form ref={formRef} action={handleSubmit} className="grid gap-4 py-4">
            {/* Room Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomName" className="text-right">
                Name/Number
              </Label>
              <Input id="roomName" name="roomName" className="col-span-3" required defaultValue={room.roomName} />
            </div>
             {/* Capacity */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacity
              </Label>
              <Input id="capacity" name="capacity" type="number" min="1" className="col-span-3" required defaultValue={room.capacity} />
            </div>
             {/* Location (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input id="location" name="location" placeholder="e.g., Building A, Floor 2" className="col-span-3" defaultValue={room.location ?? ''} />
            </div>
             {/* Availability (Checkbox) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isAvailable" className="text-right">
                Available
              </Label>
              <div className="col-span-3 flex items-center">
                 {/* Controlled Checkbox */}
                 <Checkbox
                    id="isAvailable"
                    name="isAvailable" // Name might not be needed if handled via state
                    checked={isAvailable}
                    onCheckedChange={(checked) => setIsAvailable(Boolean(checked))}
                 />
                 <span className="ml-2 text-sm text-muted-foreground">Is the room currently available?</span>
              </div>
            </div>

          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
             </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}