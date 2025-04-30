import Link from "next/link"
import { ArrowLeft, Calendar, Clock, MapPin, Users, FileText, Edit, AlertTriangle } from "lucide-react" // Changed User to Users
import { notFound } from 'next/navigation'; // Import notFound
import { format } from 'date-fns'; // Import date-fns for formatting

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AdminLayout } from "@/components/admin-layout"
import { DeleteExamDialog } from "@/components/delete-exam-dialog"
import { EditExamDialog } from "@/components/edit-exam-dialog"
// Import data fetching functions and actions
import { getExamById, getNotifications } from "@/lib/data"
import { getInvigilatorOptionsAction } from "@/lib/actions" // Correct import path
import type { Invigilator } from "@prisma/client" // Import Invigilator type

// Remove mock data

// Make component async
export default async function ExamDetailsPage({ params }: { params: { id: string } }) {

  // Fetch exam details, notifications, and invigilator options in parallel
  const [exam, notifications, invigilatorOptions] = await Promise.all([
    getExamById(params.id),
    getNotifications(),
    getInvigilatorOptionsAction() // Fetch options needed for EditExamDialog
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
    <AdminLayout notifications={notifications}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between py-4 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/exams">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold">Exam Details</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Pass real exam data and invigilator options to dialogs */}
            <EditExamDialog exam={exam} invigilatorOptions={invigilatorOptions} />
            {/* Temporarily comment out DeleteExamDialog as it requires client-side state/callbacks */}
            {/* <DeleteExamDialog examId={exam.id} /> */}
          </div>
        </div>

        <div className="grid gap-6 p-4 md:p-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    {/* Use real data */}
                    <CardTitle className="text-2xl">{exam.courseName}</CardTitle>
                    <CardDescription>{exam.courseCode}</CardDescription>
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
                    Notes
                  </h3>
                  {/* Notes field doesn't exist on Exam model, remove or add later */}
                  <p className="text-muted-foreground italic">No notes available.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student List</CardTitle>
                <CardDescription>Students registered for this exam</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Student count doesn't exist on Exam model */}
                <p className="text-muted-foreground">Total students: N/A</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Student list functionality is not implemented.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="ml-auto" disabled>
                  Export Student List
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Department</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{exam.department}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 {/* Edit button is handled by the EditExamDialog now */}
                 {/* <Button className="w-full" asChild>
                  <Link href={`/admin/exams/${exam.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Exam
                  </Link>
                </Button> */}
                <Button variant="outline" className="w-full" disabled>
                  Print Exam Details (Not Implemented)
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Send Notifications (Not Implemented)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
