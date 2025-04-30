// This is now a Server Component

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers'; // Import cookies for server-side use
import { prisma } from '@/lib/db'; // Import prisma client
import { getNotifications } from '@/lib/data'; // Import only getNotifications
import { AdminLayout } from '@/components/admin-layout'; // Import Admin layout
import { UserLayout } from '@/components/user-layout';   // Import User layout
import { ProfileClient } from '@/components/profile-client'; // Import the client component

// Define UserProfileData type locally as it was removed from lib/data.ts
type UserProfileData = {
    id: string;
    name: string | null;
    email: string;
    role: string; // Role enum will be fetched as string
    createdAt: Date;
    updatedAt: Date;
} | null;

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

    // Potential failure point 1: JSON.parse
    const sessionData = JSON.parse(sessionCookie.value);
    // ADD LOGGING HERE: Log the parsed data structure immediately
    console.log("Parsed session data (profile page):", JSON.stringify(sessionData));

    // Potential failure point 2: Accessing userId
    const userId = sessionData?.userId;
    // ADD LOGGING HERE: Log the extracted userId
    console.log(`Extracted userId from cookie (profile page): [${userId}]`);

    if (!userId) {
      console.log("User ID not found in session cookie (profile page) or extracted userId is invalid.");
      return null;
    }

    console.log(`Fetching user data for ID: ${userId} (profile page)`);
    const user = await prisma.user.findUnique({
      where: { userId: userId }, // Use the correct field name 'userId'
      select: {
        userId: true, // Select the correct field name 'userId'
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
    // Need to map the selected fields to the UserProfileData type structure
    // The 'id' field in UserProfileData should map from 'userId'
    return {
        id: user.userId, // Map userId to id
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };

  } catch (error) {
    // Log the specific error object encountered
    console.error("Error caught in getCurrentUser (profile page):", error);
    return null; // Returns null on ANY error in the try block
  }
}


export default async function ProfilePage() {
  // Fetch user data and notifications in parallel
  const [userData, notifications] = await Promise.all([
    getCurrentUser(), // Call the locally defined function
    getNotifications()
  ]);

  // Log the fetched user data before checking
  console.log("User data fetched in ProfilePage:", JSON.stringify(userData, null, 2));

  // If no user data (not logged in or error fetching), redirect to login
  if (!userData) {
    console.error("Redirecting from profile page because userData is null or undefined.");
    redirect('/'); // Redirect to login page
  }

  // Choose the layout based on the user's role
  const Layout = userData.role === 'ADMIN' ? AdminLayout : UserLayout;

  return (
    // Pass notifications to the chosen layout
    <Layout notifications={notifications}>
      {/*
        The header/title part is now handled by the respective layouts (AdminLayout/UserLayout).
        We only need to render the client component responsible for the profile tabs/content.
      */}
      <ProfileClient userData={userData} />
    </Layout>
  );
}
