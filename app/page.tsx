// Remove "use client" directive

import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies as nextCookies } from "next/headers"
import type { ResponseCookies } from "next/dist/server/web/spec-extension/cookies"
import { prisma } from "@/lib/db" // Import Prisma client
import bcrypt from "bcryptjs" // Import bcryptjs
// Remove getNotifications, getDepartments, getRooms imports
// Remove useFormStatus import

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
// Remove Button, Input, Label imports as they are now in LoginForm
import { LoginForm } from "@/components/login-form"; // Import the new LoginForm component

export default function LoginPage() {
  async function handleLogin(formData: FormData) {
    "use server"

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      console.error("Login Error: Missing email or password.");
      // TODO: Add user feedback
      return;
    }

    let redirectPath: string | null = null; // Variable to store the redirect path

    try {
      // --- Find User ---
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        console.error(`Login Error: User not found for email: ${email}`);
        // TODO: Add user feedback (keep message generic for security)
        return; // Exit if user not found
      }

      // --- Compare Passwords ---
      const passwordsMatch = await bcrypt.compare(password, user.password);

      if (!passwordsMatch) {
        console.error(`Login Error: Invalid password for email: ${email}`);
        // TODO: Add user feedback (keep message generic)
        return; // Exit if password doesn't match
      }

      // --- Login Success: Set Simple Cookie ---
      console.log(`Login successful for: ${email}, Role: ${user.role}`);
      const cookieStore = await nextCookies() as unknown as ResponseCookies;
      // Store only essential user info
      const sessionPayload = {
        userId: user.userId,
        email: user.email,
        role: user.role,
      };
      cookieStore.set("auth-session", JSON.stringify(sessionPayload), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
        sameSite: "lax",
      });

      // --- Determine redirect path based on role ---
      if (user.role === "ADMIN") {
        redirectPath = "/admin";
      } else {
        redirectPath = "/schedule"; // Default for USER role
      }

    } catch (error) {
      console.error("Login Database Error:", error);
      // TODO: Add user feedback for generic error
      // Don't redirect on error, just return
      return;
    }

    // --- Perform redirect outside the try...catch block ---
    if (redirectPath) {
      redirect(redirectPath);
    }
  }

  // Remove the LoginButton component definition

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex items-center justify-center pt-8">
          <div className="mb-4 h-16 w-16">
            <Image
              src="/placeholder.svg?height=64&width=64"
              alt="Institution Logo"
              width={64}
              height={64}
              className="h-full w-full"
            />
          </div>
          <h1 className="text-2xl font-semibold text-center">Exam Schedule System</h1>
        </CardHeader>
        <CardContent>
          {/* Use the LoginForm component and pass the server action */}
          <LoginForm handleLogin={handleLogin} />
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 pb-8"> {/* Use flex-col and gap */}
          <Link href="#" className="text-sm text-gray-500 hover:text-primary">
            Forgot Password?
          </Link>
          {/* Add Register link */}
          <Link href="/register" className="text-sm text-gray-500 hover:text-primary">
            Don't have an account? Register
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
