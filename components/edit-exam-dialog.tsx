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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { updateExamAction } from "@/lib/actions" // Import server action
import type { Exam } from "@/lib/data" // Import correct Exam type

// Define props
interface EditExamDialogProps {
  exam: Exam; // Use imported Exam type
  invigilatorOptions: { value: string; label: string }[];
}

// Helper to format date from ISO string to YYYY-MM-DD for input defaultValue
const formatDateForInput = (isoDate: string): string => {
  if (!isoDate) return "";
  try {
    return isoDate.substring(0, 10);
  } catch {
    return ""; // Handle potential errors
  }
};

export function EditExamDialog({ exam, invigilatorOptions }: EditExamDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null);

  // Server action call, bound with exam.id
  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateExamAction(exam.id, formData); // Pass exam.id

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
          description: result?.message || "Exam updated successfully.",
        });
        setOpen(false); // Close dialog on success
        // No need to reset form for edit dialog usually
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Exam</DialogTitle>
          <DialogDescription>Make changes to the exam details. Click save when you're done.</DialogDescription>
        </DialogHeader>
        {/* Use form action attribute */}
        <form ref={formRef} action={handleSubmit} className="grid gap-4 py-4">
            {/* Course Code */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseCode" className="text-right">
                Course Code
              </Label>
              <Input id="courseCode" name="courseCode" className="col-span-3" required defaultValue={exam.courseCode} />
            </div>

            {/* Course Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="courseName" className="text-right">
                Course Name
              </Label>
              <Input id="courseName" name="courseName" className="col-span-3" required defaultValue={exam.courseName} />
            </div>

            {/* Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input id="date" name="date" type="date" className="col-span-3" required defaultValue={formatDateForInput(exam.date)} />
            </div>

            {/* Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time (HH:MM AM/PM)
              </Label>
              <Input id="time" name="time" type="time" className="col-span-3" required defaultValue={exam.time} />
            </div>

             {/* Duration */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration (min)
              </Label>
              <Input id="duration" name="duration" type="number" className="col-span-3" required min="1" defaultValue={exam.duration} />
            </div>

            {/* Room */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">
                Room
              </Label>
              <Input id="room" name="room" className="col-span-3" required defaultValue={exam.room} />
            </div>

             {/* Department */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input id="department" name="department" className="col-span-3" required defaultValue={exam.department} />
            </div>

            {/* Invigilators (Single Select for now) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invigilators" className="text-right">
                Invigilator(s)
              </Label>
              <div className="col-span-3">
                 <Select name="invigilators" required defaultValue={exam.invigilators[0] ?? ""}> {/* Default to first invigilator */}
                  <SelectTrigger id="invigilators">
                    <SelectValue placeholder="Select invigilator" />
                  </SelectTrigger>
                  <SelectContent>
                    {invigilatorOptions.length === 0 ? (
                        <SelectItem value="" disabled>Loading...</SelectItem>
                    ) : (
                        invigilatorOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
