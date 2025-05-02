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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Added Select
import { useToast } from "@/hooks/use-toast"
import { updateDepartmentAction } from "@/lib/actions" // Import department action
import type { DepartmentWithDetails } from "./department-table-client" // Import detailed type

// Define props for editing a Department
interface EditDepartmentDialogProps {
  department: DepartmentWithDetails; // Prop is now a Department
  headOptions: { value: string; label: string }[];
  // Removed children prop
}

export function EditDepartmentDialog({ department, headOptions }: EditDepartmentDialogProps) { // Removed children from destructuring
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null);
  // State for the select, initialized with the current head's ID or empty string
  const [selectedHeadId, setSelectedHeadId] = useState<string | undefined>(department.head?.userId ?? undefined);

  // Reset select state if dialog closes or department changes
  useEffect(() => {
    if (!open) {
        setSelectedHeadId(department.head?.userId ?? undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, department.head?.userId]);


  const handleSubmit = async (formData: FormData) => {
    // Manually set headId based on select state
    if (selectedHeadId !== undefined) { // Check if it's defined (could be empty string for 'None')
        formData.set('headId', selectedHeadId);
    } else {
        // If undefined (shouldn't happen with current logic but safe check), don't send headId
         formData.delete('headId');
    }

    startTransition(async () => {
      const result = await updateDepartmentAction(department.departmentId, formData);

      if (result?.errors) {
        console.error("Validation Errors:", result.errors);
        toast({
          title: "Validation Failed",
          description: result.message || "Please check the form fields.",
          variant: "destructive",
        });
      } else if (result?.message && (result.message.includes("Failed") || result.message.includes("Error") || result.message.includes("Invalid") || result.message.includes("not found"))) {
         toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: result?.message || "Department updated successfully.",
        });
        setOpen(false); // Close dialog on success
        // No need to reset form here as defaultValues handle it
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
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Make changes to the department details. Click save when you're done.</DialogDescription>
        </DialogHeader>
        {/* Use form action */}
        <form ref={formRef} action={handleSubmit} className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" name="name" className="col-span-3" required defaultValue={department.name} />
            </div>
            {/* Head of Department (Optional Select) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="headId" className="text-right">
                Head
              </Label>
              <Select name="headId" value={selectedHeadId ?? ''} onValueChange={setSelectedHeadId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Head (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- None --</SelectItem> {/* Option for no head */}
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}