"use client"

import { useState, useEffect, useTransition } from "react"
import { Filter, Download, ChevronLeft, ChevronRight, Loader2, Copy } from "lucide-react" // Added Copy icon

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input" // Added Input import
import { AddExamDialog } from "@/components/add-exam-dialog"
import { EditExamDialog } from "@/components/edit-exam-dialog"
import { DeleteExamDialog } from "@/components/delete-exam-dialog"
import { useToast } from "@/hooks/use-toast"
import type { ExamWithDetails, PaginatedExamsResult, ExamFilters, PaginationOptions } from "@/lib/data" // Import detailed Exam type AND pagination/filter types
import { deleteExamAction, duplicateExamAction, getFilteredPaginatedExamsAction } from "@/lib/actions" // Added duplicateExamAction AND the new fetch action
// Remove useSessionData import

// Define props for the client component
// Define a shared Option type if not already available globally
type Option = { value: string; label: string };

interface ExamTableClientProps {
  initialPaginatedExams: PaginatedExamsResult; // Expect paginated result
  departmentOptions: Option[]; // Add back prop
  roomOptions: Option[]; // Add back prop
  invigilatorOptions: Option[];
}

import { format } from 'date-fns'; // Import date-fns format function

// Remove the old formatDate helper

export function ExamTableClient({
    initialPaginatedExams, // Use initial paginated data
    departmentOptions, // Add back prop
    roomOptions, // Add back prop
    invigilatorOptions
}: ExamTableClientProps) {
  // Remove useSessionData hook call
  const { toast } = useToast()
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isDuplicating, startDuplicateTransition] = useTransition();
  const [isFetching, startFetchingTransition] = useTransition(); // Loading state for fetching

  // State for exams displayed in the table
  const [exams, setExams] = useState<ExamWithDetails[]>(initialPaginatedExams.exams);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(initialPaginatedExams.currentPage);
  const [totalPages, setTotalPages] = useState(initialPaginatedExams.totalPages);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default items per page

  // State for filters
  const [filters, setFilters] = useState<ExamFilters>({ // Use ExamFilters type
    subject: "all",
    dateRange: "all",
    departmentId: "all",
    roomId: "all",
    invigilatorId: "all",
  })

  // No need to fetch options internally anymore


  // Function to fetch exams based on current state
  const fetchExams = () => {
    startFetchingTransition(async () => {
      const paginationOptions: PaginationOptions = { page: currentPage, limit: itemsPerPage };
      const result = await getFilteredPaginatedExamsAction(filters, paginationOptions);
      setExams(result.exams);
      setTotalPages(result.totalPages);
      // Ensure currentPage is updated if it was out of bounds after filtering/deletion
      if (result.currentPage !== currentPage) {
          setCurrentPage(result.currentPage);
      }
    });
  };

  // Fetch data when filters or pagination change
  useEffect(() => {
    fetchExams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage, itemsPerPage]); // Re-fetch when these change

  // Update initial state if the prop changes (e.g., after server-side revalidation on add/delete)
   useEffect(() => {
    setExams(initialPaginatedExams.exams);
    setCurrentPage(initialPaginatedExams.currentPage);
    setTotalPages(initialPaginatedExams.totalPages);
  }, [initialPaginatedExams]);


  // Handlers for filter and pagination changes
  const handleFilterChange = (filterType: keyof ExamFilters, value: string) => {
    setFilters(prevFilters => ({ ...prevFilters, [filterType]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10));
    setCurrentPage(1); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --- CRUD Handlers ---
  // Add/Update are handled directly by the dialogs calling server actions now
  // Delete needs a handler here to use startTransition

  const handleDeleteExam = (examId: string) => {
    startDeleteTransition(async () => { // Use specific transition
      const result = await deleteExamAction(examId);
      if (result?.message) {
        toast({
          title: result.message.includes("success") ? "Success" : "Error",
          description: result.message,
          variant: result.message.includes("success") ? "default" : "destructive",
        });
        // Re-fetch data after successful delete
        fetchExams();
      }
    });
  };

  // Handler for duplicating an exam
  const handleDuplicateExam = (examId: string) => {
      startDuplicateTransition(async () => {
          const result = await duplicateExamAction(examId);
          if (result?.success) {
              toast({
                  title: "Success",
                  description: result.message,
              });
              // Re-fetch data after successful duplication
              fetchExams();
          } else {
              toast({
                  title: "Error Duplicating Exam",
                  description: result?.message || "An unknown error occurred.",
                  variant: "destructive",
              });
          }
      });
  };


  const exportToCSV = () => {
    // Create CSV content
    const headers = ["ExamID", "Subject", "Department", "Date", "StartTime", "EndTime", "Rooms", "Invigilators"];
    const csvContent = [
      headers.join(","),
      // Export currently displayed exams
      ...exams.map((exam) => {
          const roomNames = exam.examRooms.map(er => er.room?.roomName ?? 'N/A').join('; ');
          const invigilatorNames = exam.invigilators.map(inv => inv.user?.name ?? inv.user?.email ?? 'N/A').join('; ');
          return [
              exam.examId,
              `"${exam.subject}"`,
              `"${exam.department?.name ?? 'N/A'}"`,
              format(new Date(exam.examDate), 'yyyy-MM-dd'),
              format(new Date(exam.startTime), 'HH:mm'),
              format(new Date(exam.endTime), 'HH:mm'),
              `"${roomNames}"`,
              `"${invigilatorNames}"`,
          ].join(",");
      }),
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
  // Subject options might need to be fetched separately or passed down if they shouldn't depend on the current page's exams
  // For now, derive from the current page's exams (might be incomplete)
  const subjectOptions = Array.from(new Set(exams.map(e => e.subject)));

  // Remove mapping logic for departmentOptions and roomOptions

  return (
    // Apply the consistent wrapper class
    <div className="space-y-6">
      {/* Header with Add/Export buttons */}
      {/* Remove horizontal padding (px-4 md:px-6) */}
      <div className="flex flex-col xs:flex-row items-center justify-between py-4 border-b sticky top-0 bg-white z-10">
        <h1 className="text-xl xs:text-2xl font-semibold mb-2 xs:mb-0">Exam Management</h1>
        <div className="flex items-center gap-2 w-full xs:w-auto justify-end">
          {/* Pass props back to AddExamDialog */}
          <AddExamDialog
            departmentOptions={departmentOptions}
            roomOptions={roomOptions}
            invigilatorOptions={invigilatorOptions}
          />
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
      {/* Remove margins (m-4 md:m-6) */}
      <Card>
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
                    {/* Use SelectItem for subjects */}
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
              {/* Department Filter */}
              <div className="space-y-2">
                <Label htmlFor="department-filter">Department</Label>
                <Select value={filters.departmentId} onValueChange={(value) => handleFilterChange("departmentId", value)}>
                  <SelectTrigger id="department-filter">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departmentOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Room Filter */}
              <div className="space-y-2">
                <Label htmlFor="room-filter">Room</Label>
                <Select value={filters.roomId} onValueChange={(value) => handleFilterChange("roomId", value)}>
                  <SelectTrigger id="room-filter">
                    <SelectValue placeholder="All Rooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    {roomOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Invigilator Filter */}
              <div className="space-y-2">
                <Label htmlFor="invigilator-filter">Invigilator</Label>
                <Select value={filters.invigilatorId} onValueChange={(value) => handleFilterChange("invigilatorId", value)}>
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
                  <TableHead className="whitespace-nowrap">Subject / Dept</TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">Rooms</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">Invigilators</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                    </TableRow>
                ) : exams.length > 0 ? (
                  exams.map((exam) => (
                    <TableRow key={exam.examId} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        {/* Format examDate and times */}
                        <div className="font-medium">{format(new Date(exam.examDate), 'PPP')}</div>
                        <div className="text-sm text-muted-foreground">
                            {format(new Date(exam.startTime), 'p')} - {format(new Date(exam.endTime), 'p')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{exam.subject}</div>
                        <div className="text-xs text-muted-foreground">{exam.department?.name ?? 'N/A'}</div>
                        {/* Show rooms/invigilators on smaller screens */}
                        <div className="text-xs text-muted-foreground md:hidden mt-1">
                            Rooms: {exam.examRooms.map(er => er.room?.roomName ?? '?').join(', ')}
                        </div>
                         <div className="text-xs text-muted-foreground sm:hidden mt-1">
                            Invigilators: {exam.invigilators.map(inv => inv.user?.name ?? inv.user?.email ?? '?').join(', ')}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {exam.examRooms.map(er => er.room?.roomName ?? 'N/A').join(', ')}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">
                        {/* Display invigilator names */}
                        {exam.invigilators.map(inv => inv.user?.name ?? inv.user?.email ?? 'N/A').join(', ')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Pass props back to EditExamDialog */}
                          <EditExamDialog
                            exam={exam}
                            departmentOptions={departmentOptions}
                            roomOptions={roomOptions}
                            invigilatorOptions={invigilatorOptions}
                          />
                          {/* Duplicate Button */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDuplicateExam(exam.examId)}
                            disabled={isDuplicating} // Disable while duplicating
                            title="Duplicate Exam"
                          >
                            {isDuplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                            <span className="sr-only">Duplicate</span>
                          </Button>
                          {/* Delete Button */}
                          <DeleteExamDialog
                            examId={exam.examId}
                            examName={exam.subject}
                            onDelete={() => handleDeleteExam(exam.examId)}
                            isDeleting={isDeleting} // Pass delete loading state
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No exams found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Section (Placeholder) */}
          <div className="flex flex-col xs:flex-row items-center justify-between p-4 border-t gap-4 xs:gap-2">
            <div className="flex items-center gap-2">
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isFetching}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isFetching}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}