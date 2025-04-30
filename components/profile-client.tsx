"use client" // This component handles client-side interactivity

import type React from "react"
import { useState, useRef } from "react" // Import useRef
import { UserCircle, Lock, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { changePasswordAction } from "@/lib/actions" // Import the server action
import type { UserProfileData } from "@/lib/data" // Import the user data type

// Interface for the props, including the user data fetched by the server component
interface ProfileClientProps {
  userData: UserProfileData; // Use the specific type for user data
}

export function ProfileClient({ userData }: ProfileClientProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const passwordFormRef = useRef<HTMLFormElement>(null); // Create a ref for the form
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string[] | undefined>>({}); // State for form errors

  // Handle profile save (currently just a placeholder as editing isn't required by the task)
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    // This function can be expanded if profile editing is needed later
    toast({
      title: "Info",
      description: "Profile editing is not implemented in this version.",
    })
  }

  // Handle password input changes
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordData(prev => ({ ...prev, [id.replace(/-/g, '')]: value })); // Map ID to state key
    // Clear specific field error on change
    setFormErrors(prev => ({ ...prev, [id.replace(/-/g, '')]: undefined }));
  };


  // Handle password change form submission
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setFormErrors({}); // Clear previous errors

    const formData = new FormData(e.currentTarget);

    const result = await changePasswordAction(formData);

    setIsLoading(false)

    if (result.success) {
      toast({
        title: "Password changed",
        description: result.message || "Your password has been changed successfully.",
      })
      // Clear password fields after successful change
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      // Reset the form using the ref
      passwordFormRef.current?.reset();
    } else {
      toast({
        title: "Password Change Failed",
        description: result.message || "Could not change password. Please check your input.",
        variant: "destructive",
      })
      // Set form errors if they exist in the result
      if (result.errors) {
        setFormErrors(result.errors);
      }
    }
  }

  // Display loading or error if userData is not available
  if (!userData) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full text-center text-muted-foreground">
        Could not load user profile data. Please try logging in again.
      </div>
    );
  }

  // Render the UI using the fetched userData
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            {/* Profile form - currently read-only based on task requirements */}
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                    <UserCircle className="h-12 w-12 text-muted-foreground" />
                  </div>
                  {/* Display real user data */}
                  <p className="text-lg font-medium">{userData.name || 'N/A'}</p> {/* Handle potential null name */}
                  <p className="text-sm text-muted-foreground">{userData.role}</p> {/* Display only role */}
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {/* Use real data, make input disabled as per requirement */}
                    <Input id="name" value={userData.name || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={userData.email || ''} disabled />
                  </div>
                  {/* Remove Phone and Department fields as they don't exist on User model */}
                  {/* <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" value={userData.phone || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" value={userData.department || ''} disabled />
                  </div> */}
                </div>
              </CardContent>
              {/* Footer can be removed or kept depending on future needs */}
              {/* <CardFooter>
                <Button type="submit" className="ml-auto" disabled={true}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes (Disabled)
                </Button>
              </CardFooter> */}
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            {/* Password change form */}
            <form ref={passwordFormRef} onSubmit={handleChangePassword}> {/* Attach the ref here */}
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="currentPassword" // Match state key
                      name="currentPassword" // Name for FormData
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      required
                      aria-invalid={!!formErrors?.currentPassword}
                      aria-describedby={formErrors?.currentPassword ? "currentPassword-error" : undefined}
                    />
                     {formErrors?.currentPassword && (
                      <p id="currentPassword-error" className="text-sm text-red-600">{formErrors.currentPassword.join(', ')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="newPassword" // Match state key
                      name="newPassword" // Name for FormData
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      required
                      aria-invalid={!!formErrors?.newPassword}
                      aria-describedby={formErrors?.newPassword ? "newPassword-error" : undefined}
                    />
                     {formErrors?.newPassword && (
                      <p id="newPassword-error" className="text-sm text-red-600">{formErrors.newPassword.join(', ')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirmPassword" // Match state key
                      name="confirmPassword" // Name for FormData
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      required
                      aria-invalid={!!formErrors?.confirmPassword}
                      aria-describedby={formErrors?.confirmPassword ? "confirmPassword-error" : undefined}
                    />
                     {formErrors?.confirmPassword && (
                      <p id="confirmPassword-error" className="text-sm text-red-600">{formErrors.confirmPassword.join(', ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p>Password must:</p>
                    <ul className="list-disc list-inside pl-2">
                      <li>Be at least 8 characters long</li>
                      <li>Include at least one uppercase letter</li>
                      <li>Include at least one number</li>
                      <li>Include at least one special character</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="ml-auto" disabled={isLoading}>
                  {isLoading ? "Changing..." : "Change Password"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}