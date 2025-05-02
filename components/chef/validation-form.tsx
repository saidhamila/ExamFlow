'use client';

import { recordValidationAction } from '@/lib/actions';
import { ValidationStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { toast } from "sonner";

// Initial state for useFormState
const initialState: { success: boolean; message: string } = {
    success: false,
    message: "",
};

// Separate component for submit buttons to use useFormStatus
function SubmitButtons() {
    const { pending } = useFormStatus();
    return (
        <div className="flex gap-2">
            <Button type="submit" name="status" value={ValidationStatus.VALIDÉ} variant="default" size="sm" disabled={pending}>
                {pending ? 'Validating...' : 'Validate'}
            </Button>
            <Button type="submit" name="status" value={ValidationStatus.REFUSÉ} variant="destructive" size="sm" disabled={pending}>
                {pending ? 'Refusing...' : 'Refuse'}
            </Button>
        </div>
    );
}

export function ValidationForm({ examId }: { examId: string }) {
    const formRef = useRef<HTMLFormElement>(null);
    // useFormState takes the action and initial state
    const [state, formAction] = useFormState(recordValidationAction, initialState);

    // Show toast message on state change
    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast.success(state.message);
                formRef.current?.reset(); // Reset form on success
            } else {
                toast.error(state.message);
            }
        }
    }, [state]);

    return (
        // Pass the formAction returned by useFormState to the action prop
        <form ref={formRef} action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="examId" value={examId} />
            <Textarea name="comments" placeholder="Optional comments..." rows={2} />
            <SubmitButtons /> {/* Use the separate component for buttons */}
        </form>
    );
}