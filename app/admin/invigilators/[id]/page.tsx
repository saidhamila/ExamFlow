import Link from "next/link"
import { ArrowLeft, Mail, Phone, Building, Calendar, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminLayout } from "@/components/admin-layout"
import { DeleteInvigilatorDialog } from "@/components/delete-invigilator-dialog"
import { EditInvigilatorDialog } from "@/components/edit-invigilator-dialog"

// Mock data for a single invigilator
const invigilator = {
  id: "1",
  name: "Dr. Smith",
  department: "Mathematics",
  status: "Available",
  email: "smith@example.com",
  phone: "+1 234 567 890",
  office: "Building A, Room 101",
  joined_date: "2020-01-15",
}

// Mock data for assigned exams
const assignedExams = [
  {
    id: "1",
    date: "2025-05-10",
    time: "09:00 - 11:00",
    room: "A101",
    subject: "Mathematics",
  },
  {
    id: "3",
    date: "2025-05-15",
    time: "13:00 - 15:00",
    room: "B202",
    subject: "Calculus",
  },
]

export default function InvigilatorDetailsPage({ params }: { params: { id: string } }) {
  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between py-4 border-b sticky top-0 bg-white z-10 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/invigilators">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold">Invigilator Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <EditInvigilatorDialog invigilator={invigilator} />
            <DeleteInvigilatorDialog invigilatorId={invigilator.id} />
          </div>
        </div>

        <div className="grid gap-6 p-4 md:p-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{invigilator.name}</CardTitle>
                    <CardDescription>{invigilator.department}</CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      invigilator.status === "Available"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                    }
                  >
                    {invigilator.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">{invigilator.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground">{invigilator.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Office</p>
                      <p className="text-muted-foreground">{invigilator.office}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Joined Date</p>
                      <p className="text-muted-foreground">{new Date(invigilator.joined_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assigned Exams</CardTitle>
                <CardDescription>Exams this invigilator is assigned to</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Room</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedExams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
                          <TableCell>{exam.time}</TableCell>
                          <TableCell>{exam.subject}</TableCell>
                          <TableCell>{exam.room}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="ml-auto" asChild>
                  <Link href="/admin/exams">View All Exams</Link>
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
                <p>{invigilator.department}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href={`/admin/invigilators/${invigilator.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Invigilator
                  </Link>
                </Button>
                <Button variant="outline" className="w-full">
                  Send Notification
                </Button>
                <Button variant="outline" className="w-full">
                  View Schedule
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge
                      variant="outline"
                      className={
                        invigilator.status === "Available"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      }
                    >
                      {invigilator.status}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Assigned Exams:</span>
                    <span>{assignedExams.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
