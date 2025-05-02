// This is now a Server Component

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers'; // Import cookies for server-side use
import { prisma } from '@/lib/db'; // Import prisma client
import { getNotifications } from '@/lib/data'; // Import only getNotifications
import { getPrioritizedNotifications } from '@/lib/actions'; // Import the new action
import { AdminLayout } from '@/components/admin-layout'; // Import Admin layout
import { UserLayout } from '@/components/user-layout';   // Import User layout
import { ProfileClient } from '@/components/profile-client'; // Import the client component
import type { UserRole } from '@prisma/client'; // Import UserRole enum

// Define UserProfileData type locally
type UserProfileData = {
    id: string;
    name: string | null;
    email: string;
    role: UserRole; // Use the actual enum type
    createdAt: Date;
    updatedAt: Date;
} | null;

// Define the type expected by UserLayout's userRole prop
type LayoutRole = 'ADMIN' | 'USER' | 'CHEF' | 'DIRECTEUR' | undefined;

// Define getCurrentUser function locally within the Server Component
async function getCurrentUser(): Promise<UserProfileData> {
  console.log("Attempting to get current user from session (profile page)...");
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth-session');

    if (!sessionCookie?.value) {
      console.log("No auth session cookie found (profile page).");
      return null;
    }

    const sessionData = JSON.parse(sessionCookie.value);
    console.log("Parsed session data (profile page):", JSON.stringify(sessionData));

    const userId = sessionData?.userId;
    console.log(`Extracted userId from cookie (profile page): [${userId}]`);

    if (!userId) {
      console.log("User ID not found in session cookie (profile page) or extracted userId is invalid.");
      return null;
    }

    console.log(`Fetching user data for ID: ${userId} (profile page)`);
    const user = await prisma.user.findUnique({
      where: { userId: userId },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
       console.log(`User with ID ${userId} not found in database (profile page).`);
       return null;
    }

    console.log(`Successfully fetched user: ${user.email} (profile page)`);
    // Map the selected fields to the UserProfileData type structure
    return {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role, // Role is already the correct type from Prisma
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };

  } catch (error) {
    console.error("Error caught in getCurrentUser (profile page):", error);
    return null; // Returns null on ANY error in the try block
  }
}


export default async function ProfilePage() {
  // Fetch user data and notifications in parallel
  const [userData, notifications] = await Promise.all([
    getCurrentUser(),
    // Replace getNotifications with getPrioritizedNotifications
    getPrioritizedNotifications()
  ]);

  console.log("User data fetched in ProfilePage:", JSON.stringify(userData, null, 2));

  // If no user data (not logged in or error fetching), redirect to login
  if (!userData) {
    console.error("Redirecting from profile page because userData is null or undefined.");
    redirect('/'); // Redirect to login page
  }

  // Render the appropriate layout based on role
  if (userData.role === 'ADMIN') {
    return (
      <AdminLayout notifications={notifications}>
        <ProfileClient userData={userData} />
      </AdminLayout>
    );
  } else {
    // Map Prisma role to the role expected by UserLayout
    let layoutRole: LayoutRole;
    switch (userData.role) {
      case 'CHEF':
        layoutRole = 'CHEF';
        break;
      case 'DIRECTEUR':
        layoutRole = 'DIRECTEUR';
        break;
      case 'ENSEIGNANT':
      case 'ETUDIANT':
      // Add other non-admin roles here if necessary
        layoutRole = 'USER';
        break;
      default:
        // Fallback or handle unexpected roles if needed
        layoutRole = 'USER'; // Default to USER for safety
        console.warn(`Unexpected user role "${userData.role}" encountered in profile page. Defaulting layout role to USER.`);
    }

    // For USER, CHEF, DIRECTEUR roles (and mapped roles)
    return (
      // Pass the mapped layoutRole specifically to UserLayout
      <UserLayout notifications={notifications} userRole={layoutRole}>
        <ProfileClient userData={userData} />
      </UserLayout>
    );
  }
}
