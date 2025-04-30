"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, CalendarIcon, List } from "lucide-react"
import { format } from 'date-fns' // Import date-fns for formatting

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Exam, Invigilator } from "@prisma/client" // Import Prisma types

// Define the structure of exams passed as props (including invigilators)
type CalendarExam = Exam & { invigilators: Invigilator[] };

// Props for the client component
interface ScheduleCalendarClientProps {
  initialExams: CalendarExam[];
}

export function ScheduleCalendarClient({ initialExams }: ScheduleCalendarClientProps) {
  // Group exams by date string (YYYY-MM-DD)
  const examsByDate = initialExams.reduce(
    (acc, exam) => {
      const dateStr = format(exam.dateTime, 'yyyy-MM-dd'); // Use dateTime
      if (!acc[dateStr]) {
        acc[dateStr] = []
      }
      acc[dateStr].push(exam)
      return acc
    },
    {} as Record<string, CalendarExam[]>,
  )

  const [date, setDate] = useState<Date | undefined>(new Date()) // Default to today
  const [month, setMonth] = useState<Date>(new Date()) // Default to current month
  const [selectedExams, setSelectedExams] = useState<CalendarExam[]>([])

  // Handle date selection
  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setSelectedExams(examsByDate[dateStr] || [])
    } else {
      setSelectedExams([])
    }
  }

  // Custom day render function to show exam indicators
  const renderDay = (day: Date, modifiers: any) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const hasExams = examsByDate[dateStr] && examsByDate[dateStr].length > 0
    const examCount = hasExams ? examsByDate[dateStr].length : 0

    return (
      <div className="relative">
        <div
          className={cn(
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
            modifiers.selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            // Highlight days with exams even if not selected
            hasExams && !modifiers.selected && "border-2 border-blue-300", // Example highlight
          )}
        >
          {day.getDate()}
        </div>
        {hasExams && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <Badge
              variant="outline"
              className={cn(
                "h-4 min-w-4 px-1 text-[10px] flex items-center justify-center",
                modifiers.selected ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground",
              )}
            >
              {examCount}
            </Badge>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              {/* Display current month/year dynamically */}
              <CardTitle>{format(month, 'MMMM yyyy')}</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous month</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next month</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              month={month}
              onMonthChange={setMonth}
              className="rounded-md border"
              components={{
                Day: ({ date: day, ...props }) => renderDay(day, props),
              }}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {date ? (
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {format(date, 'PPPP')} {/* Use date-fns format */}
                </div>
              ) : (
                "Select a date to view exams"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedExams.length > 0 ? (
              <div className="space-y-4">
                {selectedExams.map((exam) => (
                  <Card key={exam.id} className="overflow-hidden">
                    <div className="bg-muted p-3 flex justify-between items-center">
                      <div>
                        {/* Use real data fields */}
                        <h3 className="font-medium">{exam.courseName}</h3>
                        <p className="text-sm text-muted-foreground">{exam.courseCode}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/schedule/${exam.id}`}>View Details</Link>
                      </Button>
                    </div>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-sm">
                        <div>
                          {/* Format time from dateTime */}
                          <span className="text-muted-foreground">Time:</span> {format(exam.dateTime, 'p')} ({exam.duration} mins)
                        </div>
                        <div>
                          <span className="text-muted-foreground">Room:</span> {exam.room}
                        </div>
                        <div className="col-span-1 xs:col-span-2">
                          <span className="text-muted-foreground">Invigilators:</span> {exam.invigilators.length > 0 ? exam.invigilators.map(inv => inv.name).join(', ') : 'N/A'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : date ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No exams scheduled</h3>
                <p className="text-muted-foreground mt-1">There are no exams scheduled for this date.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Select a date</h3>
                <p className="text-muted-foreground mt-1">
                  Select a date from the calendar to view scheduled exams.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}