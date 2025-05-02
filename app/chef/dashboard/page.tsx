import { getExamsForChefValidation } from '@/lib/data';
import { ValidationStatus } from '@prisma/client'; // Keep this if needed elsewhere, otherwise remove
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ValidationForm } from '@/components/chef/validation-form'; // Import the client component

// Removed inline ValidationForm definition

export default async function ChefDashboardPage() {
    // TODO: Replace with actual user ID from authentication
    const chefUserId = "placeholder-chef-id"; // Example placeholder

    const examsToValidate = await getExamsForChefValidation(chefUserId);

    console.log(`Chef Dashboard: Found ${examsToValidate.length} exams to validate for user ${chefUserId}`);

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Chef Dashboard - Exams Awaiting Validation</h1>

            {examsToValidate.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Exams Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>There are currently no exams in your department awaiting your validation.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Exams</CardTitle>
                        <CardDescription>Review and validate or refuse the following exams from your department.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
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