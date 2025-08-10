/*
  Warnings:

  - A unique constraint covering the columns `[potionId]` on the table `Recipe` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `potionId` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PotionQuality" AS ENUM ('HQ', 'LQ');

-- CreateEnum
CREATE TYPE "public"."IngredientQuality" AS ENUM ('NORMAL', 'HQ', 'LQ');

-- AlterTable
ALTER TABLE "public"."Recipe" ADD COLUMN     "potionId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."Potion" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quality" VARCHAR(255),

    CONSTRAINT "Potion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryItem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quality" "public"."IngredientQuality" NOT NULL DEFAULT 'NORMAL',
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_potionId_key" ON "public"."Recipe"("potionId");

-- AddForeignKey
ALTER TABLE "public"."Recipe" ADD CONSTRAINT "Recipe_potionId_fkey" FOREIGN KEY ("potionId") REFERENCES "public"."Potion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryItem" ADD CONSTRAINT "InventoryItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "public"."Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
