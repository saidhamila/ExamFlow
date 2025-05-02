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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Added Select
import { useToast } from "@/hooks/use-toast"
import { addDepartmentAction } from "@/lib/actions" // Import department action

// Props for the dialog, including options for the head dropdown and children for the trigger
interface AddDepartmentDialogProps {
  headOptions: { value: string; label: string }[];
  children: React.ReactElement; // Must be a single element for asChild
}

export function AddDepartmentDialog({ headOptions, children }: AddDepartmentDialogProps) { // children added back to params
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedHeadId, setSelectedHeadId] = useState<string | undefined>(undefined); // State for select

  const handleSubmit = async (formData: FormData) => {
    // Manually set headId based on select state if needed, or ensure it's in formData
    // Check if a valid head is selected (not "none" or undefined)
    if (selectedHeadId && selectedHeadId !== "none") {
        formData.set('headId', selectedHeadId);
    } else {
        formData.delete('headId'); // Ensure it's not sent if 'None' or nothing is selected
    }

    startTransition(async () => {
      const result = await addDepartmentAction(formData);

      if (result?.errors) {
        console.error("Validation Errors:", result.errors);
        toast({
          title: "Validation Failed",
          description: result.message || "Please check the form fields.",
          variant: "destructive",
        });
      } else if (result?.message && (result.message.includes("Failed") || result.message.includes("Error") || result.message.includes("Invalid"))) {
         toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: result?.message || "Department added successfully.",
        });
        setOpen(false); // Close dialog on success
        formRef.current?.reset(); // Reset form fields
        setSelectedHeadId(undefined); // Reset select state
      }
    });
  };


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
            formRef.current?.reset();
            setSelectedHeadId(undefined); // Reset to undefined to show placeholder
        }
    }}>
      {/* Put asChild back */}
      {/* Use asChild and render the passed children */}
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Department</DialogTitle>
          <DialogDescription>Enter the details for the new department. Click save when you're done.</DialogDescription>
        </DialogHeader>
        {/* Use form action */}
        <form ref={formRef} action={handleSubmit} className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" name="name" className="col-span-3" required />
            </div>
            {/* Head of Department (Optional Select) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="headId" className="text-right">
                Head
              </Label>
              {/* Use Select component */}
              <Select name="headId" value={selectedHeadId} onValueChange={setSelectedHeadId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Head (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {/* Use "none" as value instead of empty string */}
                  <SelectItem value="none">-- None --</SelectItem>
                  {headOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
             </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}