"use client"; // This component needs client-side hooks

import React from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';

// Define props, including the server action function
interface LoginFormProps {
  handleLogin: (formData: FormData) => Promise<void>; // Or appropriate return type if action returns data/errors
}

// Separate component for the button to use useFormStatus
function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full h-12" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Logging in..." : "Login"}
    </Button>
  );
}

export function LoginForm({ handleLogin }: LoginFormProps) {
  return (
    <form action={handleLogin} className="space-y-6">
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
      <div className="space-y-2">
        <div className="relative">
          <Input
            id="password"
            name="password"
            type="password"
            className="peer h-12 pt-4 px-3"
            placeholder=" "
            required
          />
          <Label
            htmlFor="password"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
          >
            Password
          </Label>
        </div>
      </div>
      <LoginButton /> {/* Use the button with loading state */}
    </form>
  );
}