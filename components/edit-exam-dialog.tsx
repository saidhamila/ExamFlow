"use client"

import type React from "react"
import { useState, useTransition, useRef, useEffect } from "react"
import { Edit, Loader2 } from "lucide-react"
import { format } from 'date-fns'; // Import date-fns format function

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
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { updateExamAction } from "@/lib/actions"
import type { ExamWithDetails } from "@/lib/data" // Import the detailed type
// Remove useSessionData import

// Define props
interface EditExamDialogProps {
  exam: ExamWithDetails; // Use the detailed type
  departmentOptions: { value: string; label: string }[]; // Add back prop
  roomOptions: { value: string; label: string }[]; // Add back prop
  invigilatorOptions: { value: string; label: string }[];
  children?: React.ReactNode;
}

// Helper to format date object or string to YYYY-MM-DD
const formatDateForInput = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  try {
    return format(new Date(date), 'yyyy-MM-dd');
  } catch {
    return "";
  }
};

// Helper to format date object or string to HH:MM
const formatTimeForInput = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    try {
        // Ensure it's a Date object before formatting
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        // Format to 24-hour HH:mm
        return format(dateObj, 'HH:mm');
    } catch (e) {
        console.error("Error formatting time:", e);
        return "";
    }
};


export function EditExamDialog({
    exam,
    departmentOptions, // Add back prop
    roomOptions, // Add back prop
    invigilatorOptions,
    children
}: EditExamDialogProps) {
  // Remove useSessionData hook call
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null);

  // Extract default selected IDs for checkboxes
  const defaultRoomIds = exam.examRooms.map(er => er.roomId).filter((id): id is string => id !== null);
  const defaultInvigilatorIds = exam.invigilators.map(inv => inv.userId).filter((id): id is string => id !== null);

  // Server action call, bound with exam.examId
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
      const result = await updateExamAction(exam.examId, formData); // Pass examId

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
          description: result?.message || "Exam updated successfully.",
        });
        setOpen(false); // Close dialog on success
      }
    });
  };

  // Remove mapping logic for departmentOptions and roomOptions

   const trigger = children ?? (
     <Button variant="outline" size="icon">
       <Edit className="h-4 w-4" />
       <span className="sr-only">Edit</span>
     </Button>
   );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Exam</DialogTitle>
          <DialogDescription>Make changes to the exam details. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
            {/* Subject */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input id="subject" name="subject" className="col-span-3" required defaultValue={exam.subject} />
            </div>

            {/* Department */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departmentId" className="text-right">
                Department
              </Label>
               <Select name="departmentId" required defaultValue={exam.departmentId}>
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
              <Input id="examDate" name="examDate" type="date" className="col-span-3" required defaultValue={formatDateForInput(exam.examDate)} />
            </div>

            {/* Start Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Input id="startTime" name="startTime" type="time" className="col-span-3" required defaultValue={formatTimeForInput(exam.startTime)} />
            </div>

             {/* End Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <Input id="endTime" name="endTime" type="time" className="col-span-3" required defaultValue={formatTimeForInput(exam.endTime)} />
            </div>

             {/* Difficulty (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Difficulty
              </Label>
              <Input id="difficulty" name="difficulty" type="number" min="1" max="5" placeholder="1-5 (Optional)" className="col-span-3" defaultValue={exam.difficulty ?? ''} />
            </div>

             {/* Coefficient (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coefficient" className="text-right">
                Coefficient
              </Label>
              <Input id="coefficient" name="coefficient" type="number" min="0" placeholder="Optional" className="col-span-3" defaultValue={exam.coefficient ?? ''} />
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
                            <Checkbox
                                id={`edit-room-${opt.value}`}
                                name="roomIds"
                                value={opt.value}
                                defaultChecked={defaultRoomIds.includes(opt.value)}
                            />
                            <Label htmlFor={`edit-room-${opt.value}`} className="font-normal">{opt.label}</Label>
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
                            <Checkbox
                                id={`edit-invigilator-${opt.value}`}
                                name="invigilatorUserIds"
                                value={opt.value}
                                defaultChecked={defaultInvigilatorIds.includes(opt.value)}
                            />
                            <Label htmlFor={`edit-invigilator-${opt.value}`} className="font-normal">{opt.label}</Label>
                        </div>
                    ))
                 )}
              </ScrollArea>
            </div>

             {/* Is Duplicate (Optional Checkbox) */}
            <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="isDuplicate" className="text-right">Duplicate?</Label>
               <div className="col-span-3 flex items-center">
                 <Checkbox id="isDuplicate" name="isDuplicate" defaultChecked={exam.isDuplicate} />
                 <span className="ml-2 text-sm text-muted-foreground">Is this a duplicated session?</span>
               </div>
            </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
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
