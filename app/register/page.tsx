import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { prisma } from "@/lib/db" // Import Prisma client
import bcrypt from "bcryptjs" // Import bcryptjs

export default function RegisterPage() {
  async function handleRegister(formData: FormData) {
    "use server"

    const name = formData.get("name") as string | null; // Name is optional in schema
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // --- Basic Validation ---
    if (!email || !password || !confirmPassword) {
      // This should ideally be handled client-side too, but server validation is crucial
      console.error("Registration Error: Missing required fields.");
      // TODO: Add user feedback (e.g., redirect with error query param)
      return; // Stop execution
    }

    if (password !== confirmPassword) {
      console.error("Registration Error: Passwords do not match.");
      // TODO: Add user feedback
      return;
    }

    if (password.length < 6) {
       console.error("Registration Error: Password too short.");
       // TODO: Add user feedback
       return;
    }

    try {
      // --- Check if user exists ---
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.error(`Registration Error: User with email ${email} already exists.`);
         // TODO: Add user feedback
        return;
      }

      // --- Hash Password ---
      const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

      // --- Create User ---
      await prisma.user.create({
        data: {
          name: name, // Use null if name is empty string or null
          email: email,
          password: hashedPassword,
          // Role defaults to USER as per schema
        },
      });

      console.log(`User registered successfully: ${email}`);

    } catch (error) {
        console.error("Registration Database Error:", error);
        // TODO: Add user feedback for generic error
        return;
    }

    // --- Redirect on Success ---
    redirect("/?registered=true"); // Redirect to login page
  }

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
          <h1 className="text-2xl font-semibold text-center">Create Account</h1>
        </CardHeader>
        <CardContent>
          {/* Point form action to handleRegister */}
          <form action={handleRegister} className="space-y-6">
             {/* Name Field */}
            <div className="space-y-2">
               <div className="relative">
                <Input id="name" name="name" type="text" className="peer h-12 pt-4 px-3" placeholder=" " required />
                <Label
                  htmlFor="name"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Name
                </Label>
              </div>
            </div>
            {/* Email Field */}
            <div className="space-y-2">
              <div className="relative" suppressHydrationWarning={true}>
                <Input id="email" name="email" type="email" className="peer h-12 pt-4 px-3" placeholder=" " required />
                <Label
                  htmlFor="email"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Email
                </Label>
              </div>
            </div>
            {/* Password Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="peer h-12 pt-4 px-3"
                  placeholder=" "
                  required
                  minLength={6} // Add basic password length requirement
                />
                <Label
                  htmlFor="password"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Password
                </Label>
              </div>
            </div>
             {/* Confirm Password Field */}
             <div className="space-y-2">
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="peer h-12 pt-4 px-3"
                  placeholder=" "
                  required
                  minLength={6}
                />
                <Label
                  htmlFor="confirmPassword"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Confirm Password
                </Label>
              </div>
            </div>
            <Button type="submit" className="w-full h-12">
              Register
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-8">
          {/* Link back to login */}
          <Link href="/" className="text-sm text-gray-500 hover:text-primary">
            Already have an account? Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}