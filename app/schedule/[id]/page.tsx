import Link from "next/link"
import { ArrowLeft, Calendar, Clock, MapPin, Users, FileText, AlertTriangle } from "lucide-react" // Changed User to Users
import { notFound } from 'next/navigation'; // Import notFound
import { format } from 'date-fns'; // Import date-fns for formatting

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { UserLayout } from "@/components/user-layout"
// Import data fetching functions and types
import { getExamById, getNotifications } from "@/lib/data"
import type { Invigilator } from "@prisma/client" // Import Invigilator type

// Remove mock data

// Make component async
export default async function ExamDetailsPage({ params }: { params: { id: string } }) {

  // Fetch exam details and notifications in parallel
  const [exam, notifications] = await Promise.all([
    getExamById(params.id),
    getNotifications()
  ]);

  // Handle exam not found
  if (!exam) {
    notFound(); // Render 404 page
  }

  // Determine status based on dateTime (example logic)
  const now = new Date();
  const examEndTime = new Date(exam.dateTime.getTime() + exam.duration * 60000);
  let status = "Scheduled";
  if (examEndTime < now) {
    status = "Completed";
  } else if (exam.dateTime <= now && examEndTime >= now) {
    status = "Ongoing";
  }

  return (
    // Pass notifications to layout
    <UserLayout notifications={notifications}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between py-4 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/schedule">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold">Exam Details</h1>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  {/* Use real data */}
                  <CardTitle className="text-2xl">{exam.courseName}</CardTitle>
                  <p className="text-muted-foreground">{exam.courseCode}</p>
                </div>
                {/* Use calculated status */}
                <Badge
                  variant="outline"
                  className={
                    status === "Scheduled"
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                      : status === "Ongoing"
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100" // Completed
                  }
                >
                  {status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Date</p>
                    {/* Format real dateTime */}
                    <p className="text-muted-foreground">{format(exam.dateTime, 'PPP')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Time</p>
                    {/* Format real dateTime */}
                    <p className="text-muted-foreground">{format(exam.dateTime, 'p')} ({exam.duration} mins)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Room</p>
                    <p className="text-muted-foreground">{exam.room}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                   {/* Use Users icon */}
                   <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Invigilators</p>
                     {/* List real invigilators with explicit type */}
                    <p className="text-muted-foreground">
                      {exam.invigilators.length > 0 ? exam.invigilators.map((inv: Invigilator) => inv.name).join(', ') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Important Notes
                </h3>
                 {/* Notes field doesn't exist on Exam model */}
                 <p className="text-muted-foreground italic">No notes available for this exam.</p>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/schedule">Back to Schedule</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  )
}
