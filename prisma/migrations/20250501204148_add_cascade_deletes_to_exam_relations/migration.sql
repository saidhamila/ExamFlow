-- DropForeignKey
ALTER TABLE "exam_rooms" DROP CONSTRAINT "exam_rooms_exam_id_fkey";

-- DropForeignKey
ALTER TABLE "exam_students" DROP CONSTRAINT "exam_students_exam_id_fkey";

-- DropForeignKey
ALTER TABLE "invigilators" DROP CONSTRAINT "invigilators_exam_id_fkey";

-- DropForeignKey
ALTER TABLE "validations" DROP CONSTRAINT "validations_exam_id_fkey";

-- AddForeignKey
ALTER TABLE "exam_rooms" ADD CONSTRAINT "exam_rooms_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("exam_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invigilators" ADD CONSTRAINT "invigilators_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("exam_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_students" ADD CONSTRAINT "exam_students_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("exam_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validations" ADD CONSTRAINT "validations_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("exam_id") ON DELETE CASCADE ON UPDATE CASCADE;
