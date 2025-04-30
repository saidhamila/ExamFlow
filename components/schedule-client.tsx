"use client" // This component handles client-side interactivity

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronUp, Filter, Search, X, CalendarDays, Download, Loader2 } from "lucide-react"
import { format, addDays, startOfDay, endOfDay, endOfMonth } from 'date-fns'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import type { Exam } from "@/lib/data" // Import only the type

// Interface for the props, including the initial exams fetched by the server component
interface ScheduleClientProps {
  initialExams: Exam[];
}

export function ScheduleClient({ initialExams }: ScheduleClientProps) {
  const { toast } = useToast()
  // Initialize state with the data passed from the server component
  const [allExams, setAllExams] = useState<Exam[]>(initialExams)
  const [isLoading, setIsLoading] = useState(false) // Loading state might still be useful for client-side actions if any
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<{
    courseName: string | null
    dateRange: string | null
    invigilatorId: string | null
  }>({
    courseName: null,
    dateRange: null,
    invigilatorId: null,
  })
  const [filteredData, setFilteredData] = useState<Exam[]>([])
  const [groupedSchedule, setGroupedSchedule] = useState<Record<string, Exam[]>>({})

  // Effect to update filtered data when filters or allExams change
  useEffect(() => {
    setIsLoading(true); // Indicate filtering is happening
    let result = [...allExams]

    // Apply search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      result = result.filter(
        (exam) =>
          exam.courseName.toLowerCase().includes(lowerSearchTerm) ||
          exam.courseCode.toLowerCase().includes(lowerSearchTerm) ||
          exam.room.toLowerCase().includes(lowerSearchTerm) ||
          exam.invigilators.some(inv => inv.name.toLowerCase().includes(lowerSearchTerm)),
      )
    }

    // Apply courseName filter
    if (activeFilters.courseName) {
      result = result.filter((exam) => exam.courseName === activeFilters.courseName)
    }

    // Apply invigilator filter (by ID)
    if (activeFilters.invigilatorId) {
      result = result.filter((exam) =>
        exam.invigilators.some(inv => inv.id === activeFilters.invigilatorId)
      )
    }

    // Apply date range filter
    if (activeFilters.dateRange) {
      const today = startOfDay(new Date())
      const nextWeek = endOfDay(addDays(today, 6))
      const startOfNextWeek = addDays(nextWeek, 1)
      const endOfFollowingWeek = endOfDay(addDays(startOfNextWeek, 6))

      switch (activeFilters.dateRange) {
        case "This Week":
          result = result.filter((exam) => {
            const examDate = new Date(exam.dateTime)
            return examDate >= today && examDate <= nextWeek
          })
          break
        case "Next Week":
           result = result.filter((exam) => {
            const examDate = new Date(exam.dateTime)
            return examDate >= startOfNextWeek && examDate <= endOfFollowingWeek
          })
          break
        case "This Month":
          result = result.filter((exam) => {
            const examDate = new Date(exam.dateTime)
            return examDate.getFullYear() === today.getFullYear() &&
                   examDate.getMonth() === today.getMonth() &&
                   examDate >= today
          })
          break
      }
    }

    setFilteredData(result)

    // Group by date for mobile view
    const grouped = result.reduce(
      (acc, exam) => {
        const dateStr = format(new Date(exam.dateTime), 'yyyy-MM-dd')
        if (!acc[dateStr]) {
          acc[dateStr] = []
        }
        acc[dateStr].push(exam)
        return acc
      },
      {} as Record<string, Exam[]>,
    )

    setGroupedSchedule(grouped)
    setIsLoading(false); // Filtering finished
  }, [searchTerm, activeFilters, allExams])

  const handleFilterChange = (type: "courseName" | "dateRange" | "invigilatorId", value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [type]: value || null,
    }))
  }

  const removeFilter = (type: "courseName" | "dateRange" | "invigilatorId") => {
    setActiveFilters((prev) => ({
      ...prev,
      [type]: null,
    }))
  }

  const clearAllFilters = () => {
    setActiveFilters({
      courseName: null,
      dateRange: null,
      invigilatorId: null,
    })
    setSearchTerm("")
  }

  const exportToCSV = () => {
    const headers = ["Date", "Time", "Course Name", "Course Code", "Room", "Invigilators"]
    const csvContent = [
      headers.join(","),
      ...filteredData.map((exam) => {
        const dateStr = format(new Date(exam.dateTime), 'yyyy-MM-dd');
        const timeStr = format(new Date(exam.dateTime), 'HH:mm');
        const invigilatorNames = exam.invigilators.map(inv => inv.name).join('; ');
        return [
          dateStr,
          timeStr,
          `"${exam.courseName}"`,
          exam.courseCode,
          exam.room,
          `"${invigilatorNames}"`,
        ].join(",");
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "exam_schedule.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export successful",
      description: "Your exam schedule has been exported to CSV",
    })
  }

  // --- Dynamic Filter Options ---
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([]);
  const [invigilatorOptions, setInvigilatorOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const uniqueCourses = Array.from(new Set(allExams.map(exam => exam.courseName)))
      .sort()
      .map(name => ({ value: name, label: name }));
    setCourseOptions(uniqueCourses);

    const uniqueInvigilators = Array.from(new Map(allExams.flatMap(exam => exam.invigilators).map(inv => [inv.id, inv])).values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(inv => ({ value: inv.id, label: inv.name }));
    setInvigilatorOptions(uniqueInvigilators);

  }, [allExams]);
  // --- End Dynamic Filter Options ---


  // The entire JSX structure is moved here
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col xs:flex-row items-center justify-between py-4 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 px-4 md:px-6">
        <h1 className="text-xl xs:text-2xl font-semibold mb-2 xs:mb-0">Exam Schedule</h1>
        <div className="flex items-center gap-2 w-full xs:w-auto justify-end flex-wrap">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search exams..."
              className="w-[200px] pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Calendar View Button */}
          <Button variant="outline" size="sm" asChild>
            <Link href="/schedule/calendar">
              <CalendarDays className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Calendar View</span>
            </Link>
          </Button>
          {/* Export Button */}
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={isLoading || filteredData.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          {/* Filter Sheet */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span className="hidden md:inline">Filter</span>
                {(activeFilters.courseName || activeFilters.dateRange || activeFilters.invigilatorId) && (
                   <span className="ml-1.5 h-2 w-2 rounded-full bg-primary"></span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Exams</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-4">
                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label htmlFor="date-filter">Date Range</Label>
                  <Select
                    value={activeFilters.dateRange || ""}
                    onValueChange={(value) => handleFilterChange("dateRange", value)}
                  >
                    <SelectTrigger id="date-filter">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="This Week">This Week</SelectItem>
                      <SelectItem value="Next Week">Next Week</SelectItem>
                      <SelectItem value="This Month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Course Name Filter */}
                <div className="space-y-2">
                  <Label htmlFor="course-filter">Course Name</Label>
                  <Select
                    value={activeFilters.courseName || ""}
                    onValueChange={(value) => handleFilterChange("courseName", value)}
                  >
                    <SelectTrigger id="course-filter">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.length > 0 ? (
                         courseOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No courses found</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Invigilator Filter */}
                <div className="space-y-2">
                  <Label htmlFor="invigilator-filter">Invigilator</Label>
                  <Select
                    value={activeFilters.invigilatorId || ""}
                    onValueChange={(value) => handleFilterChange("invigilatorId", value)}
                  >
                    <SelectTrigger id="invigilator-filter">
                      <SelectValue placeholder="Select invigilator" />
                    </SelectTrigger>
                    <SelectContent>
                       {invigilatorOptions.length > 0 ? (
                         invigilatorOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))
                       ) : (
                         <div className="px-2 py-1.5 text-sm text-muted-foreground">No invigilators found</div>
                       )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Apply Button */}
                <div className="pt-4">
                  <Button className="w-full" onClick={() => setIsFilterOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="p-4 md:hidden">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search exams..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Active Filter Badges */}
      {(activeFilters.courseName || activeFilters.dateRange || activeFilters.invigilatorId) && (
        <div className="px-4 py-2 flex flex-wrap gap-2 border-b">
          {activeFilters.courseName && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Course: {activeFilters.courseName}
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => removeFilter("courseName")}>
                <X className="h-3 w-3" /><span className="sr-only">Remove filter</span>
              </Button>
            </Badge>
          )}
          {activeFilters.dateRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Date: {activeFilters.dateRange}
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => removeFilter("dateRange")}>
                <X className="h-3 w-3" /><span className="sr-only">Remove filter</span>
              </Button>
            </Badge>
          )}
          {activeFilters.invigilatorId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Invigilator: {invigilatorOptions.find(opt => opt.value === activeFilters.invigilatorId)?.label || activeFilters.invigilatorId}
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => removeFilter("invigilatorId")}>
                <X className="h-3 w-3" /><span className="sr-only">Remove filter</span>
              </Button>
            </Badge>
          )}
          <Button variant="link" size="sm" className="h-6 text-xs px-1 text-muted-foreground" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-4 md:p-6 space-y-6 flex-1">
        {isLoading && filteredData.length === 0 ? ( // Show loader only if filtering is happening AND there's no data yet
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader className="sticky top-[calc(var(--header-height)+var(--filter-height))] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Time</TableHead>
                    <TableHead className="whitespace-nowrap">Course Name</TableHead>
                    <TableHead className="whitespace-nowrap">Course Code</TableHead>
                    <TableHead className="whitespace-nowrap hidden lg:table-cell">Room</TableHead>
                    <TableHead className="whitespace-nowrap hidden xl:table-cell">Invigilators</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((exam) => (
                      <TableRow key={exam.id} className="hover:bg-muted/50">
                        <TableCell>{format(new Date(exam.dateTime), 'PPP')}</TableCell>
                        <TableCell>{format(new Date(exam.dateTime), 'p')}</TableCell>
                        <TableCell>{exam.courseName}</TableCell>
                        <TableCell>{exam.courseCode}</TableCell>
                        <TableCell className="hidden lg:table-cell">{exam.room}</TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {exam.invigilators.map(inv => inv.name).join(', ')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/schedule/${exam.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {allExams.length === 0 ? "No exams scheduled yet." : "No exams found matching your filters."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-6">
              {Object.keys(groupedSchedule).length > 0 ? (
                Object.entries(groupedSchedule).map(([dateStr, exams]) => (
                  <div key={dateStr} className="space-y-3">
                    <div className="sticky top-[calc(var(--header-height)+var(--filter-height))] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 font-semibold text-lg border-b">
                      {format(new Date(dateStr), 'PPPP')}
                    </div>
                    {exams.map((exam) => (
                      <Card key={exam.id} className="shadow-sm">
                        <CardHeader className="py-3 px-4 bg-muted/50 font-medium">
                          <div className="flex justify-between items-center">
                            <div>
                              <div>{exam.courseName}</div>
                              <div className="text-xs text-muted-foreground">{exam.courseCode}</div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/schedule/${exam.id}`}>View</Link>
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y">
                            <div className="px-4 py-2 flex justify-between">
                              <span className="text-muted-foreground">Time</span>
                              <span>{format(new Date(exam.dateTime), 'p')}</span>
                            </div>
                            <div className="px-4 py-2 flex justify-between">
                              <span className="text-muted-foreground">Room</span>
                              <span>{exam.room}</span>
                            </div>
                            <div className="px-4 py-2 flex justify-between">
                              <span className="text-muted-foreground">Invigilators</span>
                              <span className="text-right">{exam.invigilators.map(inv => inv.name).join(', ')}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))
              ) : (
                 <div className="text-center py-8 text-muted-foreground">
                   {allExams.length === 0 ? "No exams scheduled yet." : "No exams found matching your filters."}
                 </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Scroll to Top Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 rounded-full shadow-md h-12 w-12 z-20"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ChevronUp className="h-6 w-6" />
      </Button>
    </div>
  )
}