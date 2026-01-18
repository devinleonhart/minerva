-- Add Crystal Cauldron essence fields to Recipe table
ALTER TABLE "public"."Recipe" ADD COLUMN "cauldronName" VARCHAR(255);
ALTER TABLE "public"."Recipe" ADD COLUMN "fireEssence" TEXT;
ALTER TABLE "public"."Recipe" ADD COLUMN "airEssence" TEXT;
ALTER TABLE "public"."Recipe" ADD COLUMN "waterEssence" TEXT;
ALTER TABLE "public"."Recipe" ADD COLUMN "lightningEssence" TEXT;
ALTER TABLE "public"."Recipe" ADD COLUMN "earthEssence" TEXT;
ALTER TABLE "public"."Recipe" ADD COLUMN "lifeEssence" TEXT;
ALTER TABLE "public"."Recipe" ADD COLUMN "deathEssence" TEXT;
