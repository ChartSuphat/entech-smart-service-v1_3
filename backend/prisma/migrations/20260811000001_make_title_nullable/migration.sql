-- title column was created NOT NULL but schema defines it as optional (String?)
-- Fix the mismatch so controller can create records without supplying a title
ALTER TABLE "work_assignments" ALTER COLUMN "title" DROP NOT NULL;
