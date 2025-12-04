
-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_schoolId_fkey";

-- AlterTable
ALTER TABLE "School" ADD "managerId" INT;

-- AlterTable
ALTER TABLE "Teacher" ADD "className" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "schoolId";

-- CreateIndex
CREATE UNIQUE INDEX "School_managerId_key" ON "School"("managerId");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
