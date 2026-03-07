CREATE TABLE "RecipeCauldronVariant" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"recipeId" integer NOT NULL,
	"essenceType" varchar(20) NOT NULL,
	"variantName" varchar(255) NOT NULL,
	"essenceIngredientId" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Potion" ADD COLUMN "cauldronName" text;--> statement-breakpoint
ALTER TABLE "RecipeCauldronVariant" ADD CONSTRAINT "RecipeCauldronVariant_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."Recipe"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "RecipeCauldronVariant" ADD CONSTRAINT "RecipeCauldronVariant_essenceIngredientId_fkey" FOREIGN KEY ("essenceIngredientId") REFERENCES "public"."Ingredient"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "RecipeCauldronVariant_recipeId_essenceType_key" ON "RecipeCauldronVariant" USING btree ("recipeId" int4_ops,"essenceType" text_ops);--> statement-breakpoint
ALTER TABLE "Recipe" DROP COLUMN "fireEssence";--> statement-breakpoint
ALTER TABLE "Recipe" DROP COLUMN "airEssence";--> statement-breakpoint
ALTER TABLE "Recipe" DROP COLUMN "waterEssence";--> statement-breakpoint
ALTER TABLE "Recipe" DROP COLUMN "lightningEssence";--> statement-breakpoint
ALTER TABLE "Recipe" DROP COLUMN "earthEssence";--> statement-breakpoint
ALTER TABLE "Recipe" DROP COLUMN "lifeEssence";--> statement-breakpoint
ALTER TABLE "Recipe" DROP COLUMN "deathEssence";