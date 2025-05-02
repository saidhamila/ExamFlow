"use client"

import type React from "react"
import { useState, useTransition, useRef } from "react"
import { Plus, Loader2 } from "lucide-react"

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
// Remove Select imports as status is not set here
import { useToast } from "@/hooks/use-toast"
import { addUserAction } from "@/lib/actions" // Import renamed server action

// Remove prop interface, no props needed now
// interface AddInvigilatorDialogProps {
// }

export function AddInvigilatorDialog() { // Remove props
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null);

  // Remove internal state management
  // const [formData, setFormData] = useState({...})
  // const [errors, setErrors] = useState<Record<string, string>>({})
  // Remove handleChange, handleSelectChange, validateForm

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      // Call the renamed action
      const result = await addUserAction(formData);

      if (result?.errors) {
        console.error("Validation Errors:", result.errors);
        toast({
          title: "Validation Failed",
          description: result.message || "Please check the form fields.",
          variant: "destructive",
        });
      } else if (result?.message && result.message.includes("Failed")) {
         toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: result?.message || "User added successfully.", // Update success message
        });
        setOpen(false); // Close dialog on success
        formRef.current?.reset(); // Reset form fields
      }
    });
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          {/* Update button text if desired, e.g., Add User */}
          <span className="hidden md:inline">Add User</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* Update dialog title */}
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Enter the details for the new user. Click save when you're done.</DialogDescription>
        </DialogHeader>
        {/* Use form action */}
        <form ref={formRef} action={handleSubmit} className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" name="name" className="col-span-3" required />
              {/* Basic client-side required attribute is enough for now */}
            </div>
            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" name="email" type="email" className="col-span-3" required />
            </div>
            {/* Phone */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input id="phone" name="phone" type="tel" className="col-span-3" required />
            </div>
{/* Password */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input id="password" name="password" type="password" className="col-span-3" required />
            </div>
            {/* Department */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              {/* Use departmentId based on UserSchema in actions.ts */}
              <Input id="departmentId" name="departmentId" className="col-span-3" />
              {/* Department is optional for User, remove 'required' */}
            </div>
            {/* Remove Status field - handled by backend */}
            {/* <div className="grid grid-cols-4 items-center gap-4"> ... </div> */}

          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
             </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
