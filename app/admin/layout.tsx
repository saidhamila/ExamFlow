import type React from "react";
import { cookies } from 'next/headers';
import { AdminLayout } from "@/components/admin-layout";
// Import getNotifications and type Notification from data, and the new action from actions
import { getNotifications, type Notification } from "@/lib/data";
import { getPrioritizedNotifications } from "@/lib/actions";

// Define session type based on middleware
interface AuthSession {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'CHEF' | 'DIRECTEUR';
}

export default async function AdminPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies(); // Await the cookie store
  const sessionCookie = cookieStore.get('auth-session');
  let userId: string | undefined = undefined;
  let notifications: Notification[] = []; // Default to empty array with explicit type

  if (sessionCookie) {
    try {
      const sessionData = JSON.parse(sessionCookie.value) as AuthSession;
      userId = sessionData.userId;
    } catch (error) {
      console.error("Failed to parse auth session cookie in admin layout:", error);
      // Handle error, maybe clear cookie or redirect, depending on desired behavior
    }
  }

  // Fetch notifications (assuming it doesn't need userId based on error)
  // We fetch regardless of userId found in cookie, maybe notifications are global?
  // Or getNotifications handles the session internally. Adjust if needed.
  try {
    // Replace getNotifications with getPrioritizedNotifications
    notifications = await getPrioritizedNotifications();
  } catch (error) {
     console.error("Failed to fetch prioritized notifications in admin layout:", error);
       // Handle error fetching notifications, maybe show a message
    }
  // Removed extra closing brace here

  return (
    <AdminLayout notifications={notifications}>
      {children}
    </AdminLayout>
  );
}