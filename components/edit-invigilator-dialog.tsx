"use client"

import type React from "react"
import { useState, useTransition, useRef } from "react"
import { Edit, Loader2 } from "lucide-react"

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
// Remove Select imports as status is removed
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { updateUserAction } from "@/lib/actions" // Import renamed server action
import type { User as PrismaUser } from "@prisma/client"; // Import Prisma User type

// Define props for editing a User
interface EditUserDialogProps {
  user: PrismaUser; // Prop is now a User
}

// Rename component and update props
export function EditUserDialog({ user }: EditUserDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null);

  // Remove internal state management
  // const [formData, setFormData] = useState({...})
  // const [errors, setErrors] = useState<Record<string, string>>({})
  // Remove useEffect, handleChange, handleSelectChange, validateForm

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      // Call renamed action with userId
      const result = await updateUserAction(user.userId, formData);

      if (result?.errors) {
        console.error("Validation Errors:", result.errors);
        toast({
          title: "Validation Failed",
          description: result.message || "Please check the form fields.",
          variant: "destructive",
        });
      } else if (result?.message && (result.message.includes("Failed") || result.message.includes("not found"))) {
         toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: result?.message || "User updated successfully.", // Update success message
        });
        setOpen(false); // Close dialog on success
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* Update dialog title */}
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Make changes to the user details. Click save when you're done.</DialogDescription>
        </DialogHeader>
        {/* Use form action */}
        <form ref={formRef} action={handleSubmit} className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              {/* User name is optional, remove required? */}
              <Input id="name" name="name" className="col-span-3" defaultValue={user.name ?? ''} />
            </div>
            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" name="email" type="email" className="col-span-3" required defaultValue={user.email} />
            </div>
            {/* Phone - Remove this field as it's not on User model */}
            {/* <div className="grid grid-cols-4 items-center gap-4"> ... </div> */}
            {/* Department */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departmentId" className="text-right">
                Department ID
              </Label>
              {/* Use departmentId, it's optional */}
              <Input id="departmentId" name="departmentId" className="col-span-3" defaultValue={user.departmentId ?? ''} />
            </div>
            {/* Status - Remove this field, use isActive if needed */}
            {/* <div className="grid grid-cols-4 items-center gap-4"> ... </div> */}
            {/* Optional: Add isActive toggle/checkbox if needed */}
            {/* <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">Active</Label>
              <Checkbox id="isActive" name="isActive" defaultChecked={user.isActive} />
            </div> */}

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
