-- CreateEnum
CREATE TYPE "Speciality" AS ENUM ('GENERAL_PHYSICIAN', 'CONSULTING_PHYSICIAN', 'DIABETOLOGIST', 'CARDIOLOGIST', 'NEUROLOGIST', 'ORTHOPEDIC', 'PEDIATRICIAN', 'GYNECOLOGIST', 'ENT', 'ENDOCRINOLOGIST', 'GASTROENTEROLOGIST');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "TimeSlot" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateEnum
CREATE TYPE "DoctorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlanItemStatus" AS ENUM ('PENDING', 'VISITED', 'SKIPPED', 'RESCHEDULED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "description" TEXT,
    "dayOfWeek" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "speciality" "Speciality" NOT NULL,
    "grade" "Grade" NOT NULL DEFAULT 'B',
    "hospital" TEXT,
    "clinic" TEXT,
    "areaId" TEXT,
    "beatId" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "googleMapsUrl" TEXT,
    "morningStart" TEXT,
    "morningEnd" TEXT,
    "afternoonStart" TEXT,
    "afternoonEnd" TEXT,
    "eveningStart" TEXT,
    "eveningEnd" TEXT,
    "preferredDays" INTEGER[],
    "preferredTime" "TimeSlot",
    "exStationDays" INTEGER[],
    "assistantName" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "status" "DoctorStatus" NOT NULL DEFAULT 'ACTIVE',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "chemistId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chemist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pharmacyName" TEXT,
    "areaId" TEXT,
    "beatId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chemist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "products" TEXT[],
    "duration" INTEGER,
    "followUpDate" TIMESTAMP(3),
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "skipReason" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "planItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "PlanType" NOT NULL DEFAULT 'DAILY',
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "scheduledTime" TEXT,
    "timeSlot" "TimeSlot",
    "status" "PlanItemStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Area_name_key" ON "Area"("name");

-- CreateIndex
CREATE INDEX "Beat_areaId_idx" ON "Beat"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "Beat_name_areaId_key" ON "Beat"("name", "areaId");

-- CreateIndex
CREATE INDEX "Doctor_areaId_idx" ON "Doctor"("areaId");

-- CreateIndex
CREATE INDEX "Doctor_beatId_idx" ON "Doctor"("beatId");

-- CreateIndex
CREATE INDEX "Doctor_speciality_idx" ON "Doctor"("speciality");

-- CreateIndex
CREATE INDEX "Doctor_grade_idx" ON "Doctor"("grade");

-- CreateIndex
CREATE INDEX "Doctor_status_idx" ON "Doctor"("status");

-- CreateIndex
CREATE INDEX "Doctor_chemistId_idx" ON "Doctor"("chemistId");

-- CreateIndex
CREATE INDEX "Chemist_areaId_idx" ON "Chemist"("areaId");

-- CreateIndex
CREATE INDEX "Chemist_beatId_idx" ON "Chemist"("beatId");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_planItemId_key" ON "Visit"("planItemId");

-- CreateIndex
CREATE INDEX "Visit_doctorId_idx" ON "Visit"("doctorId");

-- CreateIndex
CREATE INDEX "Visit_visitDate_idx" ON "Visit"("visitDate");

-- CreateIndex
CREATE INDEX "Plan_date_idx" ON "Plan"("date");

-- CreateIndex
CREATE INDEX "Plan_type_idx" ON "Plan"("type");

-- CreateIndex
CREATE INDEX "PlanItem_planId_idx" ON "PlanItem"("planId");

-- CreateIndex
CREATE INDEX "PlanItem_doctorId_idx" ON "PlanItem"("doctorId");

-- AddForeignKey
ALTER TABLE "Beat" ADD CONSTRAINT "Beat_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_beatId_fkey" FOREIGN KEY ("beatId") REFERENCES "Beat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "Chemist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chemist" ADD CONSTRAINT "Chemist_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chemist" ADD CONSTRAINT "Chemist_beatId_fkey" FOREIGN KEY ("beatId") REFERENCES "Beat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "PlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
