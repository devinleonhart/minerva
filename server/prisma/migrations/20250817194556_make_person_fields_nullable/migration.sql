/*
  Warnings:

  - You are about to alter the column `description` on the `Person` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `relationship` on the `Person` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `notableEvents` on the `Person` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `url` on the `Person` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "public"."Person" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "description" DROP DEFAULT,
ALTER COLUMN "description" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "relationship" DROP NOT NULL,
ALTER COLUMN "relationship" DROP DEFAULT,
ALTER COLUMN "relationship" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "notableEvents" DROP NOT NULL,
ALTER COLUMN "notableEvents" DROP DEFAULT,
ALTER COLUMN "notableEvents" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "url" DROP NOT NULL,
ALTER COLUMN "url" DROP DEFAULT,
ALTER COLUMN "url" SET DATA TYPE VARCHAR(255);
