/*
  Warnings:

  - The `quality` column on the `Potion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `potionId` on the `Recipe` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[recipeId]` on the table `Potion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `recipeId` to the `Potion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "public"."PotionQuality" ADD VALUE 'NORMAL';

-- DropForeignKey
ALTER TABLE "public"."Recipe" DROP CONSTRAINT "Recipe_potionId_fkey";

-- DropIndex
DROP INDEX "public"."Recipe_potionId_key";

-- AlterTable
ALTER TABLE "public"."Potion" ADD COLUMN     "recipeId" INTEGER NOT NULL,
DROP COLUMN "quality",
ADD COLUMN     "quality" "public"."PotionQuality";

-- AlterTable
ALTER TABLE "public"."Recipe" DROP COLUMN "potionId";

-- CreateIndex
CREATE UNIQUE INDEX "Potion_recipeId_key" ON "public"."Potion"("recipeId");

-- AddForeignKey
ALTER TABLE "public"."Potion" ADD CONSTRAINT "Potion_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
