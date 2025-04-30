import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Exam } from "@/lib/data" // Import the Exam type
import { format } from 'date-fns' // Import date-fns for formatting

// Define props interface
interface UpcomingExamsProps {
  exams: Exam[];
}

export function UpcomingExams({ exams }: UpcomingExamsProps) { // Accept exams prop

  return (
    <div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Date & Time</TableHead>
              <TableHead className="whitespace-nowrap">Course</TableHead>
              <TableHead className="whitespace-nowrap hidden xs:table-cell">Room</TableHead>
              <TableHead className="whitespace-nowrap hidden sm:table-cell">Invigilators</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                  No upcoming exams in the next 7 days.
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    {/* Format dateTime using date-fns */}
                    <div className="font-medium">{format(new Date(exam.dateTime), 'PP')}</div> {/* e.g., Sep 6, 2025 */}
                    <div className="text-sm text-muted-foreground">{format(new Date(exam.dateTime), 'p')} ({exam.duration} min)</div> {/* e.g., 1:00 PM */}
                  </TableCell>
                  <TableCell>
                     <div className="font-medium">{exam.courseName}</div>
                     <div className="text-sm text-muted-foreground">{exam.courseCode}</div>
                  </TableCell>
                  <TableCell className="hidden xs:table-cell">{exam.room}</TableCell>
                  {/* Display invigilator names */}
                  <TableCell className="hidden sm:table-cell">
                    {exam.invigilators.map(inv => inv.name).join(', ') || <span className="text-muted-foreground">None</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
