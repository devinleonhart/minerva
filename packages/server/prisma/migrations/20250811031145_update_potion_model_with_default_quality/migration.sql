/*
  Warnings:

  - Made the column `quality` on table `Potion` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Potion" ALTER COLUMN "quality" SET NOT NULL,
ALTER COLUMN "quality" SET DEFAULT 'NORMAL';
