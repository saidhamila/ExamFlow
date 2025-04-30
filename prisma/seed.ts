import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'testadmin@valpha.dev';
  const plainPassword = 'password'; // Use a strong password in production!

  console.log(`Checking for existing admin user: ${adminEmail}`);

  // Hash the password
  const saltRounds = 10; // Standard salt rounds
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
  console.log('Password hashed.');

  // Create or update the admin user
  try {
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        // Optionally update fields if user exists, e.g., ensure role is ADMIN
        role: UserRole.ADMIN,
        // You might want to update the password here too if needed
        // password: hashedPassword,
      },
      create: {
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN,
        // Add name if desired
        // name: 'Admin User',
      },
    });
    console.log(`Admin user ${adminEmail} created/updated successfully:`, adminUser);
  } catch (error) {
    console.error(`Error creating/updating admin user ${adminEmail}:`, error);
    process.exit(1); // Exit with error code
  } finally {
    // Disconnect Prisma Client
    await prisma.$disconnect();
    console.log('Prisma Client disconnected.');
  }
}

// Execute the main function
main().catch((e) => {
  console.error('Error running seed script:', e);
  process.exit(1);
});