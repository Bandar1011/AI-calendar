/*
  Warnings:

  - Added the required column `userId` to the `CalendarPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CalendarPlan" ADD COLUMN     "userId" TEXT NOT NULL;
