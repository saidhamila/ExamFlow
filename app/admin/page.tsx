import Link from "next/link"
import { Calendar, Users, Clock, School, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { UpcomingExams } from "@/components/upcoming-exams"
import { InvigilatorStats } from "@/components/invigilator-stats"
import { RecentActivity } from "@/components/recent-activity"
// Import getNotifications
import { getDashboardStats, getUpcomingExams, getRecentActivity, getInvigilatorStatsData, getNotifications } from "@/lib/data" // Import data functions
// Removed incorrect import: import type { Exam } from "@/lib/data"
import type { Exam as PrismaExam } from "@prisma/client"; // Import correct type

// Update the top section to be responsive with the new fixed sidebar
export default async function AdminDashboardPage() { // Make component async

  // Fetch data in parallel, including notifications
  const [stats, upcomingExams, recentActivity, invigilatorStatsData, notifications] = await Promise.all([
    getDashboardStats(),
    getUpcomingExams(7), // Fetch exams for the next 7 days
    getRecentActivity(5), // Fetch last 5 activities
    getInvigilatorStatsData(), // Fetch invigilator stats
    getNotifications() // Fetch notifications
  ]);

  return (
    // Pass notifications to the layout
    <AdminLayout notifications={notifications}>
      {/* Replace wrapper class with the one from departments/rooms page */}
      <div className="space-y-6">
        <div className="flex items-center justify-between py-4 border-b sticky top-0 bg-white z-10 px-4 md:px-6">
          <h1 className="text-xl xs:text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="text-xs xs:text-sm">
              <Link href="/admin/exams">View All Exams</Link>
            </Button>
          </div>
        </div>

        {/* Use fetched stats data */}
        {/* Remove p-4 md:p-6 */}
        <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExams}</div>
              <p className="text-xs text-muted-foreground">{stats.examChange} from last semester</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Invigilators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeInvigilators}</div>
              <p className="text-xs text-muted-foreground">{stats.invigilatorChange} new this semester</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingExamsCount}</div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDepartments}</div>
              <p className="text-xs text-muted-foreground">Participating in exams</p>
            </CardContent>
          </Card>
        </div>

        {/* Remove p-4 md:p-6 */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Upcoming Exams</CardTitle>
              <CardDescription>Overview of exams scheduled in the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Pass upcomingExams data as prop */}
              <UpcomingExams exams={upcomingExams} />
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <Link href="/admin/exams">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Invigilator Availability</CardTitle>
              <CardDescription>Current status of invigilators</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Pass fetched data to InvigilatorStats */}
              <InvigilatorStats data={invigilatorStatsData} />
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <Link href="/admin/invigilators">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Remove p-4 md:p-6 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest changes to exams and invigilators</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Pass recentActivity data as prop */}
              <RecentActivity activities={recentActivity} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
