"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // For isActive status
import { useToast } from "@/hooks/use-toast";
import { updateStudentAction } from "@/lib/actions"; // Import the server action
import type { StudentWithDetails } from "@/lib/data";
import { Loader2 } from "lucide-react";

// Zod schema for the form, matching UpdateStudentSchema in actions.ts (password optional)
const EditStudentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  program: z.string().min(1, "Program is required"),
  isActive: z.boolean().optional(),
  // Password update could be handled in a separate form/action if desired
});

type EditStudentFormData = z.infer<typeof EditStudentFormSchema>;

interface EditStudentDialogProps {
  student: StudentWithDetails | null; // Pass the student to edit
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentUpdated: () => void; // Callback to refresh data after updating
}

export function EditStudentDialog({ student, isOpen, onOpenChange, onStudentUpdated }: EditStudentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch, // Add watch here
    formState: { errors },
  } = useForm<EditStudentFormData>({
    resolver: zodResolver(EditStudentFormSchema),
    defaultValues: {
      name: student?.name ?? "",
      email: student?.email ?? "",
      program: student?.studentProfile?.program ?? "",
      isActive: student?.isActive ?? true,
    },
  });

  // Update form default values when the student prop changes
  useEffect(() => {
    if (student) {
      reset({
        name: student.name ?? "",
        email: student.email ?? "",
        program: student.studentProfile?.program ?? "",
        isActive: student.isActive ?? true,
      });
    }
  }, [student, reset]);


  const onSubmit = async (data: EditStudentFormData) => {
    if (!student) return; // Should not happen if dialog is open with a student

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("program", data.program);
    formData.append("isActive", data.isActive ? "on" : "off"); // Convert boolean to form value

    try {
      const result = await updateStudentAction(student.userId, formData);

      if (result.message.includes("successfully")) {
        toast({
          title: "Success",
          description: result.message,
        });
        onStudentUpdated(); // Trigger data refresh
        onOpenChange(false); // Close dialog
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update student:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

   // Reset form when dialog is closed
   useEffect(() => {
    if (!isOpen) {
      // Reset to default values based on potentially updated student prop
       reset({
        name: student?.name ?? "",
        email: student?.email ?? "",
        program: student?.studentProfile?.program ?? "",
        isActive: student?.isActive ?? true,
      });
    }
  }, [isOpen, reset, student]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        {student ? (
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input id="edit-name" {...register("name")} className="col-span-3" />
              {errors.name && <p className="col-span-4 text-red-500 text-xs">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input id="edit-email" type="email" {...register("email")} className="col-span-3" />
              {errors.email && <p className="col-span-4 text-red-500 text-xs">{errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-program" className="text-right">
                Program
              </Label>
              <Input id="edit-program" {...register("program")} className="col-span-3" />
              {errors.program && <p className="col-span-4 text-red-500 text-xs">{errors.program.message}</p>}
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-isActive" className="text-right">
                Active
              </Label>
               <Switch
                 id="edit-isActive"
                 checked={watch("isActive")} // Watch the value for controlled component
                 onCheckedChange={(checked) => setValue("isActive", checked)} // Update form state on change
                 className="col-span-3"
               />
              {errors.isActive && <p className="col-span-4 text-red-500 text-xs">{errors.isActive.message}</p>}
            </div>
            <DialogFooter>
               <DialogClose asChild>
                 <Button type="button" variant="outline">Cancel</Button>
               </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <p>Loading student data...</p> // Placeholder if student data isn't loaded yet
        )}
      </DialogContent>
    </Dialog>
  );
}

// Removed incorrect import statement from here