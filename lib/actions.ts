"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod"; // For validation
import { prisma } from "./db"; // Import Prisma client
import bcrypt from "bcryptjs"; // Import bcryptjs
// Import mock data functions (Exam and Invigilator)
// Import updated/renamed functions and types from data layer
import {
    addExam, updateExam, deleteExam,
    getPotentialInvigilators, // Renamed from getInvigilators
    addUser, updateUser, deleteUser, // Renamed from add/update/deleteInvigilator
    // Types needed for actions:
    type AddExamInput, type UpdateExamInput, type AddUserData, type UpdateUserData
} from "./data";
// Import Prisma types directly as the re-exported ones in data.ts might change
import type { User as PrismaUser, Exam as PrismaExam } from "@prisma/client";

// --- Schemas for Validation ---

// Schema for adding/editing an exam (adjust based on actual form fields)
// Updated schema to match AddExamInput structure and current DB schema
const ExamSchema = z.object({
    examId: z.string().optional(), // Optional for add, used in update
    subject: z.string().min(1, "Subject is required"), // Renamed from courseCode/courseName
    departmentId: z.string().min(1, "Department ID is required"), // Use departmentId
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"), // Stricter date format
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM"), // Stricter time format
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:MM"), // Stricter time format
    difficulty: z.coerce.number().int().optional(), // Optional fields from schema
    coefficient: z.coerce.number().int().optional(),
    isDuplicate: z.boolean().optional(),
    roomIds: z.array(z.string()).min(1, "At least one room ID is required"), // Expecting array of room IDs
    invigilatorUserIds: z.array(z.string()).min(1, "At least one invigilator user ID is required"), // Expecting array of user IDs
});

// --- Server Actions ---

export async function addExamAction(formData: FormData) {
    // Extract data according to the NEW schema fields
    const dataToValidate = {
        subject: formData.get('subject'),
        departmentId: formData.get('departmentId'),
        examDate: formData.get('examDate'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        difficulty: formData.get('difficulty') ? parseInt(formData.get('difficulty') as string, 10) : undefined,
        coefficient: formData.get('coefficient') ? parseInt(formData.get('coefficient') as string, 10) : undefined,
        isDuplicate: formData.get('isDuplicate') === 'on', // Checkbox handling
        roomIds: formData.getAll('roomIds'), // Expecting multiple room IDs
        invigilatorUserIds: formData.getAll('invigilatorUserIds'), // Expecting multiple user IDs
    };

    // Validate against the new schema (omit examId for add)
    const validatedFields = ExamSchema.omit({ examId: true }).safeParse(dataToValidate);

    if (!validatedFields.success) {
        console.error("Validation Error (Add Exam):", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed. Could not add exam.",
        };
    }

    try {
        // Pass the validated data structure matching AddExamInput
        await addExam(validatedFields.data);
    } catch (error) {
        console.error("Database Error (Add Exam):", error);
        return { message: "Database error. Failed to add exam." };
    }

    // Revalidate the path to show the new exam
    revalidatePath("/admin/exams");

    return { message: "Exam added successfully." };
}

export async function updateExamAction(examId: string, formData: FormData) {
     // Extract data according to the NEW schema fields
     const dataToValidate = {
        subject: formData.get('subject'),
        departmentId: formData.get('departmentId'),
        examDate: formData.get('examDate'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        difficulty: formData.get('difficulty') ? parseInt(formData.get('difficulty') as string, 10) : undefined,
        coefficient: formData.get('coefficient') ? parseInt(formData.get('coefficient') as string, 10) : undefined,
        isDuplicate: formData.get('isDuplicate') === 'on',
        roomIds: formData.getAll('roomIds'),
        invigilatorUserIds: formData.getAll('invigilatorUserIds'),
    };

    // Validate against the new schema (omit examId as it's passed separately)
    const validatedFields = ExamSchema.omit({ examId: true }).safeParse(dataToValidate);

     if (!validatedFields.success) {
        console.error("Validation Error (Update Exam):", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed. Could not update exam.",
        };
    }

    try {
        // Call updateExam with a single object matching UpdateExamInput
        const result = await updateExam({
            examId: examId, // Include the examId here
            ...validatedFields.data // Spread the rest of the validated data
        });
        if (!result) {
             return { message: "Exam not found. Failed to update." };
        }
    } catch (error) {
        console.error("Database Error (Update Exam):", error);
        return { message: "Database error. Failed to update exam." };
    }

    // Revalidate the path
    revalidatePath("/admin/exams");
     // Optionally revalidate specific exam page if exists: revalidatePath(`/admin/exams/${examId}`);

    return { message: "Exam updated successfully." };
}


export async function deleteExamAction(examId: string) {
    if (!examId) {
        return { message: "Invalid Exam ID." };
    }
    try {
        const success = await deleteExam(examId);
        if (!success) {
            return { message: "Exam not found. Failed to delete." };
        }
    } catch (error) {
        console.error("Database Error (Delete Exam):", error);
        return { message: "Database error. Failed to delete exam." };
    }

    // Revalidate the path
    revalidatePath("/admin/exams");

    return { message: "Exam deleted successfully." };
}

// Action to fetch potential invigilators (users) for dropdowns
export async function getInvigilatorOptionsAction() {
    try {
        // Fetch users who can be invigilators
        const users = await getPotentialInvigilators();
        // Return userId and name for options
        return users.map(user => ({ value: user.userId, label: user.name ?? user.email })); // Use userId and name/email
    } catch (error) {
        console.error("Database Error (Get Invigilators):", error);
        return []; // Return empty array on error
    }
}
// --- User Schema (Previously Invigilator) ---
// Updated schema to reflect User model fields
const UserSchema = z.object({
    userId: z.string().optional(), // Optional for add
    name: z.string().optional(), // Name is optional in schema
    email: z.string().email("Invalid email address"),
    // phone is not on User model
    departmentId: z.string().optional(), // departmentId is optional
    // status is not on User model (use isActive)
    isActive: z.boolean().optional(),
    // Role needs to be handled - maybe set default or require from form?
    // Password validation is handled separately (e.g., changePasswordAction)
});


// --- User Server Actions (Previously Invigilator) ---

// Renamed action
export async function addUserAction(formData: FormData) {
    // Data for creating a User
    const dataToValidate = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        department: formData.get('department'),
    };

    // Validate against UserSchema (omit userId, isActive)
    const validatedFields = UserSchema.omit({ userId: true, isActive: true }).safeParse(dataToValidate);

    if (!validatedFields.success) {
        console.error("Validation Error (Add User):", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed. Could not add invigilator.",
        };
    }

    try {
        // Pass only the validated data needed for addInvigilator
        // Pass validated data to addUser
        // Need to determine role - default or from form? Assuming ADMIN/ENSEIGNANT for now
        // Password needs hashing here!
        const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || "password", 10); // Example: Use a default or require from form
        await addUser({
            ...validatedFields.data,
            password: hashedPassword, // Add hashed password
            role: 'ENSEIGNANT' // Example: Set default role, adjust as needed
        });
    } catch (error) {
        console.error("Database Error (Add User):", error);
        // Return specific error message if available (e.g., unique constraint)
        return { message: error instanceof Error ? error.message : "Database error. Failed to add invigilator." };
    }

    revalidatePath("/admin/invigilators"); // Path might need update if UI changes
    return { message: "User added successfully." };
}

// Renamed action - invigilatorId is now userId
export async function updateUserAction(userId: string, formData: FormData) {
    // Data for updating a User
    const dataToValidate = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        department: formData.get('department'),
        status: formData.get('status'), // Include status if it's editable via form
    };

    // Validate against UserSchema (omit userId)
    const validatedFields = UserSchema.omit({ userId: true }).safeParse(dataToValidate);

     if (!validatedFields.success) {
        console.error("Validation Error (Update User):", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed. Could not update invigilator.",
        };
    }

    try {
        // Pass validated data directly to updateUser (password excluded)
        const result = await updateUser(userId, validatedFields.data); // Pass validated data directly
        if (!result) {
             return { message: "User not found. Failed to update." };
        }
    } catch (error) {
        console.error("Database Error (Update Invigilator):", error);
        // Return specific error message if available
        return { message: error instanceof Error ? error.message : "Database error. Failed to update invigilator." };
    }

    revalidatePath("/admin/invigilators"); // Path might need update
    // Optionally revalidate specific user page: revalidatePath(`/admin/invigilators/${userId}`);
    return { message: "User updated successfully." };
}

// Renamed action - invigilatorId is now userId
export async function deleteUserAction(userId: string) {
    if (!userId) {
        return { message: "Invalid User ID." };
    }
    try {
        const success = await deleteUser(userId);
        if (!success) {
            // The data function returns false if user not found
             return { message: "User not found. Failed to delete." };
        }
    } catch (error) {
        console.error("Database Error (Delete Invigilator):", error);
        // Return specific error message if available (e.g., assignment constraint)
        return { message: error instanceof Error ? error.message : "Database error. Failed to delete user." };
    }

    revalidatePath("/admin/invigilators"); // Path might need update
    return { message: "User deleted successfully." };
}
// --- Logout Action ---

export async function logoutAction() {
  try {
    // Clear the authentication cookie
    const cookieStore = await cookies();
    cookieStore.delete("auth-session");
    // No need to return anything specific, but could return success status
    // Revalidation isn't strictly necessary here as middleware handles redirection
  } catch (error) {
    console.error("Logout Error:", error);
    // Handle potential errors during cookie deletion
    return { message: "Logout failed." };
  }
  // Redirect is handled client-side after calling this action
}

// --- Profile Actions ---

// Schema for password change validation
const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long")
    // Add more complex regex if needed based on UI hints (uppercase, number, special char)
    .regex(/[A-Z]/, "Must include at least one uppercase letter")
    .regex(/[0-9]/, "Must include at least one number")
    .regex(/[^A-Za-z0-9]/, "Must include at least one special character"),
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"], // Attach error to the confirmation field
});


export async function changePasswordAction(formData: FormData) {
  // 1. Get User ID from session
  const cookieStore = await cookies(); // Await the cookies() function
  const session = cookieStore.get("auth-session")?.value;
  if (!session) {
    return { success: false, message: "Authentication required." };
  }
  const { userId } = JSON.parse(session);
  if (!userId) {
     return { success: false, message: "Invalid session." };
  }

  // 2. Validate form data
  const validationResult = PasswordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validationResult.success) {
    console.error("Password Change Validation Error:", validationResult.error.flatten().fieldErrors);
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
      message: "Validation failed. Please check the password requirements.",
    };
  }

  const { currentPassword, newPassword } = validationResult.data;

  try {
    // 3. Fetch user using correct ID field
    const user = await prisma.user.findUnique({ where: { userId: userId } }); // Use userId
    if (!user) {
      return { success: false, message: "User not found." };
    }

    // 4. Verify current password
    const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordsMatch) {
      return { success: false, message: "Incorrect current password." };
    }

    // 5. Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10); // Salt rounds = 10

    // 6. Update password in DB using correct ID field
    await prisma.user.update({
      where: { userId: userId }, // Use userId
      data: { password: hashedNewPassword },
    });

    return { success: true, message: "Password changed successfully." };

  } catch (error) {
    console.error("Password Change Database Error:", error);
    return { success: false, message: "Database error. Failed to change password." };
  }
}