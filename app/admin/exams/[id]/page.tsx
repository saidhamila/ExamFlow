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
import { getInvigilatorOptionsAction, getDepartmentOptionsAction, getRoomOptionsAction } from "@/lib/actions" // Add department/room options actions
// Import the detailed type from data.ts
import type { ExamWithDetails } from "@/lib/data";
// Import necessary Prisma types for clarity if needed elsewhere, but ExamWithDetails should suffice
import type { Invigilator as PrismaInvigilatorAssignment, User as PrismaUser, Room as PrismaRoom } from "@prisma/client";

// Remove mock data

// Make component async
export default async function ExamDetailsPage({ params }: { params: { id: string } }) {

  // Fetch exam details, notifications, and options in parallel
  const [exam, notifications, invigilatorOptions, departmentOptions, roomOptions] = await Promise.all([
    getExamById(params.id),
    getNotifications(),
    getInvigilatorOptionsAction(), // Fetch invigilator options
    getDepartmentOptionsAction(), // Fetch department options
    getRoomOptionsAction()      // Fetch room options
  ]);

  // Handle exam not found
  if (!exam) {
    notFound(); // Render 404 page
  }

  // Determine status based on examDate, startTime, endTime
  const now = new Date();
  // Ensure startTime and endTime are valid Date objects
  const examStartDateTime = exam.startTime ? new Date(exam.startTime) : null;
  const examEndDateTime = exam.endTime ? new Date(exam.endTime) : null;

  let status = "Scheduled"; // Default status
  if (examStartDateTime && examEndDateTime) {
      if (examEndDateTime < now) {
          status = "Completed";
      } else if (examStartDateTime <= now && examEndDateTime >= now) {
          status = "Ongoing";
      }
      // Otherwise, it remains "Scheduled"
  } else {
      // Handle cases where start/end time might be missing if schema allows nulls
      status = "Time Unknown"; // Or some other indicator
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
            {/* Pass real exam data and ALL options to dialog */}
            <EditExamDialog
              exam={exam}
              invigilatorOptions={invigilatorOptions}
              departmentOptions={departmentOptions}
              roomOptions={roomOptions}
            />
            {/* TODO: Implement DeleteExamDialog with client-side state/callbacks */}
            {/* <DeleteExamDialog examId={exam.id} /> */}
          </div>
        </div>

        <div className="grid gap-6 p-4 md:p-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    {/* Use subject from schema */}
                    <CardTitle className="text-2xl">{exam.subject}</CardTitle>
                    {/* No course code in schema, maybe use department? */}
                    <CardDescription>{exam.department?.name ?? 'Unknown Department'}</CardDescription>
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
                      {/* Format examDate */}
                      <p className="text-muted-foreground">{format(new Date(exam.examDate), 'PPP')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Time</p>
                      {/* Format startTime and endTime */}
                      <p className="text-muted-foreground">
                        {exam.startTime ? format(new Date(exam.startTime), 'p') : 'N/A'} - {exam.endTime ? format(new Date(exam.endTime), 'p') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Rooms</p>
                      {/* List rooms from examRooms relation */}
                      <p className="text-muted-foreground">
                        {exam.examRooms.length > 0
                          ? exam.examRooms.map(er => er.room?.roomName ?? 'Unknown Room').join(', ')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    {/* Use Users icon */}
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Invigilators</p>
                      {/* List invigilator names from nested user object */}
                      <p className="text-muted-foreground">
                        {exam.invigilators.length > 0
                          ? exam.invigilators.map(inv => inv.user?.name ?? inv.user?.email ?? 'Unknown Invigilator').join(', ')
                          : 'N/A'}
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
                {/* Display student count and list */}
                <p className="text-muted-foreground mb-4">Total students: {exam.students?.length ?? 0}</p>
                {exam.students && exam.students.length > 0 ? (
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {exam.students.map(({ student }) => (
                      <li key={student?.studentId} className="text-sm flex justify-between items-center">
                        <span>{student?.user?.name ?? student?.user?.email ?? 'Unknown Student'}</span>
                        <span className="text-xs text-muted-foreground">{student?.program ?? 'No Program'}</span>
                        {/* Add button to remove student from exam later */}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    No students are currently enrolled in this exam.
                  </p>
                )}
                {/* Add button to add students later */}
              </CardContent>
              <CardFooter>
                {/* Keep Export button disabled for now */}
                <Button variant="outline" size="sm" className="ml-auto mt-4" disabled>
                  Export Student List (Not Implemented)
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
                {/* Display department name */}
                <p>{exam.department?.name ?? 'N/A'}</p>
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
