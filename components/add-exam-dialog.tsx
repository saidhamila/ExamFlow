"use client"

import type React from "react"
import { useState, useTransition, useRef } from "react" // Import useTransition and useRef
import { Plus, Loader2 } from "lucide-react" // Import Loader2

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast" // Import useToast
import { addExamAction } from "@/lib/actions" // Import server action

// Define props including invigilator options
interface AddExamDialogProps {
  invigilatorOptions: { value: string; label: string }[];
}

export function AddExamDialog({ invigilatorOptions }: AddExamDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition() // For loading state
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null); // Ref for resetting the form

  // Server action call
  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await addExamAction(formData);

      if (result?.errors) {
        // Handle validation errors (e.g., display them)
        // For now, just show a generic error toast
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
          description: result?.message || "Exam added successfully.",
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
          <span className="hidden md:inline">Add Exam</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg"> {/* Increased width slightly */}
        <DialogHeader>
          <DialogTitle>Add New Exam</DialogTitle>
          <DialogDescription>Enter the details for the new exam. Click save when you're done.</DialogDescription>
        </DialogHeader>
        {/* Use form action attribute */}
        <form ref={formRef} action={handleSubmit} className="grid gap-4 py-4">
            {/* Course Code */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseCode" className="text-right">
                Course Code
              </Label>
              <Input id="courseCode" name="courseCode" className="col-span-3" required />
            </div>

            {/* Course Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseName" className="text-right">
                Course Name
              </Label>
              <Input id="courseName" name="courseName" className="col-span-3" required />
            </div>

            {/* Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input id="date" name="date" type="date" className="col-span-3" required />
            </div>

            {/* Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time (HH:MM AM/PM)
              </Label>
              {/* Use a single time input for simplicity, action expects specific format */}
              <Input id="time" name="time" type="time" className="col-span-3" required placeholder="e.g., 09:00 AM" />
            </div>

             {/* Duration */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration (min)
              </Label>
              <Input id="duration" name="duration" type="number" className="col-span-3" required min="1" />
            </div>

            {/* Room */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">
                Room
              </Label>
              <Input id="room" name="room" className="col-span-3" required />
            </div>

             {/* Department */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              {/* Consider making this a Select if departments are predefined */}
              <Input id="department" name="department" className="col-span-3" required />
            </div>

            {/* Invigilators (Single Select for now) */}
            {/* TODO: Implement multi-select later if needed */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invigilators" className="text-right">
                Invigilator(s)
              </Label>
              <div className="col-span-3">
                 <Select name="invigilators" required>
                  <SelectTrigger id="invigilators">
                    <SelectValue placeholder="Select invigilator" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Removed the explicit "Loading..." item which caused the error */}
                    {invigilatorOptions.length === 0 ? (
                         <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">No invigilators found</div>
                    ) : (
                        invigilatorOptions.map(opt => (
                            // Ensure opt.value is never an empty string if data source could provide it
                            opt.value ? <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem> : null
                        ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Multi-select coming soon.</p>
              </div>
            </div>

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
