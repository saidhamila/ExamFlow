import { getExamsForDirecteurValidation } from '@/lib/data';
import { ValidationStatus } from '@prisma/client'; // Keep for potential future use if needed
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ValidationForm } from '@/components/chef/validation-form'; // Reuse the same form component

export default async function DirecteurDashboardPage() {
    // TODO: Replace with actual user ID from authentication
    const directeurUserId = "placeholder-directeur-id"; // Example placeholder

    const examsToValidate = await getExamsForDirecteurValidation(directeurUserId);

    console.log(`Directeur Dashboard: Found ${examsToValidate.length} exams to validate for user ${directeurUserId}`);

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Directeur Dashboard - Exams Awaiting Final Validation</h1>

            {examsToValidate.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Exams Pending Final Validation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>There are currently no exams awaiting your final validation.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Final Validation</CardTitle>
                        <CardDescription>Review and provide final validation or refusal for the following exams.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Rooms</TableHead>
                                    <TableHead>Invigilators</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {examsToValidate.map((exam) => (
                                    <TableRow key={exam.examId}>
                                        <TableCell className="font-medium">{exam.subject}</TableCell>
                                        <TableCell>{exam.department?.name ?? 'N/A'}</TableCell>
                                        <TableCell>{format(new Date(exam.examDate), 'PPP')}</TableCell>
                                        <TableCell>
                                            {format(new Date(exam.startTime), 'p')} - {format(new Date(exam.endTime), 'p')}
                                        </TableCell>
                                        <TableCell>
                                            {exam.examRooms.map(er => er.room?.roomName ?? 'N/A').join(', ')}
                                        </TableCell>
                                        <TableCell>
                                            {exam.invigilators.map(inv => inv.user?.name ?? 'N/A').join(', ')}
                                        </TableCell>
                                        <TableCell>
                                            <ValidationForm examId={exam.examId} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}