import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { prisma } from './db';
// Import UserRole enum along with other types
import type { Exam as PrismaExam, Invigilator as PrismaInvigilatorAssignment, User as PrismaUser, Room as PrismaRoom, Department as PrismaDepartment, ExamRoom as PrismaExamRoom, Validation as PrismaValidation } from '@prisma/client'; // Renamed Validation to PrismaValidation to avoid conflict
import { ValidationStatus, UserRole } from '@prisma/client'; // Added UserRole enum import
import type { AddDepartmentData, UpdateDepartmentData } from './actions'; // Types from actions.ts
import type { AddRoomData, UpdateRoomData } from './actions'; // Import Room action types
import { addDays, startOfDay, endOfDay, subDays, formatDistanceToNowStrict, parse, format } from 'date-fns'; // Added format

// --- Type Definitions based on current schema ---

// Define a more detailed Department type including relations fetched
export type DepartmentWithDetails = PrismaDepartment & {
  head: PrismaUser | null;
  _count: {
    users: number;
    exams: number;
  };
};

// Define a detailed Room type including booking count
export type RoomWithBookingCount = PrismaRoom & {
  _count: {
    examRooms: number;
  };
};

// Represents an Exam with its assigned invigilators (User details included) and rooms
// Added validations relation
export type ExamWithDetails = PrismaExam & {
  invigilators: (PrismaInvigilatorAssignment & { user: PrismaUser | null, room: PrismaRoom | null })[];
  examRooms: (PrismaExamRoom & { room: PrismaRoom | null })[];
  department: PrismaDepartment | null;
  validations: PrismaValidation[]; // Include validations
};

// Represents an Invigilator Assignment (Junction Table Record) with User details
export type InvigilatorAssignmentWithUser = PrismaInvigilatorAssignment & {
    user: PrismaUser | null;
};

// Input data for creating a new Exam (from actions)
export type AddExamInput = {
  subject: string;
  departmentId: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  difficulty?: number;
  coefficient?: number;
  isDuplicate?: boolean;
  roomIds: string[];
  invigilatorUserIds: string[]; // User IDs of invigilators
};

// Input data for updating an Exam
export type UpdateExamInput = Partial<AddExamInput> & { examId: string };

// Input data for creating a User (who might be an invigilator)
export type AddUserData = {
    name?: string;
    email: string;
    password?: string; // Password handling should be secure (hashing in actions)
    role: UserRole; // Use the actual UserRole enum from schema
    departmentId?: string;
    isActive?: boolean;
};

// Input data for updating a User
export type UpdateUserData = Partial<Omit<AddUserData, 'password'>>; // Exclude password from update type

// Input data for creating an Invigilator Assignment
export type AddInvigilatorAssignmentInput = {
    userId: string;
    examId: string;
    roomId: string;
};

// --- Data Fetching Functions ---

// Define types for filters and pagination options
export type ExamFilters = {
  subject?: string;
  dateRange?: string; // e.g., 'this-week', 'next-week', 'this-month'
  departmentId?: string;
  roomId?: string;
  invigilatorId?: string;
};

export type PaginationOptions = {
  page?: number;
  limit?: number;
};

// Define the return type for the optimized function
export type PaginatedExamsResult = {
  exams: ExamWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

// Updated getExams function
export async function getExams(
  filters: ExamFilters = {},
  pagination: PaginationOptions = { page: 1, limit: 10 }
): Promise<PaginatedExamsResult> {
  console.log("Fetching exams from DB with filters/pagination...", { filters, pagination });
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 10;
  const skip = (page - 1) * limit;

  // Construct WHERE clause based on filters
  const whereClause: Prisma.ExamWhereInput = {};

  if (filters.subject && filters.subject !== 'all') {
    // Using contains for partial matching, adjust if exact match needed
    whereClause.subject = { contains: filters.subject, mode: 'insensitive' };
  }
  if (filters.departmentId && filters.departmentId !== 'all') {
    whereClause.departmentId = filters.departmentId;
  }
  if (filters.roomId && filters.roomId !== 'all') {
    whereClause.examRooms = { some: { roomId: filters.roomId } };
  }
  if (filters.invigilatorId && filters.invigilatorId !== 'all') {
    whereClause.invigilators = { some: { userId: filters.invigilatorId } };
  }

  // Date Range Filtering
  if (filters.dateRange && filters.dateRange !== 'all') {
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);

      if (filters.dateRange === 'this-week') {
          const startOfWeek = new Date(today);
          startOfWeek.setUTCDate(today.getUTCDate() - today.getUTCDay()); // Start of current week (Sunday)
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 7); // End of current week (next Sunday)
          whereClause.examDate = { gte: startOfWeek, lt: endOfWeek };
      } else if (filters.dateRange === 'next-week') {
          const startOfNextWeek = new Date(today);
          startOfNextWeek.setUTCDate(today.getUTCDate() - today.getUTCDay() + 7); // Start of next week
          const endOfNextWeek = new Date(startOfNextWeek);
          endOfNextWeek.setUTCDate(startOfNextWeek.getUTCDate() + 7); // End of next week
          whereClause.examDate = { gte: startOfNextWeek, lt: endOfNextWeek };
      } else if (filters.dateRange === 'this-month') {
          const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
          const endOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
          whereClause.examDate = { gte: startOfMonth, lt: endOfMonth };
      }
      // Add more date ranges as needed
  }


  try {
    // Fetch total count matching filters first
    const totalCount = await prisma.exam.count({ where: whereClause });

    // Fetch paginated data
    const exams = await prisma.exam.findMany({
      where: whereClause,
      include: { // Include necessary relations
        department: true,
        examRooms: {
          include: { room: true }
        },
        invigilators: {
          include: {
              user: true, // Select only necessary user fields if needed
              room: true
          }
        },
        validations: true // Include validations
      },
      orderBy: [ // Default sort order, can be parameterized too
        { examDate: 'asc' },
        { startTime: 'asc' },
      ],
      skip: skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);
    console.log(`Fetched ${exams.length} exams (Page ${page}/${totalPages}, Total ${totalCount}).`);

    return {
        exams,
        totalCount,
        totalPages,
        currentPage: page
    };
  } catch (error) {
    console.error("Database Error (getExams):", error);
    throw new Error("Failed to fetch exams.");
  }
}

// Fetches Invigilator *Assignments* (junction records), optionally with User details
export async function getInvigilatorAssignments(includeUser: boolean = false): Promise<PrismaInvigilatorAssignment[] | InvigilatorAssignmentWithUser[]> {
   console.log("Fetching invigilator assignments from DB...");
   try {
    const assignments = await prisma.invigilator.findMany({
       include: {
           user: includeUser, // Conditionally include user details
       },
       orderBy: {
         createdAt: 'asc',
       },
    });
     console.log(`Fetched ${assignments.length} invigilator assignments.`);
    return assignments;
  } catch (error) {
    console.error("Database Error (getInvigilatorAssignments):", error);
    throw new Error("Failed to fetch invigilator assignments.");
  }
}

// Fetches Users who can be invigilators (e.g., based on role)
export async function getPotentialInvigilators(): Promise<PrismaUser[]> {
    console.log("Fetching potential invigilator users...");
    try {
        const users = await prisma.user.findMany({
            where: {
                role: UserRole.ENSEIGNANT, // Use actual role from your UserRole enum
                isActive: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        console.log(`Fetched ${users.length} potential invigilators.`);
        return users;
    } catch (error) {
        console.error("Database Error (getPotentialInvigilators):", error);
        throw new Error("Failed to fetch potential invigilators.");
    }
}


// Mock function for recent activity
export async function getRecentActivity(limit: number = 5): Promise<any[]> {
  console.log(`Fetching mock recent activity (limit: ${limit})...`);
  // TODO: Implement using ScheduleLog model
  return [];
}

export async function getUpcomingExams(days: number = 7): Promise<PrismaExam[]> { // Return basic Exam list
   console.log(`Fetching upcoming exams for next ${days} days...`);
   try {
    const now = new Date();
    const futureDate = addDays(now, days);

    const exams = await prisma.exam.findMany({
      where: {
        examDate: {
          gte: startOfDay(now), // From the beginning of today
          lte: endOfDay(futureDate), // To the end of the target day
        },
      },
      orderBy: [
        { examDate: 'asc' },
        { startTime: 'asc' },
      ]
    });
     console.log(`Fetched ${exams.length} upcoming exams.`);
    return exams;
  } catch (error) {
    console.error("Database Error (getUpcomingExams):", error);
    throw new Error("Failed to fetch upcoming exams.");
  }
}

export async function getExamById(id: string): Promise<ExamWithDetails | null> { // Return detailed type
  console.log(`Fetching exam by ID: ${id}`);
  try {
    const exam = await prisma.exam.findUnique({
      where: { examId: id },
      include: {
        invigilators: {
            include: {
                user: true,
                room: true,
            }
        },
        examRooms: {
            include: {
                room: true
            }
        },
        department: true,
        validations: true // Include validations
      },
    });
    if (exam) {
      console.log(`Found exam: ${exam.subject}`);
      return exam;
    } else {
      console.log(`Exam with ID ${id} not found.`);
      return null;
    }
  } catch (error) {
    console.error(`Database Error (getExamById - ${id}):`, error);
    return null; // Return null on error to avoid breaking UI potentially
  }
}


export async function getDashboardStats() {
   console.log("Fetching dashboard stats...");
   try {
    const now = new Date();
    const upcomingExamsCount = await prisma.exam.count({
       where: {
        examDate: {
          gte: startOfDay(now),
          lte: endOfDay(addDays(now, 7)), // Next 7 days
        },
      },
    });

    const totalExams = await prisma.exam.count();

    const activeInvigilators = await prisma.user.count({
        where: {
            role: UserRole.ENSEIGNANT, // Use the enum member
            isActive: true,
        }
    });

    const totalDepartments = await prisma.department.count();

     console.log("Fetched dashboard stats.");
    return {
      totalExams,
      activeInvigilators,
      upcomingExamsCount,
      totalDepartments,
      examChange: "+?", // Placeholder
      invigilatorChange: "+?", // Placeholder
    };
  } catch (error) {
    console.error("Database Error (getDashboardStats):", error);
    throw new Error("Failed to fetch dashboard stats.");
  }
}


export async function getInvigilatorStatsData() {
   console.log("Fetching invigilator stats data...");
   try {
       const potentialInvigilatorCount = await prisma.user.count({
           where: { role: UserRole.ENSEIGNANT, isActive: true } // Use the enum member
       });

       const assignedInvigilatorIds = await prisma.invigilator.findMany({
           select: { userId: true },
           distinct: ['userId']
       });
       const assignedCount = assignedInvigilatorIds.length;

       const availableCount = potentialInvigilatorCount - assignedCount;

       console.log("Fetched simplified invigilator stats data.");
       return [
         { name: "Potential", value: potentialInvigilatorCount, color: "#10b981" },
         { name: "Assigned", value: assignedCount, color: "#3b82f6" },
       ];
   } catch (error) {
    console.error("Database Error (getInvigilatorStatsData):", error);
    throw new Error("Failed to fetch invigilator stats.");
   }
}


// --- Data Mutation Functions ---

// Helper to parse time string (HH:MM) relative to a date
function parseTimeString(date: Date, timeString: string): Date {
    try {
        const [hours, minutes] = timeString.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours, minutes, 0, 0);
        return newDate;
    } catch (e) {
        console.error("Error parsing time string:", timeString);
        throw new Error(`Invalid time format: ${timeString}. Expected HH:MM.`);
    }
}

export async function addExam(examData: AddExamInput): Promise<PrismaExam> {
  console.log("Adding exam to DB:", examData);
  try {
    const dateOnly = parse(examData.examDate, 'yyyy-MM-dd', new Date());
    const startTime = parseTimeString(dateOnly, examData.startTime);
    const endTime = parseTimeString(dateOnly, examData.endTime);

    if (endTime <= startTime) {
        throw new Error("End time must be after start time.");
    }

    const newExam = await prisma.$transaction(async (tx) => {
        const createdExam = await tx.exam.create({
          data: {
            subject: examData.subject,
            examDate: startOfDay(dateOnly),
            startTime: startTime,
            endTime: endTime,
            difficulty: examData.difficulty,
            coefficient: examData.coefficient,
            isDuplicate: examData.isDuplicate ?? false,
            department: {
              connect: { departmentId: examData.departmentId }
            },
          },
        });

        if (examData.roomIds && examData.roomIds.length > 0) {
            await tx.examRoom.createMany({
                data: examData.roomIds.map(roomId => ({
                    examId: createdExam.examId,
                    roomId: roomId,
                }))
            });
        }

        if (examData.invigilatorUserIds && examData.invigilatorUserIds.length > 0 && examData.roomIds && examData.roomIds.length > 0) {
            const invigilatorAssignments = examData.roomIds.flatMap(roomId =>
                examData.invigilatorUserIds.map(userId => ({
                    examId: createdExam.examId,
                    userId: userId,
                    roomId: roomId,
                }))
            );
            if (invigilatorAssignments.length > 0) {
                await tx.invigilator.createMany({
                    data: invigilatorAssignments,
                    skipDuplicates: true,
                });
            }
        }
        return createdExam;
    });

    console.log("Added exam:", newExam.examId);
    return newExam;
  } catch (error) {
    console.error("Database Error (addExam):", error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new Error("Failed to add exam: Invalid Department, Room, or Invigilator ID provided.");
    }
    throw new Error(`Failed to add exam: ${error instanceof Error ? error.message : String(error)}`);
  }
}


export async function updateExam(examData: UpdateExamInput): Promise<PrismaExam | null> {
  console.log("Updating exam in DB:", examData.examId, examData);
   try {
     let dateOnly: Date | undefined = undefined;
     let startTime: Date | undefined = undefined;
     let endTime: Date | undefined = undefined;

     if (examData.examDate) {
         dateOnly = parse(examData.examDate, 'yyyy-MM-dd', new Date());
     }
     if (examData.startTime && dateOnly) {
         startTime = parseTimeString(dateOnly, examData.startTime);
     }
     if (examData.endTime && dateOnly) {
         endTime = parseTimeString(dateOnly, examData.endTime);
     }

     if (startTime && endTime && endTime <= startTime) {
         throw new Error("End time must be after start time.");
     }

     const updatedExam = await prisma.$transaction(async (tx) => {
         const examToUpdate = await tx.exam.update({
           where: { examId: examData.examId },
           data: {
             subject: examData.subject,
             examDate: dateOnly ? startOfDay(dateOnly) : undefined,
             startTime: startTime,
             endTime: endTime,
             difficulty: examData.difficulty,
             coefficient: examData.coefficient,
             isDuplicate: examData.isDuplicate,
             department: examData.departmentId ? {
               connect: { departmentId: examData.departmentId }
             } : undefined,
           },
         });

         if (examData.roomIds) {
             await tx.examRoom.deleteMany({ where: { examId: examData.examId } });
             if (examData.roomIds.length > 0) {
                 await tx.examRoom.createMany({
                     data: examData.roomIds.map(roomId => ({
                         examId: examData.examId,
                         roomId: roomId,
                     }))
                 });
             }
         }

         if (examData.invigilatorUserIds !== undefined) {
             await tx.invigilator.deleteMany({ where: { examId: examData.examId } });
             if (Array.isArray(examData.invigilatorUserIds) && examData.invigilatorUserIds.length > 0 &&
                 Array.isArray(examData.roomIds) && examData.roomIds.length > 0)
             {
                 const invigilatorAssignments = examData.roomIds.flatMap(roomId =>
                     examData.invigilatorUserIds!.map(userId => ({
                         examId: examData.examId,
                         userId: userId,
                         roomId: roomId,
                     }))
                 );
                 if (invigilatorAssignments.length > 0) {
                     await tx.invigilator.createMany({
                         data: invigilatorAssignments,
                         skipDuplicates: true,
                     });
                 }
             }
         }
         return examToUpdate;
     });

     console.log("Updated exam:", updatedExam.examId);
     return updatedExam;
   } catch (error) {
     console.error("Database Error (updateExam):", error);
     if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
         return null;
     }
     throw new Error(`Failed to update exam: ${error instanceof Error ? error.message : String(error)}`);
   }
}

export async function deleteExam(examId: string): Promise<boolean> {
   console.log("Deleting exam from DB:", examId);
   try {
    // Relations should cascade delete based on schema rules
    await prisma.exam.delete({
      where: { examId: examId },
    });
    console.log("Deleted exam:", examId);
    return true;
  } catch (error) {
    console.error("Database Error (deleteExam):", error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
    }
    throw new Error("Failed to delete exam.");
  }
}

// --- Exam Duplication Function ---

export async function duplicateExam(originalExamId: string): Promise<PrismaExam> {
    console.log(`Duplicating exam: ${originalExamId}`);
    try {
        const originalExam = await prisma.exam.findUnique({
            where: { examId: originalExamId },
            include: {
                examRooms: true,
                invigilators: true,
                department: true,
            },
        });

        if (!originalExam) {
            throw new Error(`Original exam with ID ${originalExamId} not found.`);
        }
        if (!originalExam.department) {
            throw new Error(`Original exam ${originalExamId} is missing department information.`);
        }

        const newExam = await prisma.$transaction(async (tx) => {
            const duplicatedExam = await tx.exam.create({
                data: {
                    subject: `${originalExam.subject} (Copy)`,
                    examDate: originalExam.examDate,
                    startTime: originalExam.startTime,
                    endTime: originalExam.endTime,
                    difficulty: originalExam.difficulty,
                    coefficient: originalExam.coefficient,
                    isDuplicate: true,
                    department: {
                        connect: { departmentId: originalExam.department.departmentId }
                    },
                },
            });

            if (originalExam.examRooms.length > 0) {
                await tx.examRoom.createMany({
                    data: originalExam.examRooms.map(er => ({
                        examId: duplicatedExam.examId,
                        roomId: er.roomId,
                    }))
                });
            }

            if (originalExam.invigilators.length > 0) {
                await tx.invigilator.createMany({
                    data: originalExam.invigilators.map(inv => ({
                        examId: duplicatedExam.examId,
                        userId: inv.userId,
                        roomId: inv.roomId,
                    })),
                    skipDuplicates: true,
                });
            }

            return duplicatedExam;
        });

        console.log(`Successfully duplicated exam ${originalExamId} as ${newExam.examId}`);
        return newExam;

    } catch (error) {
        console.error(`Database Error (duplicateExam - ${originalExamId}):`, error);
        throw new Error(`Failed to duplicate exam: ${error instanceof Error ? error.message : String(error)}`);
    }
}


// --- Validation Functions ---

// Fetch exams needing validation by a specific Chef de Département
export async function getExamsForChefValidation(chefUserId: string): Promise<ExamWithDetails[]> {
    console.log(`Fetching exams for Chef validation (User ID: ${chefUserId})`);
    try {
        const user = await prisma.user.findUnique({
            where: { userId: chefUserId, role: UserRole.CHEF },
            select: { departmentId: true }
        });

        if (!user || !user.departmentId) {
            console.warn(`User ${chefUserId} is not a Chef or has no assigned department.`);
            return [];
        }
        const departmentId = user.departmentId;

        // Fetch exams for the department, including the latest validation
        const exams = await prisma.exam.findMany({
            where: {
                departmentId: departmentId,
            },
            include: {
                department: true,
                examRooms: { include: { room: true } },
                invigilators: { include: { user: true, room: true } },
                validations: { // Include validations to check status
                    // Remove orderBy, rely on filtering logic below
                    take: 1 // Take the most recent one (Prisma doesn't guarantee which without orderBy)
                           // If strict latest is needed, fetch all and sort in code, or add createdAt to Validation model
                }
            },
            orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
        });

        // Filter exams: Needs validation if no validation exists OR the latest is EN_ATTENTE
        const examsNeedingChefValidation = exams.filter(exam => {
            const latestValidation = exam.validations[0];
            // Assuming CHEF validates if status is EN_ATTENTE (initial state)
            return !latestValidation || latestValidation.status === ValidationStatus.EN_ATTENTE;
        });

        console.log(`Found ${examsNeedingChefValidation.length} exams needing Chef validation for department ${departmentId}.`);
        return examsNeedingChefValidation;

    } catch (error) {
        console.error(`Database Error (getExamsForChefValidation - ${chefUserId}):`, error);
        throw new Error("Failed to fetch exams for Chef validation.");
    }
}

// Fetch exams needing validation by a specific Directeur des Études
export async function getExamsForDirecteurValidation(directeurUserId: string): Promise<ExamWithDetails[]> {
     console.log(`Fetching exams for Directeur validation (User ID: ${directeurUserId})`);
    try {
        // Fetch all exams with their latest validation record
        const allExams = await prisma.exam.findMany({
            include: {
                department: true,
                examRooms: { include: { room: true } },
                invigilators: { include: { user: true, room: true } },
                validations: {
                    // Remove orderBy
                    take: 1 // Get *a* validation record
                }
            },
            orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
        });

        // Filter for exams where the latest validation status is VALIDÉ (by Chef)
        // Assuming Directeur validates after Chef approves (status becomes VALIDÉ)
        const examsNeedingValidation = allExams.filter(exam => {
            const latestValidation = exam.validations[0];
            // Directeur validates if Chef has set status to VALIDÉ
            // This assumes a 2-step process: EN_ATTENTE -> VALIDÉ (Chef) -> VALIDÉ (Directeur)
            // Or maybe EN_ATTENTE -> VALIDÉ (Chef) -> EN_ATTENTE (Directeur) -> VALIDÉ (Directeur)?
            // Let's assume Directeur validates exams marked VALIDÉ by Chef for now.
            // This might need refinement based on exact workflow.
            return latestValidation?.status === ValidationStatus.VALIDÉ; // Check if Chef approved
        });


        console.log(`Found ${examsNeedingValidation.length} exams needing Directeur validation.`);
        return examsNeedingValidation;

    } catch (error) {
        console.error(`Database Error (getExamsForDirecteurValidation - ${directeurUserId}):`, error);
        throw new Error("Failed to fetch exams for Directeur validation.");
    }
}


// Input type for recording validation
type RecordValidationInput = {
    examId: string;
    validatedBy: string; // User ID of the validator
    status: ValidationStatus; // Use the correct enum
    comments?: string;
};

// Record a validation step (Chef or Directeur)
export async function recordValidation(data: RecordValidationInput): Promise<PrismaValidation> {
    console.log("Recording validation:", data);
    try {
        // Logic might need adjustment based on the exact workflow.
        // If a Chef approves, status becomes VALIDÉ.
        // If a Directeur approves, status remains VALIDÉ (or maybe a final status?).
        // If anyone refuses, status becomes REFUSÉ.

        // Create or update validation? Let's assume create new record for audit trail.
        const validation = await prisma.validation.create({
            data: {
                examId: data.examId,
                validatedBy: data.validatedBy, // Correct field name
                status: data.status, // Use the status passed in (VALIDÉ or REFUSÉ)
                comments: data.comments,
                validationDate: new Date(), // Set validation date when action is taken
            }
        });

        console.log(`Validation recorded for exam ${data.examId} with status ${data.status}`);
        return validation;

    } catch (error) {
        console.error("Database Error (recordValidation):", error);
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
            throw new Error("Failed to record validation: Invalid Exam ID or User ID provided.");
        }
        throw new Error(`Failed to record validation: ${error instanceof Error ? error.message : String(error)}`);
    }
}


// --- User Management Functions (Previously Invigilator) ---

export async function addUser(userData: AddUserData): Promise<PrismaUser> {
  console.log("Adding user to DB:", userData.email, userData.role);
  try {
    if (!userData.password) {
        throw new Error("Password is required to add a user.");
    }
    const newUser = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: userData.password, // Assume already hashed
        role: userData.role,
        department: userData.departmentId ? {
          connect: { departmentId: userData.departmentId }
        } : undefined,
        isActive: userData.isActive ?? true,
      },
    });
    console.log("Added user:", newUser.userId);
    return newUser;
  } catch (error) {
    console.error("Database Error (addUser):", error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new Error(`Failed to add user: Email '${userData.email}' already exists.`);
    }
     if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new Error("Failed to add user: Invalid Department ID provided.");
    }
    throw new Error(`Failed to add user: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function updateUser(userId: string, userData: UpdateUserData): Promise<PrismaUser | null> {
  console.log("Updating user in DB:", userId, userData);
  try {
    // Exclude departmentId if handling relation via connect/disconnect
    const { departmentId, ...dataToUpdate } = userData;

    const updatedUser = await prisma.user.update({
      where: { userId: userId },
      data: {
        ...dataToUpdate, // Spread fields like name, email, role, isActive
        department: departmentId !== undefined ? { // Handle department connection/disconnection
            connect: departmentId ? { departmentId: departmentId } : undefined,
            disconnect: !departmentId ? true : undefined, // Disconnect if departmentId is null or empty string
        } : undefined, // If departmentId is not in userData, don't change connection
      },
    });
    console.log("Updated user:", updatedUser.userId);
    return updatedUser;
  } catch (error) {
    console.error("Database Error (updateUser):", error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
    }
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new Error(`Failed to update user: Email '${userData.email}' already exists.`);
    }
    throw new Error(`Failed to update user: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
   console.log("Deleting user from DB:", userId);
   try {
    await prisma.$transaction(async (tx) => {
        await tx.invigilator.deleteMany({
            where: { userId: userId }
        });
        await tx.validation.deleteMany({
            where: { validatedBy: userId } // Correct field name
        });
        await tx.department.updateMany({
            where: { headId: userId },
            data: { headId: null }
        });
        // Delete student profile if exists
        await tx.student.deleteMany({
            where: { userId: userId }
        });
        // Delete notifications for the user
         await tx.notification.deleteMany({
            where: { userId: userId }
        });
         // Delete logs by the user
         await tx.scheduleLog.deleteMany({
            where: { performedBy: userId }
        });
        // Now delete the user
        await tx.user.delete({
          where: { userId: userId },
        });
    });

    console.log("Deleted user and related records:", userId);
    return true;
  } catch (error) {
    console.error("Database Error (deleteUser):", error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
    }
    throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- Department Functions ---

export async function getDepartments(): Promise<DepartmentWithDetails[]> {
    console.log("Fetching departments from DB...");
    try {
        const departments = await prisma.department.findMany({
            include: {
                head: true,
                _count: {
                    select: { users: true, exams: true },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
        console.log(`Fetched ${departments.length} departments.`);
        return departments;
    } catch (error) {
        console.error("Database Error (getDepartments):", error);
        throw new Error("Failed to fetch departments.");
    }
}

export async function getDepartmentById(id: string): Promise<PrismaDepartment | null> {
    console.log(`Fetching department by ID: ${id}`);
    try {
        const department = await prisma.department.findUnique({
            where: { departmentId: id },
             include: { head: true },
        });
        if (department) {
            console.log(`Found department: ${department.name}`);
        } else {
            console.log(`Department with ID ${id} not found.`);
        }
        return department;
    } catch (error) {
        console.error(`Database Error (getDepartmentById - ${id}):`, error);
        throw new Error("Failed to fetch department.");
    }
}


export async function addDepartment(data: AddDepartmentData): Promise<PrismaDepartment> {
    console.log("Adding department to DB:", data.name);
    try {
        const newDepartment = await prisma.department.create({
            data: {
                name: data.name,
                head: data.headId ? { connect: { userId: data.headId } } : undefined,
            },
        });
        console.log("Added department:", newDepartment.departmentId);
        return newDepartment;
    } catch (error) {
        console.error("Database Error (addDepartment):", error);
         if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error(`Failed to add department: Name '${data.name}' already exists.`);
        }
        throw new Error(`Failed to add department: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function updateDepartment(id: string, data: UpdateDepartmentData): Promise<PrismaDepartment | null> {
    console.log("Updating department in DB:", id, data);
    try {
        const updatedDepartment = await prisma.department.update({
            where: { departmentId: id },
            data: {
                name: data.name,
                head: data.headId !== undefined ? {
                    connect: data.headId ? { userId: data.headId } : undefined,
                    disconnect: !data.headId ? true : undefined,
                } : undefined,
            },
        });
        console.log("Updated department:", updatedDepartment.departmentId);
        return updatedDepartment;
    } catch (error) {
        console.error("Database Error (updateDepartment):", error);
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return null;
        }
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error(`Failed to update department: Name '${data.name}' already exists.`);
        }
        throw new Error(`Failed to update department: ${error instanceof Error ? error.message : String(error)}`);
    }
}


export async function deleteDepartment(id: string): Promise<boolean> {
    console.log("Deleting department from DB:", id);
    try {
        const relatedCounts = await prisma.department.findUnique({
            where: { departmentId: id },
            select: { _count: { select: { users: true, exams: true } } }
        });

        if (relatedCounts && (relatedCounts._count.users > 0 || relatedCounts._count.exams > 0)) {
            throw new Error(`Cannot delete department '${id}' as it has ${relatedCounts._count.users} associated users and ${relatedCounts._count.exams} associated exams.`);
        }

        await prisma.department.delete({
            where: { departmentId: id },
        });
        console.log("Deleted department:", id);
        return true;
    } catch (error) {
        console.error("Database Error (deleteDepartment):", error);
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return false;
        }
        if (error instanceof Error && error.message.startsWith("Cannot delete department")) {
            throw error;
        }
        throw new Error(`Failed to delete department: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// --- Room Functions ---

export async function getRooms(): Promise<RoomWithBookingCount[]> {
    console.log("Fetching rooms from DB...");
    try {
        const rooms = await prisma.room.findMany({
             include: {
                _count: {
                    select: { examRooms: true },
                },
            },
            orderBy: {
                roomName: 'asc',
            },
        });
        console.log(`Fetched ${rooms.length} rooms.`);
        return rooms;
    } catch (error) {
        console.error("Database Error (getRooms):", error);
        throw new Error("Failed to fetch rooms.");
    }
}

export async function getRoomById(id: string): Promise<PrismaRoom | null> {
    console.log(`Fetching room by ID: ${id}`);
    try {
        const room = await prisma.room.findUnique({
            where: { roomId: id },
             include: {
                 examRooms: { include: { exam: true } },
                 invigilators: { include: { exam: true, user: true } }
             }
        });
        if (room) {
            console.log(`Found room: ${room.roomName}`);
        } else {
            console.log(`Room with ID ${id} not found.`);
        }
        return room;
    } catch (error) {
        console.error(`Database Error (getRoomById - ${id}):`, error);
        throw new Error("Failed to fetch room.");
    }
}


export async function addRoom(data: AddRoomData): Promise<PrismaRoom> {
    console.log("Adding room to DB:", data.roomName);
    try {
        const newRoom = await prisma.room.create({
            data: {
                roomName: data.roomName,
                capacity: data.capacity,
                location: data.location,
                isAvailable: data.isAvailable ?? true,
            },
        });
        console.log("Added room:", newRoom.roomId);
        return newRoom;
    } catch (error) {
        console.error("Database Error (addRoom):", error);
         if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error(`Failed to add room: Name '${data.roomName}' already exists.`);
        }
        throw new Error(`Failed to add room: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function updateRoom(id: string, data: UpdateRoomData): Promise<PrismaRoom | null> {
    console.log("Updating room in DB:", id, data);
    try {
        const updatedRoom = await prisma.room.update({
            where: { roomId: id },
            data: {
                roomName: data.roomName,
                capacity: data.capacity,
                location: data.location,
                isAvailable: data.isAvailable,
            },
        });
        console.log("Updated room:", updatedRoom.roomId);
        return updatedRoom;
    } catch (error) {
        console.error("Database Error (updateRoom):", error);
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return null;
        }
         if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error(`Failed to update room: Name '${data.roomName}' already exists.`);
        }
        throw new Error(`Failed to update room: ${error instanceof Error ? error.message : String(error)}`);
    }
}


export async function deleteRoom(id: string): Promise<boolean> {
    console.log("Deleting room from DB:", id);
    try {
        const relatedCounts = await prisma.room.findUnique({
            where: { roomId: id },
            select: { _count: { select: { examRooms: true, invigilators: true } } }
        });

        if (relatedCounts && (relatedCounts._count.examRooms > 0 || relatedCounts._count.invigilators > 0)) {
             throw new Error(`Cannot delete room '${id}' as it is assigned to ${relatedCounts._count.examRooms} exams and ${relatedCounts._count.invigilators} invigilator assignments.`);
        }

        await prisma.room.delete({
            where: { roomId: id },
        });
        console.log("Deleted room:", id);
        return true;
    } catch (error) {
        console.error("Database Error (deleteRoom):", error);
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return false;
        }
        if (error instanceof Error && error.message.startsWith("Cannot delete room")) {
            throw error;
        }
        throw new Error(`Failed to delete room: ${error instanceof Error ? error.message : String(error)}`);
    }
}


// --- Invigilator Assignment Functions ---

export async function addInvigilatorAssignment(assignmentData: AddInvigilatorAssignmentInput): Promise<PrismaInvigilatorAssignment> {
    console.log("Adding invigilator assignment:", assignmentData);
    try {
        // Use the correct compound unique key structure
        const existing = await prisma.invigilator.findUnique({
            where: {
                userId_examId_roomId: {
                    userId: assignmentData.userId,
                    examId: assignmentData.examId,
                    roomId: assignmentData.roomId,
                }
            }
        });
        if (existing) {
            console.warn("Invigilator assignment already exists:", assignmentData);
            return existing;
        }

        const newAssignment = await prisma.invigilator.create({
            data: assignmentData,
        });
        console.log("Added invigilator assignment:", newAssignment.invigilatorId);
        return newAssignment;
    } catch (error) {
        console.error("Database Error (addInvigilatorAssignment):", error);
         if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
            throw new Error("Failed to add assignment: Invalid Exam ID, User ID, or Room ID provided.");
        }
        throw new Error(`Failed to add invigilator assignment: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function deleteInvigilatorAssignment(assignmentId: string): Promise<boolean> {
    console.log("Deleting invigilator assignment:", assignmentId);
    try {
        await prisma.invigilator.delete({
            where: { invigilatorId: assignmentId },
        });
        console.log("Deleted invigilator assignment:", assignmentId);
        return true;
    } catch (error) {
        console.error("Database Error (deleteInvigilatorAssignment):", error);
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            return false;
        }
        throw new Error(`Failed to delete invigilator assignment: ${error instanceof Error ? error.message : String(error)}`);
    }
}


// --- Chart Data Functions ---

export async function getExamDistributionData() {
    console.log("Fetching exam distribution data...");
    try {
        const distribution = await prisma.exam.groupBy({
            by: ['departmentId'],
            _count: {
                examId: true,
            },
            orderBy: {
                _count: {
                    examId: 'desc',
                },
            },
        });

        const departmentIds = distribution.map(item => item.departmentId).filter((id): id is string => id !== null);
        const departments = await prisma.department.findMany({
            where: { departmentId: { in: departmentIds } },
            select: { departmentId: true, name: true },
        });
        const departmentMap = new Map(departments.map(dept => [dept.departmentId, dept.name]));

        console.log("Fetched exam distribution data.");
        return distribution.map(item => ({
            name: departmentMap.get(item.departmentId ?? '') ?? 'Unknown Dept',
            value: item._count.examId,
        }));
    } catch (error) {
        console.error("Database Error (getExamDistributionData):", error);
        throw new Error("Failed to fetch exam distribution data.");
    }
}

export async function getInvigilatorWorkloadData() {
     console.log("Fetching invigilator workload data...");
    try {
        const workload = await prisma.invigilator.groupBy({
            by: ['userId'],
            _count: {
                invigilatorId: true,
            },
             orderBy: {
                _count: {
                    invigilatorId: 'desc',
                },
            },
            take: 10,
        });

        const userIds = workload.map(item => item.userId);
        const users = await prisma.user.findMany({
            where: { userId: { in: userIds } },
            select: { userId: true, name: true, email: true },
        });
        const userMap = new Map(users.map(user => [user.userId, user.name ?? user.email]));

        console.log("Fetched invigilator workload data.");
        return workload.map(item => ({
            name: userMap.get(item.userId) ?? 'Unknown User',
            value: item._count.invigilatorId,
        }));
    } catch (error) {
        console.error("Database Error (getInvigilatorWorkloadData):", error);
        throw new Error("Failed to fetch invigilator workload data.");
    }
}


export async function getRoomUtilizationData() {
    console.log("Fetching room utilization data...");
    try {
        const utilization = await prisma.examRoom.groupBy({
            by: ['roomId'],
            _count: {
                examId: true,
            },
             orderBy: {
                _count: {
                    examId: 'desc',
                },
            },
             take: 10,
        });

        const roomIds = utilization.map(item => item.roomId);
        const rooms = await prisma.room.findMany({
            where: { roomId: { in: roomIds } },
            select: { roomId: true, roomName: true },
        });
        const roomMap = new Map(rooms.map(room => [room.roomId, room.roomName]));

        console.log("Fetched room utilization data.");
        const utilizationCounts = utilization.map(item => ({
            name: roomMap.get(item.roomId) ?? 'Unknown Room',
            value: item._count.examId,
        }));

        return utilizationCounts;

    } catch (error) {
        console.error("Database Error (getRoomUtilizationData):", error);
        throw new Error("Failed to fetch room utilization data.");
    }
}


// --- Notification Function ---

export type Notification = {
    id: string;
    title: string;
    description: string;
    timeAgo: string;
    read: boolean;
};

export async function getNotifications(): Promise<Notification[]> {
    console.log("Fetching notification data...");
    try {
        const now = new Date();
        const twentyFourHoursLater = addDays(now, 1);
        const twentyFourHoursAgo = subDays(now, 1);

        const relevantExams = await prisma.exam.findMany({
            where: {
                OR: [
                    {
                        startTime: {
                            gte: now,
                            lte: twentyFourHoursLater,
                        }
                    },
                    {
                        endTime: {
                            gte: twentyFourHoursAgo,
                            lte: now,
                        }
                    }
                ]
            },
            include: { department: true },
            orderBy: { startTime: 'asc' }
        });

        const notifications: Notification[] = [];

        relevantExams.forEach(exam => {
            const timeDiff = formatDistanceToNowStrict(exam.startTime > now ? exam.startTime : exam.endTime, { addSuffix: true });
            const isUpcoming = exam.startTime > now;

            notifications.push({
                id: `exam-${exam.examId}-${isUpcoming ? 'start' : 'end'}`,
                title: isUpcoming ? `Exam Starting Soon: ${exam.subject}` : `Exam Ended: ${exam.subject}`,
                description: `Department: ${exam.department?.name ?? 'N/A'}. ${isUpcoming ? `Starts` : `Ended`} ${timeDiff}.`,
                timeAgo: timeDiff,
                read: false,
            });
        });

        console.log(`Generated ${notifications.length} notifications.`);
        return notifications;

    } catch (error) {
        console.error("Database Error (getNotifications):", error);
        return [];
    }
}