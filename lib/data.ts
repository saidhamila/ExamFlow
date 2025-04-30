import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { prisma } from './db';
import type { Exam as PrismaExam, Invigilator as PrismaInvigilatorAssignment, User as PrismaUser, Room as PrismaRoom, Department as PrismaDepartment, ExamRoom as PrismaExamRoom } from '@prisma/client';
import { addDays, startOfDay, endOfDay, subDays, formatDistanceToNowStrict, parse } from 'date-fns';

// --- Type Definitions based on current schema ---

// Represents an Exam with its assigned invigilators (User details included) and rooms
export type ExamWithDetails = PrismaExam & {
  invigilators: (PrismaInvigilatorAssignment & { user: PrismaUser | null, room: PrismaRoom | null })[];
  examRooms: (PrismaExamRoom & { room: PrismaRoom | null })[];
  department: PrismaDepartment | null; // Include department details if needed
};

// Represents an Invigilator Assignment (Junction Table Record) with User details
export type InvigilatorAssignmentWithUser = PrismaInvigilatorAssignment & {
    user: PrismaUser | null;
};

// Input data for creating a new Exam (from actions)
// Needs adjustment based on how rooms and invigilators are handled
export type AddExamInput = {
  subject: string;
  departmentId: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  difficulty?: number;
  coefficient?: number;
  isDuplicate?: boolean;
  // How are rooms and invigilators passed? Assuming arrays of IDs for now
  roomIds: string[];
  invigilatorUserIds: string[]; // User IDs of invigilators
};

// Input data for updating an Exam
export type UpdateExamInput = Partial<AddExamInput> & { examId: string };

// Input data for creating a User (who might be an invigilator)
// Renamed from AddInvigilatorData as it describes a User
export type AddUserData = {
    name?: string;
    email: string;
    password?: string; // Password handling should be secure (hashing in actions)
    role: UserRole; // Use the actual UserRole enum from schema
    departmentId?: string;
    isActive?: boolean;
};

// Input data for updating a User
export type UpdateUserData = Partial<AddUserData>;

// Input data for creating an Invigilator Assignment
export type AddInvigilatorAssignmentInput = {
    userId: string;
    examId: string;
    roomId: string;
};

// --- Data Fetching Functions ---

export async function getExams(): Promise<PrismaExam[]> { // Return basic Exam list for now
  console.log("Fetching exams from DB...");
  try {
    const exams = await prisma.exam.findMany({
      // Include relations if needed for the specific view (e.g., Admin table)
      // include: {
      //   invigilators: { include: { user: true, room: true } },
      //   examRooms: { include: { room: true } },
      //   department: true,
      // },
      orderBy: [
        { examDate: 'asc' },
        { startTime: 'asc' },
      ],
    });
    console.log(`Fetched ${exams.length} exams.`);
    return exams;
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
        // Adjust role based on your schema's definition for invigilators
        const users = await prisma.user.findMany({
            where: {
                // Assuming 'ENSEIGNANT' role can invigilate
                role: 'ENSEIGNANT', // Use actual role from your UserRole enum
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
        // Optional: Filter further by startTime if needed
        // startTime: { gte: now } // Only if exam hasn't started yet today
      },
      // include: { // Include details if needed by the calling component
      //   invigilators: { include: { user: true, room: true } },
      //   examRooms: { include: { room: true } },
      // },
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
      where: { examId: id }, // Use examId
      include: {
        invigilators: { // Include assignment details
            include: {
                user: true, // Include user details from assignment
                room: true, // Include room details from assignment
            }
        },
        examRooms: { // Include rooms booked for the exam
            include: {
                room: true
            }
        },
        department: true // Include department details
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
    return null;
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

    // Count active users who can invigilate (e.g., ENSEIGNANT role)
    const activeInvigilators = await prisma.user.count({
        where: {
            role: 'ENSEIGNANT', // Adjust role as needed
            isActive: true,
        }
    });

    // Fetch distinct departments from the Department table
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
   // This function's logic was based on a non-existent 'status' field.
   // Reworking based on assignments vs. potential invigilators.
   try {
       const potentialInvigilatorCount = await prisma.user.count({
           where: { role: 'ENSEIGNANT', isActive: true } // Adjust role
       });

       // Count users who have at least one assignment in the future? Or total assignments?
       // Let's count distinct users with *any* assignment for simplicity.
       const assignedInvigilatorIds = await prisma.invigilator.findMany({
           select: { userId: true },
           distinct: ['userId']
       });
       const assignedCount = assignedInvigilatorIds.length;

       // 'Available' could be potential - assigned
       const availableCount = potentialInvigilatorCount - assignedCount;
       // 'On Leave' status isn't tracked in the current schema directly on User/Invigilator.
       // Need a way to mark users as unavailable (e.g., an 'availability' field on User?).
       // Returning simplified stats for now.
       console.log("Fetched simplified invigilator stats data.");
       return [
         { name: "Potential", value: potentialInvigilatorCount, color: "#10b981" }, // Was Available
         { name: "Assigned", value: assignedCount, color: "#3b82f6" },
         // { name: "On Leave", value: 0, color: "#6b7280" }, // Cannot calculate
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
    // Parse date and times
    const dateOnly = parse(examData.examDate, 'yyyy-MM-dd', new Date());
    const startTime = parseTimeString(dateOnly, examData.startTime);
    const endTime = parseTimeString(dateOnly, examData.endTime); // Use provided endTime

    if (endTime <= startTime) {
        throw new Error("End time must be after start time.");
    }

    // Use transaction to create Exam, ExamRooms, and Invigilator assignments
    const newExam = await prisma.$transaction(async (tx) => {
        const createdExam = await tx.exam.create({
          data: {
            subject: examData.subject,
            examDate: startOfDay(dateOnly), // Store date part
            startTime: startTime, // Store full start DateTime
            endTime: endTime,     // Store full end DateTime
            difficulty: examData.difficulty,
            coefficient: examData.coefficient,
            isDuplicate: examData.isDuplicate ?? false,
            department: {
              connect: { departmentId: examData.departmentId }
            },
            // Do not connect invigilators/rooms directly here
          },
        });

        // Create ExamRoom entries
        if (examData.roomIds && examData.roomIds.length > 0) {
            await tx.examRoom.createMany({
                data: examData.roomIds.map(roomId => ({
                    examId: createdExam.examId,
                    roomId: roomId,
                }))
            });
        }

        // Create Invigilator assignment entries
        if (examData.invigilatorUserIds && examData.invigilatorUserIds.length > 0 && examData.roomIds && examData.roomIds.length > 0) {
            // Simple assignment: assign all invigilators to the first room?
            // Or requires more complex logic to specify invigilator-room pairs?
            // Assuming simple assignment to the first room for now.
            const firstRoomId = examData.roomIds[0]; // Needs better logic if multiple rooms
            await tx.invigilator.createMany({
                data: examData.invigilatorUserIds.map(userId => ({
                    examId: createdExam.examId,
                    userId: userId,
                    roomId: firstRoomId, // Assign all to the first room - adjust if needed
                }))
            });
        }
        return createdExam;
    });

    console.log("Added exam:", newExam.examId);
    // TODO: Add activity log
    return newExam;
  } catch (error) {
    console.error("Database Error (addExam):", error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        // Foreign key constraint failed (e.g., departmentId, roomId, userId doesn't exist)
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
     // If time is updated, date must also be provided for context
     if (examData.startTime && dateOnly) {
         startTime = parseTimeString(dateOnly, examData.startTime);
     }
     if (examData.endTime && dateOnly) {
         endTime = parseTimeString(dateOnly, examData.endTime);
     }

     if (startTime && endTime && endTime <= startTime) {
         throw new Error("End time must be after start time.");
     }

     // Use transaction for complex updates involving relations
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

         // Update ExamRooms (replace existing)
         if (examData.roomIds) {
             // Delete existing rooms for this exam
             await tx.examRoom.deleteMany({ where: { examId: examData.examId } });
             // Create new room assignments
             if (examData.roomIds.length > 0) {
                 await tx.examRoom.createMany({
                     data: examData.roomIds.map(roomId => ({
                         examId: examData.examId,
                         roomId: roomId,
                     }))
                 });
             }
         }

         // Update Invigilator assignments (replace existing)
         if (examData.invigilatorUserIds) {
             // Delete existing assignments for this exam
             await tx.invigilator.deleteMany({ where: { examId: examData.examId } });
             // Create new assignments (assuming simple assignment to first room again)
             if (examData.invigilatorUserIds.length > 0 && examData.roomIds && examData.roomIds.length > 0) {
                 const firstRoomId = examData.roomIds[0]; // Adjust if needed
                 await tx.invigilator.createMany({
                     data: examData.invigilatorUserIds.map(userId => ({
                         examId: examData.examId,
                         userId: userId,
                         roomId: firstRoomId,
                     }))
                 });
             }
         }
         return examToUpdate;
     });

     console.log("Updated exam:", updatedExam.examId);
     // TODO: Add activity log
     return updatedExam;
   } catch (error) {
     console.error("Database Error (updateExam):", error);
     if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
         return null; // Indicate record not found
     }
     throw new Error(`Failed to update exam: ${error instanceof Error ? error.message : String(error)}`);
   }
}

export async function deleteExam(examId: string): Promise<boolean> {
   console.log("Deleting exam from DB:", examId);
   try {
    // Relations (ExamRoom, Invigilator, ExamStudent) should cascade delete based on schema rules
    // If not, they need to be deleted manually here within a transaction
    await prisma.exam.delete({
      where: { examId: examId },
    });
     console.log("Deleted exam:", examId);
    // TODO: Add activity log
    return true;
  } catch (error) {
     console.error("Database Error (deleteExam):", error);
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
         return false; // Indicate record not found
     }
    throw new Error("Failed to delete exam.");
  }
}


// --- User/Invigilator Mutations ---
// Note: Functions renamed/repurposed to manage Users, not Invigilator assignments directly

// This function should likely be createUser
export async function addUser(userData: AddUserData): Promise<PrismaUser> {
   console.log("Adding user to DB:", userData.email);
   try {
       // Password hashing should happen in the action calling this
       if (!userData.password) {
           throw new Error("Password is required to create a user.");
       }
       const newUser = await prisma.user.create({
         data: {
            name: userData.name,
            email: userData.email,
            password: userData.password, // Assume already hashed
            role: userData.role,
            departmentId: userData.departmentId,
            isActive: userData.isActive ?? true,
         },
       });
       console.log("Added user:", newUser.userId);
       // TODO: Add activity log
       return newUser;
   } catch (error) {
      console.error("Database Error (addUser):", error);
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new Error(`User with email ${userData.email} already exists.`);
      }
      throw new Error("Failed to add user.");
   }
}

// This function should likely be updateUser
export async function updateUser(userId: string, userData: UpdateUserData): Promise<PrismaUser | null> {
   console.log("Updating user in DB:", userId);
   try {
       // Do not allow updating password here, should be a separate process
       const { password, ...updateData } = userData;
       if (password) {
           console.warn("Password updates should be handled separately.");
       }

       const updatedUser = await prisma.user.update({
         where: { userId: userId },
         data: updateData, // Update allowed fields
       });
       console.log("Updated user:", updatedUser.userId);
       // TODO: Add activity log
       return updatedUser;
   } catch (error) {
     console.error("Database Error (updateUser):", error);
      if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2002') { // Unique constraint (e.g., email)
             throw new Error(`Email ${userData.email} might already be in use by another user.`);
         }
         if (error.code === 'P2025') {
             return null; // Record not found
         }
      }
    throw new Error("Failed to update user.");
  }
}

// This function should likely be deleteUser
export async function deleteUser(userId: string): Promise<boolean> {
   console.log("Deleting user from DB:", userId);
   try {
     // Check if user has invigilator assignments BEFORE deleting
     const assignedExamsCount = await prisma.invigilator.count({
       where: { userId: userId }
     });

     if (assignedExamsCount > 0) {
       console.warn(`Cannot delete user ${userId}, assigned to ${assignedExamsCount} exams as invigilator.`);
       throw new Error(`Cannot delete user as they are assigned to ${assignedExamsCount} exam(s) as an invigilator. Please reassign exams first.`);
     }

     // Also check if user is a department head?
     const departmentHeaded = await prisma.department.findFirst({ where: { headId: userId } });
     if (departmentHeaded) {
         throw new Error(`Cannot delete user as they are head of the ${departmentHeaded.name} department.`);
     }

     // If checks pass, proceed with deletion (relations should cascade based on schema)
     await prisma.user.delete({
       where: { userId: userId },
     });
     console.log("Deleted user:", userId);
     // TODO: Add activity log
     return true;
   } catch (error) {
     console.error("Database Error (deleteUser):", error);
     if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
         return false; // Record not found
     }
     // Re-throw other errors, including the assignment/head check errors
     throw error;
   }
}

// --- Invigilator Assignment Mutations ---

export async function addInvigilatorAssignment(assignmentData: AddInvigilatorAssignmentInput): Promise<PrismaInvigilatorAssignment> {
    console.log("Adding invigilator assignment:", assignmentData);
    try {
        const newAssignment = await prisma.invigilator.create({
            data: assignmentData,
        });
        console.log("Added invigilator assignment:", newAssignment.invigilatorId);
        return newAssignment;
    } catch (error) {
        console.error("Database Error (addInvigilatorAssignment):", error);
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') { // Unique constraint (user+exam+room)
                throw new Error(`This invigilator assignment already exists.`);
            }
            if (error.code === 'P2003') { // Foreign key constraint failed
                throw new Error(`Invalid User, Exam, or Room ID provided for assignment.`);
            }
        }
        throw new Error("Failed to add invigilator assignment.");
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
            return false; // Record not found
        }
        throw new Error("Failed to delete invigilator assignment.");
    }
}


// --- Report Data Aggregation Functions ---

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

    // Fetch department names to make the chart labels meaningful
    const departmentIds = distribution.map(item => item.departmentId);
    const departments = await prisma.department.findMany({
        where: { departmentId: { in: departmentIds } },
        select: { departmentId: true, name: true }
    });
    const departmentNameMap = new Map(departments.map(d => [d.departmentId, d.name]));

    console.log("Fetched exam distribution data.");
    return distribution.map(item => ({
        name: departmentNameMap.get(item.departmentId) ?? item.departmentId, // Use name if found, else ID
        value: item._count.examId ?? 0
    }));
  } catch (error) {
    console.error("Database Error (getExamDistributionData):", error);
    throw new Error("Failed to fetch exam distribution data.");
  }
}

export async function getInvigilatorWorkloadData() {
  console.log("Fetching invigilator workload data...");
  try {
    // Count assignments per user
    const workloadData = await prisma.invigilator.groupBy({
        by: ['userId'],
        _count: {
            invigilatorId: true // Count number of assignments
        },
        orderBy: {
            _count: {
                invigilatorId: 'desc'
            }
        }
    });

    // Fetch user names
    const userIds = workloadData.map(item => item.userId);
    const users = await prisma.user.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, name: true }
    });
    const userNameMap = new Map(users.map(u => [u.userId, u.name]));

    console.log("Fetched and calculated invigilator workload data (assignment count).");
    return workloadData.map(item => ({
        name: userNameMap.get(item.userId) ?? `User ${item.userId}`,
        value: item._count.invigilatorId ?? 0 // Assignment count
    }));

  } catch (error) {
    console.error("Database Error (getInvigilatorWorkloadData):", error);
    throw new Error("Failed to fetch invigilator workload data.");
  }
}


export async function getRoomUtilizationData() {
   console.log("Fetching room utilization data...");
   try {
    // Count exams per room using ExamRoom junction table
    const utilizationCounts = await prisma.examRoom.groupBy({
        by: ['roomId'],
        _count: {
            examRoomId: true // Count assignments per room
        },
        orderBy: {
            _count: {
                examRoomId: 'desc'
            }
        }
    });

    // Fetch room names
    const roomIds = utilizationCounts.map(item => item.roomId);
    const rooms = await prisma.room.findMany({
        where: { roomId: { in: roomIds } },
        select: { roomId: true, roomName: true }
    });
    const roomNameMap = new Map(rooms.map(r => [r.roomId, r.roomName]));

     console.log("Fetched room utilization data.");
    return utilizationCounts.map(item => ({
        name: roomNameMap.get(item.roomId) ?? item.roomId, // Use name if found, else ID
        value: item._count.examRoomId ?? 0
    }));
   } catch (error) {
     console.error("Database Error (getRoomUtilizationData):", error);
     throw new Error("Failed to fetch room utilization data.");
   }
 }


// --- Notification Data Fetching ---

// Define a structure for notifications
export type Notification = {
  id: string; // Use exam ID
  title: string;
  message: string;
  time: string; // Relative time string
  read: boolean;
  type: 'upcoming_exam' | 'finished_exam';
  dateTime: Date; // Original start time for sorting
};

export async function getNotifications(): Promise<Notification[]> {
  console.log("Fetching notification data...");
  try {
    const now = new Date();
    const upcomingThreshold = addDays(now, 1); // Exams starting within the next 24 hours
    const finishedThreshold = subDays(now, 1); // Exams ending within the last 24 hours

    // Fetch exams starting soon or ending recently
    const relevantExams = await prisma.exam.findMany({
      where: {
        OR: [
          { // Starting within next 24h
            startTime: {
              gte: now,
              lte: upcomingThreshold,
            },
          },
          { // Ended within last 24h
            endTime: {
              gte: finishedThreshold,
              lte: now,
            }
          }
        ],
      },
      include: { // Include necessary details for messages
          examRooms: { include: { room: true } }, // Need room names
          department: true, // Maybe department name?
      },
      orderBy: {
        startTime: 'desc', // Fetch latest start times first
      },
    });

    const notifications: Notification[] = [];

    relevantExams.forEach(exam => {
      // Get room names (handle multiple rooms if necessary)
      const roomNames = exam.examRooms.map(er => er.room?.roomName ?? er.roomId).join(', ');

      // Check if upcoming
      if (exam.startTime >= now && exam.startTime <= upcomingThreshold) {
        notifications.push({
          id: exam.examId,
          title: `Upcoming Exam: ${exam.subject}`,
          message: `${exam.subject} is scheduled soon in room(s) ${roomNames}.`,
          time: formatDistanceToNowStrict(exam.startTime, { addSuffix: true }),
          read: false,
          type: 'upcoming_exam',
          dateTime: exam.startTime,
        });
      }
      // Check if recently finished
      else if (exam.endTime >= finishedThreshold && exam.endTime <= now) {
         notifications.push({
          id: exam.examId,
          title: `Exam Finished: ${exam.subject}`,
          message: `${exam.subject} in room(s) ${roomNames} has finished.`,
          time: formatDistanceToNowStrict(exam.endTime, { addSuffix: true }),
          read: false,
          type: 'finished_exam',
          dateTime: exam.startTime, // Use start time for sorting consistency
        });
      }
    });

    // Sort notifications chronologically (most recent event first based on start time)
    notifications.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());

    console.log(`Generated ${notifications.length} notifications.`);
    return notifications;

  } catch (error) {
    console.error("Database Error (getNotifications):", error);
    return []; // Return empty array on error
  }
}

// Import UserRole enum if not already globally available or imported elsewhere
import { UserRole } from '@prisma/client';