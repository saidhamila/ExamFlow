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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox" // Added Checkbox
import { ScrollArea } from "@/components/ui/scroll-area" // Added ScrollArea
import { useToast } from "@/hooks/use-toast"
import { addExamAction } from "@/lib/actions"
// Remove useSessionData import

// Define props including options for selects/checkboxes
interface AddExamDialogProps {
  departmentOptions: { value: string; label: string }[]; // Add back prop
  roomOptions: { value: string; label: string }[]; // Add back prop
  invigilatorOptions: { value: string; label: string }[];
  children?: React.ReactNode; // Allow wrapping a custom trigger
}

export function AddExamDialog({
    departmentOptions, // Add back prop
    roomOptions, // Add back prop
    invigilatorOptions,
    children
}: AddExamDialogProps) {
  // Remove useSessionData hook call
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null);

  // Server action call
  const handleSubmit = async (formData: FormData) => {
    // Basic client-side check for multi-selects
    if (formData.getAll('roomIds').length === 0) {
        toast({ title: "Validation Failed", description: "Please select at least one room.", variant: "destructive" });
        return;
    }
     if (formData.getAll('invigilatorUserIds').length === 0) {
        toast({ title: "Validation Failed", description: "Please select at least one invigilator.", variant: "destructive" });
        return;
    }

    startTransition(async () => {
      const result = await addExamAction(formData);

      if (result?.errors) {
        console.error("Validation Errors:", result.errors);
         // Improve error display if possible, e.g., map errors to fields
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
          description: result?.message || "Exam added successfully.",
        });
        setOpen(false); // Close dialog on success
        formRef.current?.reset(); // Reset form fields
      }
    });
  };

  // Remove mapping logic for departmentOptions and roomOptions


  const trigger = children ?? (
    <Button size="sm" className="flex items-center gap-1">
      <Plus className="h-4 w-4" />
      <span className="hidden md:inline">Add Exam</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) formRef.current?.reset();
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl"> {/* Increased width */}
        <DialogHeader>
          <DialogTitle>Add New Exam</DialogTitle>
          <DialogDescription>Enter the details for the new exam. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
            {/* Subject */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input id="subject" name="subject" className="col-span-3" required />
            </div>

            {/* Department */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departmentId" className="text-right">
                Department
              </Label>
               <Select name="departmentId" required>
                  <SelectTrigger id="departmentId" className="col-span-3">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            {/* Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="examDate" className="text-right">
                Date
              </Label>
              <Input id="examDate" name="examDate" type="date" className="col-span-3" required />
            </div>

            {/* Start Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Input id="startTime" name="startTime" type="time" className="col-span-3" required />
            </div>

             {/* End Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <Input id="endTime" name="endTime" type="time" className="col-span-3" required />
            </div>

             {/* Difficulty (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Difficulty
              </Label>
              <Input id="difficulty" name="difficulty" type="number" min="1" max="5" placeholder="1-5 (Optional)" className="col-span-3" />
            </div>

             {/* Coefficient (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coefficient" className="text-right">
                Coefficient
              </Label>
              <Input id="coefficient" name="coefficient" type="number" min="0" placeholder="Optional" className="col-span-3" />
            </div>

             {/* Rooms (Multi-select Checkboxes) */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Rooms
              </Label>
              <ScrollArea className="col-span-3 h-32 rounded-md border p-2">
                 {roomOptions.length === 0 ? (
                     <p className="text-sm text-muted-foreground text-center py-4">No rooms available</p>
                 ) : (
                    roomOptions.map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2 mb-2">
                            <Checkbox id={`room-${opt.value}`} name="roomIds" value={opt.value} />
                            <Label htmlFor={`room-${opt.value}`} className="font-normal">{opt.label}</Label>
                        </div>
                    ))
                 )}
              </ScrollArea>
            </div>

            {/* Invigilators (Multi-select Checkboxes) */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Invigilators
              </Label>
               <ScrollArea className="col-span-3 h-32 rounded-md border p-2">
                 {invigilatorOptions.length === 0 ? (
                     <p className="text-sm text-muted-foreground text-center py-4">No invigilators available</p>
                 ) : (
                    invigilatorOptions.map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2 mb-2">
                            <Checkbox id={`invigilator-${opt.value}`} name="invigilatorUserIds" value={opt.value} />
                            <Label htmlFor={`invigilator-${opt.value}`} className="font-normal">{opt.label}</Label>
                        </div>
                    ))
                 )}
              </ScrollArea>
            </div>

             {/* Is Duplicate (Optional Checkbox) */}
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="isDuplicate" className="text-right">Duplicate?</Label>
               <div className="col-span-3 flex items-center">
                 <Checkbox id="isDuplicate" name="isDuplicate" />
                 <span className="ml-2 text-sm text-muted-foreground">Is this a duplicated session?</span>
               </div>
            </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
             <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
             </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Exam
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
