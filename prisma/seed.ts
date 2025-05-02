import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx'; // Import xlsx
import path from 'path'; // Import path

// Initialize Prisma Client
const prisma = new PrismaClient();

// Helper function to parse time string (HHhMM or HH:MM)
function parseTime(timeStr: string): { hours: number; minutes: number } | null {
    if (typeof timeStr !== 'string') return null;
    try {
        const formattedTime = timeStr.replace('h', ':');
        if (!formattedTime.includes(':')) return null;

        const parts = formattedTime.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);

        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return null; // Invalid hours or minutes
        }
        return { hours, minutes };
    } catch (error) {
        console.error("Error parsing time string:", timeStr, error);
        return null;
    }
}


async function main() {
  // --- Admin User Setup ---
  const adminEmail = 'testadmin@valpha.dev';
  const plainPassword = 'password'; // Use a strong password in production!
  console.log(`Checking for existing admin user: ${adminEmail}`);
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
  console.log('Password hashed.');
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: UserRole.ADMIN },
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Admin user ${adminEmail} created/updated successfully.`);

  // --- Excel Data Import ---
  console.log('Starting Excel data import...');
  const filePath = path.join(__dirname, '..', 'examen.xlsx'); // Assumes file is in project root
  let workbook;
  try {
    workbook = xlsx.readFile(filePath);
  } catch (error) {
    console.error(`Error reading Excel file at ${filePath}:`, error);
    return; // Stop seeding if file can't be read
  }

  const sheetName = 'Feuil1';
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.error(`Sheet "${sheetName}" not found in the Excel file.`);
    return;
  }

  // Use { raw: false } to attempt automatic date/time parsing by xlsx library
  const data: any[] = xlsx.utils.sheet_to_json(sheet, { raw: false });
  console.log(`Found ${data.length} rows in sheet "${sheetName}".`);

  for (const row of data) {
    try {
      const examDateStr = row['Date'];
      const startTimeStr = row['DE'];
      const endTimeStr = row['A'];
      const departmentName = row['Filière']?.trim();
      const roomName = row['salle']?.trim();
      const subject = row['Epreuve']?.trim();
      const invigilatorEmailsOrNames = [row['Survaillant1'], row['Survaillant2'], row['Survaillant3']]
        .map(inv => typeof inv === 'string' ? inv.trim() : null) // Trim strings, keep nulls
        .filter(inv => inv && inv !== ''); // Filter out nulls and empty strings

      // Basic validation
      // Allow rows without invigilators for now
      if (!examDateStr || !startTimeStr || !endTimeStr || !departmentName || !roomName || !subject) {
        console.warn('Skipping row due to missing essential data:', row);
        continue;
      }

      // Parse date and times
      // Parse Date - handle potential Excel date number or string
      let baseExamDate: Date | null = null;
      if (typeof examDateStr === 'number') {
          baseExamDate = new Date((examDateStr - 25569) * 86400 * 1000);
      } else if (typeof examDateStr === 'string') {
          baseExamDate = new Date(examDateStr);
      }

      if (!baseExamDate || isNaN(baseExamDate.getTime())) {
          console.warn(`Skipping row due to invalid date format: Date='${examDateStr}'`, row);
          continue;
      }
      // Set time to 00:00:00 to avoid timezone issues when setting H/M later
      baseExamDate.setUTCHours(0, 0, 0, 0);


      // Parse Start and End Times
      const parsedStartTime = parseTime(startTimeStr);
      const parsedEndTime = parseTime(endTimeStr);

      if (!parsedStartTime || !parsedEndTime) {
          console.warn(`Skipping row due to invalid time format: Start='${startTimeStr}', End='${endTimeStr}'`, row);
          continue;
      }

      // Construct final Date objects with UTC to avoid timezone shifts
      const startTime = new Date(baseExamDate);
      startTime.setUTCHours(parsedStartTime.hours, parsedStartTime.minutes);

      const endTime = new Date(baseExamDate);
      endTime.setUTCHours(parsedEndTime.hours, parsedEndTime.minutes);


      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
         console.warn(`Skipping row due to invalid final date/time construction: Start='${startTimeStr}', End='${endTimeStr}'`, row);
         continue;
      }

       // Check if end time is on or before start time
       if (endTime <= startTime) {
         console.warn(`Skipping row due to invalid time range (end <= start): Start='${startTime.toISOString()}', End='${endTime.toISOString()}'`, row);
         continue;
       }


      // Upsert Department
      const department = await prisma.department.upsert({
        where: { name: departmentName },
        update: {},
        create: { name: departmentName },
      });

      // Upsert Room
      const room = await prisma.room.upsert({
        where: { roomName: roomName },
        update: {},
        create: { roomName: roomName, capacity: 30 }, // Default capacity
      });

      // Upsert Invigilators (Users)
      const invigilatorUserIds: string[] = [];
      for (const emailOrNameInput of invigilatorEmailsOrNames) {
        // Explicitly check for null/undefined within the loop for type safety
        if (!emailOrNameInput) {
            console.warn("Skipping null or empty invigilator value.");
            continue;
        }
        const emailOrName = emailOrNameInput; // Now guaranteed to be a string

        // Simple check if it looks like an email
        const isEmail = /\S+@\S+\.\S+/.test(emailOrName);
        const user = await prisma.user.upsert({
          where: { email: isEmail ? emailOrName : `${emailOrName.replace(/\s+/g, '.').toLowerCase()}@example.com` }, // Create dummy email if name
          update: {},
          create: {
            email: isEmail ? emailOrName : `${emailOrName.replace(/\s+/g, '.').toLowerCase()}@example.com`,
            name: isEmail ? emailOrName.split('@')[0] : emailOrName, // Use name if provided, else part of email
            password: hashedPassword, // Use same default hashed password
            role: UserRole.ENSEIGNANT,
          },
        });
        invigilatorUserIds.push(user.userId);
      }

      // Create Exam
      const newExam = await prisma.exam.create({
        data: {
          subject: subject,
          departmentId: department.departmentId,
          examDate: baseExamDate, // Use the date part only for examDate column
          startTime: startTime,
          endTime: endTime,
          // Add relations
          examRooms: {
            create: {
              roomId: room.roomId,
            },
          },
          invigilators: {
            create: invigilatorUserIds.map(userId => ({
              userId: userId,
              roomId: room.roomId, // Assign invigilator to the specific room for this exam
            })),
          },
        },
      });

      console.log(`Created exam "${newExam.subject}" (ID: ${newExam.examId})`);

    } catch (error) {
      console.error('Error processing row:', row, error);
      // Decide if you want to continue with other rows or stop
      // continue;
    }
  }

  console.log('Excel data import finished.');
}

// Execute the main function
main()
  .catch((e) => {
    console.error('Error running seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect Prisma Client
    await prisma.$disconnect();
    console.log('Prisma Client disconnected.');
  });