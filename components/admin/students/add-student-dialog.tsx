"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { addStudentAction } from "@/lib/actions"; // Import the server action
import { Loader2 } from "lucide-react";

// Zod schema for the form, matching the AddStudentSchema in actions.ts
const AddStudentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  program: z.string().min(1, "Program is required"), // Making program required in the form
});

type AddStudentFormData = z.infer<typeof AddStudentFormSchema>;

interface AddStudentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentAdded: () => void; // Callback to refresh data after adding
}

export function AddStudentDialog({ isOpen, onOpenChange, onStudentAdded }: AddStudentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddStudentFormData>({
    resolver: zodResolver(AddStudentFormSchema),
  });

  const onSubmit = async (data: AddStudentFormData) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("program", data.program);

    try {
      const result = await addStudentAction(formData);

      if (result.message.includes("successfully")) {
        toast({
          title: "Success",
          description: result.message,
        });
        onStudentAdded(); // Trigger data refresh
        reset(); // Reset form fields
        onOpenChange(false); // Close dialog
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to add student:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog is closed/opened
  useState(() => {
      if (!isOpen) {
          reset();
      }
  });


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" {...register("name")} className="col-span-3" />
            {errors.name && <p className="col-span-4 text-red-500 text-xs">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" {...register("email")} className="col-span-3" />
             {errors.email && <p className="col-span-4 text-red-500 text-xs">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input id="password" type="password" {...register("password")} className="col-span-3" />
             {errors.password && <p className="col-span-4 text-red-500 text-xs">{errors.password.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="program" className="text-right">
              Program
            </Label>
            <Input id="program" {...register("program")} className="col-span-3" />
             {errors.program && <p className="col-span-4 text-red-500 text-xs">{errors.program.message}</p>}
          </div>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => reset()}>Cancel</Button>
             </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}