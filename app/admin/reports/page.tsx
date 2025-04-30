// Removed "use client" - This is now a Server Component

import { Download, FileText, BarChart, PieChart, Calendar, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Removed Select components as period filtering is not implemented server-side yet
import { AdminLayout } from "@/components/admin-layout"
import { ExamDistributionChart } from "@/components/exam-distribution-chart"
import { InvigilatorWorkloadChart } from "@/components/invigilator-workload-chart"
import { RoomUtilizationChart } from "@/components/room-utilization-chart"
// Removed useToast as it's client-side
import {
  getExamDistributionData,
  getInvigilatorWorkloadData,
  getRoomUtilizationData,
  getDashboardStats, // Assuming this fetches necessary overview stats like totalExams, totalDepartments
  getNotifications // Import notification fetching function
} from "@/lib/data"

// Make component async to fetch data
export default async function ReportsPage() {

  // Fetch data concurrently
  const [
    examDistributionData,
    invigilatorWorkloadData,
    roomUtilizationData,
    dashboardStats, // Fetch overview stats
    notifications // Fetch notifications
  ] = await Promise.all([
    getExamDistributionData(),
    getInvigilatorWorkloadData(),
    getRoomUtilizationData(),
    getDashboardStats(), // Fetch stats needed for overview cards
    getNotifications() // Fetch notifications
  ]);

  // Calculate total invigilator hours from workload data
  const totalInvigilatorHours = invigilatorWorkloadData.reduce((sum, inv) => sum + inv.value, 0).toFixed(1);
  // Calculate room utilization percentage (example: rooms used / total unique rooms in exams)
  // This requires knowing total available rooms or basing it on rooms present in exams
  const totalRoomsUsedCount = roomUtilizationData.length;
  // Placeholder for total available rooms - needs a better way to determine this
  const totalAvailableRooms = 10; // Example placeholder
  const roomUtilizationPercent = totalAvailableRooms > 0
    ? ((totalRoomsUsedCount / totalAvailableRooms) * 100).toFixed(0)
    : 0;


  // Export function needs to be handled differently (e.g., API route or server action)
  // const exportReport = (reportType: string) => { ... }

  return (
    // Pass notifications to the layout
    <AdminLayout notifications={notifications}>
      <div className="flex flex-col h-full">
        {/* Header - Removed period select and client-side export button */}
        <div className="flex flex-col xs:flex-row items-center justify-between py-4 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 px-4 md:px-6">
          <h1 className="text-xl xs:text-2xl font-semibold mb-2 xs:mb-0">Reports & Analytics</h1>
          {/* Add server-side export options later if needed */}
        </div>

        <div className="p-4 md:p-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto"> {/* Allow wrapping */}
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span className="hidden xs:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="exams" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden xs:inline">Exams</span>
              </TabsTrigger>
              <TabsTrigger value="invigilators" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                <span className="hidden xs:inline">Invigilators</span>
              </TabsTrigger>
              <TabsTrigger value="rooms" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden xs:inline">Rooms</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Overview Stats Cards - Use fetched data */}
              <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalExams}</div>
                    {/* <p className="text-xs text-muted-foreground">+2 from last semester</p> */}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Invigilator Hours</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalInvigilatorHours}</div>
                    {/* <p className="text-xs text-muted-foreground">+5 from last semester</p> */}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Room Utilization</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{roomUtilizationPercent}%</div>
                    <p className="text-xs text-muted-foreground">{totalRoomsUsedCount} rooms used</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Departments</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalDepartments}</div>
                    {/* <p className="text-xs text-muted-foreground">Same as last semester</p> */}
                  </CardContent>
                </Card>
              </div>

              {/* Overview Charts - Pass fetched data */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Exam Distribution</CardTitle>
                    <CardDescription>Number of exams by department</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ExamDistributionChart data={examDistributionData} />
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Invigilator Workload</CardTitle>
                    <CardDescription>Hours assigned per invigilator</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <InvigilatorWorkloadChart data={invigilatorWorkloadData} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Exams Tab */}
            <TabsContent value="exams" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Exam Statistics</CardTitle>
                  <CardDescription>Detailed breakdown of exam data by department</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ExamDistributionChart data={examDistributionData} />
                </CardContent>
                {/* <CardFooter>
                  <Button variant="outline" className="ml-auto" onClick={() => exportReport("Exam Statistics")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </CardFooter> */}
              </Card>
            </TabsContent>

            {/* Invigilators Tab */}
            <TabsContent value="invigilators" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Invigilator Workload Analysis</CardTitle>
                  <CardDescription>Distribution of exam supervision hours</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <InvigilatorWorkloadChart data={invigilatorWorkloadData} />
                </CardContent>
                 {/* <CardFooter>
                  <Button variant="outline" className="ml-auto" onClick={() => exportReport("Invigilator Workload")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </CardFooter> */}
              </Card>
            </TabsContent>

            {/* Rooms Tab */}
            <TabsContent value="rooms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Room Utilization</CardTitle>
                  <CardDescription>Number of exams held per room</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <RoomUtilizationChart data={roomUtilizationData} />
                </CardContent>
                 {/* <CardFooter>
                  <Button variant="outline" className="ml-auto" onClick={() => exportReport("Room Utilization")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </CardFooter> */}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  )
}
