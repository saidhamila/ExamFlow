"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"; // Import redirect
import { cookies } from "next/headers";
import { z } from "zod"; // For validation
import { prisma } from "./db"; // Import Prisma client
import bcrypt from "bcryptjs"; // Import bcryptjs
// Import mock data functions (Exam and Invigilator)
// Import updated/renamed functions and types from data layer
import {
getExams, // Import the updated getExams
    // Import necessary types for the new action
    type ExamFilters, type PaginationOptions, type PaginatedExamsResult,
    addExam, updateExam, deleteExam,
    getPotentialInvigilators, // Renamed from getInvigilators
    addUser, updateUser, deleteUser, // Renamed from add/update/deleteInvigilator
    // Types needed for actions:
    type AddExamInput, type UpdateExamInput, type AddUserData, type UpdateUserData,
    // Department data functions
    addDepartment, updateDepartment, deleteDepartment, getDepartments,
    // Room data functions (to be added in data.ts)
    addRoom, updateRoom, deleteRoom, getRooms,
    // Exam duplication function
    duplicateExam,
    // Validation function
    recordValidation,
    // Notification function (needed for prioritization)
    getNotifications, type Notification // Import getNotifications and Notification type
} from "./data";
// Import Prisma types directly as the re-exported ones in data.ts might change
import type { User as PrismaUser, Exam as PrismaExam, Department, Room } from "@prisma/client"; // Added Room
import { ValidationStatus, UserRole } from "@prisma/client"; // Import enum for validation action & UserRole
// Local types are defined and exported below, no need to import them here
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import Gemini AI SDK

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

// --- Server Action for fetching filtered/paginated exams ---
export async function getFilteredPaginatedExamsAction(
    filters: ExamFilters,
    pagination: PaginationOptions
): Promise<PaginatedExamsResult> {
    try {
        // Directly call the updated data fetching function
        const result = await getExams(filters, pagination);
        return result;
    } catch (error) {
        console.error("Database Error (Get Filtered/Paginated Exams Action):", error);
        // Return a default structure on error to avoid breaking the client
        return {
            exams: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: pagination.page ?? 1
        };
    }
}
// --- Exam Duplication Action ---

export async function duplicateExamAction(originalExamId: string) {
    if (!originalExamId) {
        return { success: false, message: "Invalid Exam ID provided for duplication." };
    }

    try {
        // Assuming duplicateExam exists in lib/data.ts
        const duplicatedExam = await duplicateExam(originalExamId);
        // Revalidate the path to show the new duplicated exam
        revalidatePath("/admin/exams");
        return { success: true, message: `Exam "${duplicatedExam.subject}" duplicated successfully.` };

    } catch (error) {
        console.error("Database Error (Duplicate Exam Action):", error);
        return { success: false, message: error instanceof Error ? error.message : "Database error. Failed to duplicate exam." };
    }
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
    password: z.string().min(6, "Password must be at least 6 characters"), // Add password validation
    // phone is not on User model
    departmentId: z.string().optional(), // departmentId is optional
    // status is not on User model (use isActive)
    isActive: z.boolean().optional(),
    // Role needs to be handled - maybe set default or require from form?
});


// --- User Server Actions (Previously Invigilator) ---

// Renamed action
export async function addUserAction(formData: FormData) {
    // Data for creating a User
    const dataToValidate = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'), // Get password from form
        departmentId: formData.get('departmentId'), // Use departmentId
    };

    // Validate against UserSchema (omit userId, isActive)
    // Note: phone and department are not in UserSchema and will be ignored by safeParse
    const validatedFields = UserSchema.omit({ userId: true, isActive: true }).safeParse(dataToValidate);

    if (!validatedFields.success) {
        console.error("Validation Error (Add User):", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed. Could not add user.",
        };
    }

    try {
        // Pass validated data to addUser
        // Need to determine role - default or from form? Assuming ENSEIGNANT for now
        // Password needs hashing here!
        // Hash the validated password from the form
        const hashedPassword = await bcrypt.hash(validatedFields.data.password, 10);
        await addUser({
            name: validatedFields.data.name,
            email: validatedFields.data.email,
            departmentId: validatedFields.data.departmentId,
            password: hashedPassword, // Pass the correctly hashed password
            role: UserRole.ENSEIGNANT // Example: Set default role, adjust as needed
        });
    } catch (error) {
        console.error("Database Error (Add User):", error);
        // Return specific error message if available (e.g., unique constraint)
        return { message: error instanceof Error ? error.message : "Database error. Failed to add user." };
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
        departmentId: formData.get('departmentId'), // Use departmentId
        isActive: formData.get('isActive') === 'on', // Handle checkbox for isActive
    };

    // Validate against UserSchema (omit userId)
    const validatedFields = UserSchema.omit({ userId: true }).safeParse(dataToValidate);

     if (!validatedFields.success) {
        console.error("Validation Error (Update User):", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed. Could not update user.",
        };
    }

    try {
        // Pass validated data directly to updateUser (password excluded)
        const result = await updateUser(userId, validatedFields.data); // Pass validated data directly
        if (!result) {
             return { message: "User not found. Failed to update." };
        }
    } catch (error) {
        console.error("Database Error (Update User):", error);
        // Return specific error message if available
        return { message: error instanceof Error ? error.message : "Database error. Failed to update user." };
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
        console.error("Database Error (Delete User):", error);
        // Return specific error message if available (e.g., assignment constraint)
        return { message: error instanceof Error ? error.message : "Database error. Failed to delete user." };
    }

    revalidatePath("/admin/invigilators"); // Path might need update
    return { message: "User deleted successfully." };
}
// --- Department Schema ---
const DepartmentSchema = z.object({
    departmentId: z.string().optional(), // Optional for add
    name: z.string().min(1, "Department name is required").max(100),
    headId: z.string().optional(), // Optional: Head of Department (User ID)
});

// Define the schemas for data layer input
const AddDepartmentSchema = DepartmentSchema.omit({ departmentId: true });
const UpdateDepartmentSchema = DepartmentSchema.omit({ departmentId: true });

// Type for adding a department (used by data layer)
export type AddDepartmentData = z.infer<typeof AddDepartmentSchema>;
// Type for updating a department (used by data layer)
export type UpdateDepartmentData = z.infer<typeof UpdateDepartmentSchema>;


// --- Department Server Actions ---

export async function addDepartmentAction(formData: FormData) {
    const dataToValidate = {
        name: formData.get('name'),
        headId: formData.get('headId') || undefined, // Ensure undefined if empty
    };

    const validatedFields = DepartmentSchema.omit({ departmentId: true }).safeParse(dataToValidate);

    if (!validatedFields.success) {
        console.error("Validation Error (Add Department):", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed. Could not add department.",
        };
    }

    try {
        // Assuming addDepartment exists in lib/data.ts
        await addDepartment(validatedFields.data);
    } catch (error) {
        console.error("Database Error (Add Department):", error);
        // Handle potential unique constraint errors etc.
        return { message: error instanceof Error ? error.message : "Database error. Failed to add department." };
    }

    revalidatePath("/admin/departments"); // Adjust path if needed
    return { message: "Department added successfully." };
}

export async function updateDepartmentAction(departmentId: string, formData: FormData) {
    const dataToValidate = {
        name: formData.get('name'),
        headId: formData.get('headId') || undefined, // Ensure undefined if empty or null
    };

     // Validate against the schema (omit departmentId as it's passed separately)
    const validatedFields = DepartmentSchema.omit({ departmentId: true }).safeParse(dataToValidate);

     if (!validatedFields.success) {
        console.error("Validation Error (Update Department):", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed. Could not update department.",
        };
    }

    try {
        // Assuming updateDepartment exists in lib/data.ts
        const result = await updateDepartment(departmentId, validatedFields.data);
        if (!result) {
             return { message: "Department not found. Failed to update." };
        }
    } catch (error) {
        console.error("Database Error (Update Department):", error);
        return { message: error instanceof Error ? error.message : "Database error. Failed to update department." };
    }

    revalidatePath("/admin/departments"); // Adjust path if needed
    revalidatePath(`/admin/departments/${departmentId}`); // Revalidate specific page if exists
    return { message: "Department updated successfully." };
}


export async function deleteDepartmentAction(departmentId: string) {
    if (!departmentId) {
        return { message: "Invalid Department ID." };
    }
    try {
        // Assuming deleteDepartment exists in lib/data.ts
        const success = await deleteDepartment(departmentId);
        if (!success) {
            return { message: "Department not found or could not be deleted (check dependencies)." };
        }
    } catch (error) {
        console.error("Database Error (Delete Department):", error);
         // Handle potential foreign key constraint errors
        return { message: error instanceof Error ? error.message : "Database error. Failed to delete department." };
    }

    revalidatePath("/admin/departments"); // Adjust path if needed
    return { message: "Department deleted successfully." };
}

// Action to fetch departments for dropdowns/selects
export async function getDepartmentOptionsAction() {
    try {
        // Assuming getDepartments exists in lib/data.ts
        const departments: Department[] = await getDepartments(); // Fetch all departments and type them
        return departments.map(dept => ({ value: dept.departmentId, label: dept.name }));
    } catch (error) {
        console.error("Database Error (Get Departments):", error);
        return []; // Return empty array on error
    }
}

// --- Room Schema ---
const RoomSchema = z.object({
    roomId: z.string().optional(), // Optional for add
    roomName: z.string().min(1, "Room name/number is required").max(50),
    capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
    location: z.string().max(100).optional(),
    isAvailable: z.boolean().optional(), // Handled by default in DB? Or set via form?
});

// Define the schemas for data layer input
const AddRoomSchema = RoomSchema.omit({ roomId: true });
const UpdateRoomSchema = RoomSchema.omit({ roomId: true });

// Types for data layer
export type AddRoomData = z.infer<typeof AddRoomSchema>;
export type UpdateRoomData = z.infer<typeof UpdateRoomSchema>;


// --- Room Server Actions ---

export async function addRoomAction(formData: FormData) {
    const dataToValidate = {
        roomName: formData.get('roomName'),
        capacity: formData.get('capacity'), // Will be coerced by Zod
        location: formData.get('location') || undefined,
        isAvailable: formData.get('isAvailable') === 'on', // Handle checkbox
    };

    // Validate (omit roomId, isAvailable might be optional depending on form)
    const validatedFields = RoomSchema.omit({ roomId: true }).safeParse(dataToValidate);

    if (!validatedFields.success) {
        console.error("Validation Error (Add Room):", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed. Could not add room.",
        };
    }

    try {
        // Assuming addRoom exists in lib/data.ts
        await addRoom(validatedFields.data);
    } catch (error) {
        console.error("Database Error (Add Room):", error);
        return { message: error instanceof Error ? error.message : "Database error. Failed to add room." };
    }

    revalidatePath("/admin/rooms"); // Adjust path if needed
    return { message: "Room added successfully." };
}

export async function updateRoomAction(roomId: string, formData: FormData) {
    const dataToValidate = {
        roomName: formData.get('roomName'),
        capacity: formData.get('capacity'), // Coerced by Zod
        location: formData.get('location') || undefined,
        isAvailable: formData.get('isAvailable') === 'on', // Handle checkbox
    };

    // Validate (omit roomId)
    const validatedFields = RoomSchema.omit({ roomId: true }).safeParse(dataToValidate);

     if (!validatedFields.success) {
        console.error("Validation Error (Update Room):", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed. Could not update room.",
        };
    }

    try {
        // Assuming updateRoom exists in lib/data.ts
        const result = await updateRoom(roomId, validatedFields.data);
        if (!result) {
             return { message: "Room not found. Failed to update." };
        }
    } catch (error) {
        console.error("Database Error (Update Room):", error);
        return { message: error instanceof Error ? error.message : "Database error. Failed to update room." };
    }

    revalidatePath("/admin/rooms"); // Adjust path if needed
    revalidatePath(`/admin/rooms/${roomId}`); // Revalidate specific page if exists
    return { message: "Room updated successfully." };
}


// Define a more structured return type for the action
interface DeleteRoomActionResult {
  success: boolean;
  message: string;
  errorType?: 'assignments_exist' | 'not_found' | 'database_error' | 'invalid_id';
  details?: {
    examCount: number;
    invigilatorCount: number;
  };
}

export async function deleteRoomAction(roomId: string): Promise<DeleteRoomActionResult> { // Add return type
    if (!roomId) {
        // Return structured error for invalid ID
        return { success: false, message: "Invalid Room ID provided.", errorType: 'invalid_id' };
    }
    try {
        // Assuming deleteRoom exists in lib/data.ts and might throw specific errors
        // We expect deleteRoom to return true on success, false if not found,
        // or throw an error for constraints or other DB issues.
        const result = await deleteRoom(roomId); // deleteRoom should ideally handle not found

        // If deleteRoom returns false (meaning not found), handle it
        if (result === false) {
             return { success: false, message: "Room not found.", errorType: 'not_found' };
        }

        // If deleteRoom returns true or doesn't return (implicitly success if no error)
        revalidatePath("/admin/rooms"); // Adjust path if needed
        return { success: true, message: "Room deleted successfully." };

    } catch (error) {
        console.error("Database Error (Delete Room):", error);

        // Check if it's the specific assignment error
        if (error instanceof Error && error.message.startsWith("Cannot delete room") && error.message.includes("assigned to")) {
            // Attempt to parse counts from the error message (this is fragile, ideally data layer provides this)
            const match = error.message.match(/assigned to (\d+) exams and (\d+) invigilator assignments/);
            const examCount = match ? parseInt(match[1], 10) : 0;
            const invigilatorCount = match ? parseInt(match[2], 10) : 0;

            return {
                success: false,
                message: error.message, // Keep original DB message for logging/debugging
                errorType: 'assignments_exist',
                details: { examCount, invigilatorCount }
            };
        }

        // Handle other potential errors (e.g., generic DB error)
        return {
            success: false,
            message: error instanceof Error ? error.message : "An unexpected database error occurred.",
            errorType: 'database_error'
         };
    }
}

// Action to fetch rooms for dropdowns/selects
export async function getRoomOptionsAction() {
    try {
        // Assuming getRooms exists in lib/data.ts
        const rooms = await getRooms(); // Fetch all rooms
        return rooms.map((room: Room) => ({ // Add explicit type here
            value: room.roomId,
            label: `${room.roomName} (Cap: ${room.capacity})`
        }));
    } catch (error) {
        console.error("Database Error (Get Rooms):", error);
        return []; // Return empty array on error
    }
}


// --- Validation Action ---

// Schema for validation input (updated for useFormState and data layer)
const ValidationSchema = z.object({
    examId: z.string().min(1, "Exam ID is required."),
    validatedBy: z.string().min(1, "Validator User ID is required."), // Renamed from userId
    status: z.nativeEnum(ValidationStatus, { errorMap: () => ({ message: "Invalid validation status." }) }),
    comments: z.string().optional(),
});

// Refactored for useFormState
export async function recordValidationAction(prevState: any, formData: FormData) {
    // 1. Get current user ID (replace placeholder if needed)
    const session = await getCurrentUserSession();
    if (!session) {
        return { success: false, message: "User not authenticated.", errors: {} };
    }
    const userId = session.userId;

    // 2. Extract data from formData
    const status = formData.get('status') as ValidationStatus; // Assuming 'status' is passed from form
    const comments = formData.get('comments') as string | undefined;
    const examId = formData.get('examId') as string; // Assuming 'examId' is passed from form

    // 3. Prepare data for validation
    const validationData = {
        examId: examId,
        validatedBy: userId, // Use the logged-in user's ID
        status: status,
        comments: comments,
    };

    // 4. Validate
    const validatedFields = ValidationSchema.safeParse(validationData);

    if (!validatedFields.success) {
        console.error("Validation Error (Record Validation):", validatedFields.error.flatten().fieldErrors);
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed. Could not record validation.",
        };
    }

    try {
        // 5. Call data layer function with validated data
        await recordValidation(validatedFields.data); // Pass validated data matching RecordValidationInput
        // Revalidate relevant paths (e.g., exam details page, validation dashboard)
        revalidatePath(`/admin/exams/${validatedFields.data.examId}`); // Use validated examId
        // Add other paths like chef/directeur dashboards if needed
        revalidatePath('/chef/dashboard');
        revalidatePath('/directeur/dashboard');

        return { success: true, message: `Validation status set to ${status}.` };

    } catch (error) {
        console.error("Database Error (Record Validation):", error);
        return { success: false, message: error instanceof Error ? error.message : "Database error. Failed to record validation." };
    }
}


// --- Logout Action ---
export async function logoutAction() {
    // Clear the session cookie by setting its expiration date to the past
    // Standard usage for Server Actions
    // @ts-ignore // Suppress incorrect TS error about 'set' not existing
    cookies().set("auth-session", "", { expires: new Date(0), path: '/' }); // Use the correct cookie name
    // Optionally, perform other cleanup like invalidating tokens in DB

    // Redirect immediately to the login page
    console.log("User logged out, session cookie cleared. Redirecting...");
    // Remove revalidatePath as redirect handles navigation
    redirect('/');
    // Note: Code after redirect() is usually not executed in Server Actions
}


// --- Change Password Action ---

const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ["confirmPassword"], // Path of error
});


export async function changePasswordAction(formData: FormData) {
    // 1. Get current user ID (replace with your actual session logic)
    // Standard usage for Server Actions
    // @ts-ignore // Suppress incorrect TS error about 'get' not existing
    const userId = cookies().get("userId")?.value; // Example: Get user ID from cookie
    if (!userId) {
        return { success: false, message: "User not authenticated." };
    }

    // 2. Validate form data
    const validatedFields = ChangePasswordSchema.safeParse({
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword'),
    });

    if (!validatedFields.success) {
        console.error("Validation Error (Change Password):", validatedFields.error.flatten().fieldErrors);
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed. Could not change password.",
        };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    try {
        // 3. Fetch user from DB
        const user = await prisma.user.findUnique({ where: { userId } });
        if (!user || !user.password) {
            return { success: false, message: "User not found or password not set." };
        }

        // 4. Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return { success: false, message: "Incorrect current password." };
        }

        // 5. Hash new password
        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        // 6. Update user password in DB
        await prisma.user.update({
            where: { userId },
            data: { password: newHashedPassword },
        });

        return { success: true, message: "Password changed successfully." };

    } catch (error) {
        console.error("Database Error (Change Password):", error);
        return { success: false, message: "Database error. Failed to change password." };
    }
}


// --- Gemini Notification Prioritization ---

// Placeholder: Replace with your actual function to get user session/info
async function getCurrentUserSession(): Promise<{ userId: string; role: UserRole } | null> {
  // This is a placeholder. Implement your logic to get the logged-in user's ID and role.
  // Example using cookies or a session library:
  // const session = await getSession(); // Your auth library's method
  // if (!session?.user?.id || !session?.user?.role) return null;
  // return { userId: session.user.id, role: session.user.role as UserRole };

  // For demonstration, returning a mock user (replace this)
  console.warn("Using mock user session in getPrioritizedNotifications. Replace with actual auth logic.");
  // Example: Fetch user based on cookie, session, etc.
  // const userIdFromCookie = cookies().get('userId')?.value;
  // if (!userIdFromCookie) return null;
  // const user = await prisma.user.findUnique({ where: { userId: userIdFromCookie }});
  // if (!user) return null;
  // return { userId: user.userId, role: user.role };

  // Hardcoded example (REMOVE IN PRODUCTION)
   return { userId: "clvxbk4h1000010k2h4j7f8e9", role: UserRole.ENSEIGNANT }; // Example Invigilator
  // return { userId: "some-student-id", role: UserRole.ETUDIANT }; // Example Student
}

export async function getPrioritizedNotifications(): Promise<Notification[]> {
  console.log("Attempting to prioritize notifications...");
  const session = await getCurrentUserSession();
  if (!session) {
    console.log("No user session found, returning default notifications.");
    return getNotifications(); // Return default if no user
  }

  const { userId, role } = session;
  const rawNotifications = await getNotifications();

  if (rawNotifications.length === 0) {
    console.log("No notifications to prioritize.");
    return [];
  }

  // --- Fetch Context Based on Role ---
  let contextInfo = "";
  try {
    if (role === UserRole.ENSEIGNANT) { // Assuming ENSEIGNANT is Invigilator role
      const assignedExams = await prisma.invigilator.findMany({
        where: { userId: userId },
        include: { exam: true },
        orderBy: { exam: { startTime: 'asc' } },
      });
      if (assignedExams.length > 0) {
        contextInfo = "User is an Invigilator. Assigned Exams:\n" +
          assignedExams.map(inv => `- ${inv.exam.subject} on ${inv.exam.examDate.toISOString().split('T')[0]} at ${inv.exam.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (ID: ${inv.examId})`).join("\n");
      } else {
        contextInfo = "User is an Invigilator but has no assigned exams in the relevant timeframe.";
      }
    } else if (role === UserRole.ETUDIANT) { // Assuming ETUDIANT is Student role
      // Fetch upcoming exams relevant to the student (e.g., all upcoming, or by department if available)
      // For simplicity, let's use the same upcoming exams logic as getNotifications for now
       const upcomingExams = await prisma.exam.findMany({
            where: {
                startTime: { gte: new Date() }
                // Potentially filter by student's department if user model has departmentId
            },
            orderBy: { startTime: 'asc' },
            take: 10 // Limit context size
       });
        if (upcomingExams.length > 0) {
            contextInfo = "User is a Student. Upcoming Exams:\n" +
                upcomingExams.map(exam => `- ${exam.subject} on ${exam.examDate.toISOString().split('T')[0]} at ${exam.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (ID: ${exam.examId})`).join("\n");
        } else {
             contextInfo = "User is a Student. No upcoming exams found.";
        }
    } else {
         contextInfo = `User role: ${role}. No specific context generated for this role.`;
    }
  } catch (error) {
      console.error("Error fetching context for prioritization:", error);
      contextInfo = "Could not fetch user-specific context.";
  }


  // --- Call Gemini API ---
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set. Returning default notifications.");
    return rawNotifications;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Or your preferred model

    const notificationsString = rawNotifications.map(n => `ID: ${n.id}, Title: ${n.title}, Description: ${n.description}`).join("\n---\n");

    const prompt = `
      Given the following list of notifications and user context, prioritize them.
      Return ONLY a JSON array containing the notification IDs (strings) sorted from highest priority to lowest priority.
      Do not include any other text, explanations, or markdown formatting.

      User Context:
      ${contextInfo}

      Notifications:
      ${notificationsString}

      Prioritized JSON Array of IDs:
    `;

    console.log("Sending prompt to Gemini for prioritization...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log("Gemini raw response:", text);

    // --- Parse Response and Reorder ---
    try {
      // Clean the response: remove potential markdown backticks and whitespace
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      const prioritizedIds: string[] = JSON.parse(cleanedText);

      if (!Array.isArray(prioritizedIds) || prioritizedIds.some(id => typeof id !== 'string')) {
          throw new Error("Parsed response is not an array of strings.");
      }

      console.log("Successfully parsed prioritized IDs:", prioritizedIds);

      // Create a map for quick lookup
      const notificationMap = new Map(rawNotifications.map(n => [n.id, n]));
      const prioritizedNotifications: Notification[] = [];

      // Add notifications in the order received from Gemini
      prioritizedIds.forEach(id => {
        const notification = notificationMap.get(id);
        if (notification) {
          prioritizedNotifications.push(notification);
          notificationMap.delete(id); // Remove from map to track remaining
        } else {
            console.warn(`Gemini returned an unknown notification ID: ${id}`);
        }
      });

      // Add any remaining notifications (not prioritized by Gemini) at the end
      prioritizedNotifications.push(...notificationMap.values());

      console.log(`Returning ${prioritizedNotifications.length} prioritized notifications.`);
      return prioritizedNotifications;

    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON array of IDs:", parseError);
      console.log("Returning default notification order.");
      return rawNotifications; // Return original order on parsing failure
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    console.log("Returning default notification order due to API error.");
    return rawNotifications; // Return original order on API error
  }
}