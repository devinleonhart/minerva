-- DropForeignKey
ALTER TABLE "public"."Recipe" DROP CONSTRAINT "Recipe_potionId_fkey";

-- AlterTable
ALTER TABLE "public"."Recipe" ALTER COLUMN "potionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Recipe" ADD CONSTRAINT "Recipe_potionId_fkey" FOREIGN KEY ("potionId") REFERENCES "public"."Potion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
