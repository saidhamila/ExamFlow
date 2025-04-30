"use client"

import { useState, useEffect, useTransition } from "react"
import { Filter, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AddExamDialog } from "@/components/add-exam-dialog"
import { EditExamDialog } from "@/components/edit-exam-dialog"
import { DeleteExamDialog } from "@/components/delete-exam-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Exam, Invigilator } from "@/lib/data" // Import types
import { deleteExamAction, getInvigilatorOptionsAction } from "@/lib/actions" // Import server actions

// Define props for the client component
interface ExamTableClientProps {
  initialExams: Exam[];
  // We might pass invigilator options fetched on the server later
}

import { format } from 'date-fns'; // Import date-fns format function

// Remove the old formatDate helper

export function ExamTableClient({ initialExams }: ExamTableClientProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition(); // For delete action loading state

  // State for exams (initial + filtered)
  const [exams, setExams] = useState(initialExams) // Keep original list if needed, maybe remove later
  const [filteredExams, setFilteredExams] = useState(initialExams)

  // State for filters
  const [filters, setFilters] = useState({
    subject: "all", // Use courseName or courseCode? Let's use courseName for now
    dateRange: "all",
    invigilator: "all", // This should filter by invigilator ID eventually
  })

  // State for invigilator options (fetched from server action)
  const [invigilatorOptions, setInvigilatorOptions] = useState<{ value: string; label: string }[]>([]);

  // Fetch invigilator options on component mount
  useEffect(() => {
    getInvigilatorOptionsAction().then(options => {
      setInvigilatorOptions(options);
    });
  }, []);


  // Update filtered list when initialExams prop changes (e.g., after add/update)
  // This might not be needed if revalidation works correctly, but can be a fallback
  useEffect(() => {
    setExams(initialExams);
    applyFilters(filters, initialExams); // Re-apply filters when initial data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialExams]); // Dependency on initialExams

  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [filterType]: value }
    setFilters(newFilters)
    applyFilters(newFilters, exams) // Apply filters to the current full list
  }

  // Apply filters to a given list of exams
  const applyFilters = (currentFilters: typeof filters, sourceExams: Exam[]) => {
    let result = [...sourceExams]

    // Apply subject (courseName) filter
    if (currentFilters.subject !== "all") {
      result = result.filter((exam) => exam.courseName === currentFilters.subject)
    }

    // Apply date range filter
    if (currentFilters.dateRange !== "all") {
      const today = new Date(); today.setHours(0,0,0,0); // Start of today
      const endOfToday = new Date(); endOfToday.setHours(23,59,59,999); // End of today

      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()) + 1); // End of current week (Sunday)
      endOfWeek.setHours(23,59,59,999);

      const endOfNextWeek = new Date(endOfWeek);
      endOfNextWeek.setDate(endOfWeek.getDate() + 7);

      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
      endOfMonth.setHours(23,59,59,999);


      switch (currentFilters.dateRange) {
        case "this-week":
          result = result.filter((exam) => {
            // Use dateTime directly
            const examDate = exam.dateTime;
            return examDate >= today && examDate <= endOfWeek
          })
          break
        case "next-week":
           result = result.filter((exam) => {
            // Use dateTime directly
            const examDate = exam.dateTime;
            return examDate > endOfWeek && examDate <= endOfNextWeek
          })
          break
        case "this-month":
          result = result.filter((exam) => {
            // Use dateTime directly
            const examDate = exam.dateTime;
            return examDate >= today && examDate <= endOfMonth
          })
          break
      }
    }

    // Apply invigilator filter (by ID)
    if (currentFilters.invigilator !== "all") {
      // Filter based on invigilator ID within the invigilators array
      result = result.filter((exam) => exam.invigilators.some(inv => inv.id === currentFilters.invigilator))
    }

    setFilteredExams(result)
  }

  // --- CRUD Handlers ---
  // Add/Update are handled directly by the dialogs calling server actions now
  // Delete needs a handler here to use startTransition

  const handleDeleteExam = (examId: string) => {
    startTransition(async () => {
      const result = await deleteExamAction(examId);
      if (result?.message) {
        toast({
          title: result.message.includes("success") ? "Success" : "Error",
          description: result.message,
          variant: result.message.includes("success") ? "default" : "destructive",
        });
        // Revalidation should update the list via the initialExams prop change
      }
    });
  };


  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Date", "Time", "Duration (min)", "Room", "Course Code", "Course Name", "Department", "Invigilator IDs"]
    const csvContent = [
      headers.join(","),
      ...filteredExams.map((exam) =>
        [
          format(exam.dateTime, 'yyyy-MM-dd'), // Format date from dateTime
          format(exam.dateTime, 'HH:mm'), // Format time from dateTime
          exam.duration,
          exam.room,
          `"${exam.courseCode}"`,
          `"${exam.courseName}"`,
          `"${exam.department}"`,
          `"${exam.invigilators.join(';')}"`, // Join IDs with semicolon
        ].join(","),
      ),
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "exams_export.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export successful",
      description: "Filtered exams have been exported to CSV",
    })
  }

  // Get unique subjects for filter dropdown
  const subjectOptions = Array.from(new Set(initialExams.map(e => e.courseName)));

  return (
    <div className="flex flex-col h-full">
      {/* Header with Add/Export buttons */}
      <div className="flex flex-col xs:flex-row items-center justify-between py-4 border-b sticky top-0 bg-white z-10 px-4 md:px-6">
        <h1 className="text-xl xs:text-2xl font-semibold mb-2 xs:mb-0">Exam Management</h1>
        <div className="flex items-center gap-2 w-full xs:w-auto justify-end">
          {/* Pass invigilator options to Add dialog */}
          <AddExamDialog invigilatorOptions={invigilatorOptions} />
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={exportToCSV}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          {/* Filter button might be removed if filters are always visible */}
          {/* <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button> */}
        </div>
      </div>

      {/* Filters and Table Card */}
      <Card className="m-4 md:m-6">
        <CardContent className="p-0">
          {/* Filters Section */}
          <div className="border-b p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Subject Filter */}
              <div className="space-y-2">
                <Label htmlFor="subject-filter">Subject</Label>
                <Select value={filters.subject} onValueChange={(value) => handleFilterChange("subject", value)}>
                  <SelectTrigger id="subject-filter">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjectOptions.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label htmlFor="date-filter">Date Range</Label>
                <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
                  <SelectTrigger id="date-filter">
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="next-week">Next Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Invigilator Filter */}
              <div className="space-y-2">
                <Label htmlFor="invigilator-filter">Invigilator</Label>
                <Select
                  value={filters.invigilator}
                  onValueChange={(value) => handleFilterChange("invigilator", value)}
                >
                  <SelectTrigger id="invigilator-filter">
                    <SelectValue placeholder="All Invigilators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Invigilators</SelectItem>
                    {invigilatorOptions.map(opt => (
                       <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date / Time</TableHead>
                  <TableHead className="whitespace-nowrap hidden xs:table-cell">Room</TableHead>
                  <TableHead className="whitespace-nowrap">Course</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">Invigilators</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.length > 0 ? (
                  filteredExams.map((exam) => (
                    <TableRow key={exam.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        {/* Format dateTime using date-fns */}
                        <div className="font-medium">{format(exam.dateTime, 'PPP')}</div>
                        <div className="text-sm text-muted-foreground">{format(exam.dateTime, 'p')} ({exam.duration} min)</div>
                      </TableCell>
                      <TableCell className="hidden xs:table-cell">{exam.room}</TableCell>
                      <TableCell>
                        <div className="font-medium">{exam.courseName}</div>
                        <div className="text-sm text-muted-foreground">{exam.courseCode}</div>
                        <div className="text-xs text-muted-foreground">{exam.department}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {/* Display invigilator names */}
                        {exam.invigilators.map(inv => inv.name).join(', ')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Pass invigilator options to Edit dialog */}
                          <EditExamDialog exam={exam} invigilatorOptions={invigilatorOptions} />
                          {/* Use the handler for delete */}
                          <DeleteExamDialog
                            examId={exam.id}
                            examName={`${exam.courseCode} - ${exam.courseName}`}
                            onDelete={() => handleDeleteExam(exam.id)}
                            isDeleting={isPending} // Pass loading state
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No exams found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Section (Placeholder) */}
          <div className="flex flex-col xs:flex-row items-center justify-between p-4 border-t gap-4 xs:gap-2">
            <div className="flex items-center gap-2">
              <Select defaultValue="10">
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">items per page</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">Page 1 of 1</span> {/* Needs dynamic update */}
              <Button variant="outline" size="icon" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}