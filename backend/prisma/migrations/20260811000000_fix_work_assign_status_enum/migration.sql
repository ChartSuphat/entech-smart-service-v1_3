-- Fix WorkAssignStatus enum: drop old values (draft/in_progress/completed/cancelled)
-- and replace with correct values (newjob/approved/inprogress/jobdone)

-- Step 1: detach column from enum (cast to text)
ALTER TABLE "work_assignments" ALTER COLUMN "status" TYPE TEXT;

-- Step 2: drop old enum
DROP TYPE IF EXISTS "WorkAssignStatus";

-- Step 3: create correct enum
CREATE TYPE "WorkAssignStatus" AS ENUM ('newjob', 'approved', 'inprogress', 'jobdone');

-- Step 4: map any old status values to new ones (in case there are existing rows)
UPDATE "work_assignments" SET "status" = 'newjob'    WHERE "status" IN ('draft', 'in_progress');
UPDATE "work_assignments" SET "status" = 'jobdone'   WHERE "status" = 'completed';
UPDATE "work_assignments" SET "status" = 'newjob'    WHERE "status" = 'cancelled';
-- set anything unknown to newjob
UPDATE "work_assignments" SET "status" = 'newjob'
  WHERE "status" NOT IN ('newjob', 'approved', 'inprogress', 'jobdone');

-- Step 5: reattach column to new enum
ALTER TABLE "work_assignments"
  ALTER COLUMN "status" TYPE "WorkAssignStatus"
  USING "status"::"WorkAssignStatus";
