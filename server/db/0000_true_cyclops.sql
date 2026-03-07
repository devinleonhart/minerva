CREATE TYPE "public"."IngredientQuality" AS ENUM('NORMAL', 'HQ', 'LQ');--> statement-breakpoint
CREATE TYPE "public"."PotionQuality" AS ENUM('NORMAL', 'HQ', 'LQ');--> statement-breakpoint
CREATE TYPE "public"."TaskType" AS ENUM('GATHER_INGREDIENT', 'BREWING', 'SECURE_INGREDIENTS', 'RESEARCH_RECIPES', 'RESEARCH_SPELL', 'FREE_TIME');--> statement-breakpoint
CREATE TYPE "public"."TimeSlot" AS ENUM('MORNING', 'AFTERNOON', 'EVENING');--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TaskDefinition" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"type" "TaskType" NOT NULL,
	"name" varchar(100) NOT NULL,
	"timeUnits" integer NOT NULL,
	"color" varchar(7) NOT NULL,
	"description" text NOT NULL,
	"restrictions" jsonb
);
--> statement-breakpoint
CREATE TABLE "Ingredient" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"description" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"secured" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "InventoryItem" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"ingredientId" integer NOT NULL,
	"quality" "IngredientQuality" DEFAULT 'NORMAL' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Potion" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"quality" "PotionQuality" DEFAULT 'NORMAL' NOT NULL,
	"recipeId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PotionInventoryItem" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"potionId" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Item" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "WeekSchedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"weekStartDate" timestamp(3) NOT NULL,
	"totalScheduledUnits" integer DEFAULT 0 NOT NULL,
	"freeTimeUsed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DaySchedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"weekScheduleId" integer NOT NULL,
	"day" integer NOT NULL,
	"dayName" varchar(20) NOT NULL,
	"totalUnits" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ScheduledTask" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"type" "TaskType" NOT NULL,
	"timeUnits" integer NOT NULL,
	"day" integer NOT NULL,
	"timeSlot" "TimeSlot" NOT NULL,
	"details" jsonb,
	"dayScheduleId" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "Currency" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"name" varchar(255) NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ItemInventoryItem" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"itemId" integer NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Person" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"relationship" varchar(255),
	"notableEvents" text,
	"url" varchar(255),
	"isFavorited" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Recipe" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"fireEssence" text,
	"airEssence" text,
	"waterEssence" text,
	"lightningEssence" text,
	"earthEssence" text,
	"lifeEssence" text,
	"deathEssence" text
);
--> statement-breakpoint
CREATE TABLE "Skill" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Spell" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"name" varchar(255) NOT NULL,
	"currentStars" integer DEFAULT 0 NOT NULL,
	"neededStars" integer DEFAULT 1 NOT NULL,
	"isLearned" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "RecipeIngredient" (
	"recipeId" integer NOT NULL,
	"ingredientId" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY("recipeId","ingredientId")
);
--> statement-breakpoint
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "public"."Ingredient"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PotionInventoryItem" ADD CONSTRAINT "PotionInventoryItem_potionId_fkey" FOREIGN KEY ("potionId") REFERENCES "public"."Potion"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DaySchedule" ADD CONSTRAINT "DaySchedule_weekScheduleId_fkey" FOREIGN KEY ("weekScheduleId") REFERENCES "public"."WeekSchedule"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_dayScheduleId_fkey" FOREIGN KEY ("dayScheduleId") REFERENCES "public"."DaySchedule"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ItemInventoryItem" ADD CONSTRAINT "ItemInventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."Recipe"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "public"."Ingredient"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "TaskDefinition_type_key" ON "TaskDefinition" USING btree ("type" enum_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "WeekSchedule_weekStartDate_key" ON "WeekSchedule" USING btree ("weekStartDate" timestamp_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "DaySchedule_weekScheduleId_day_key" ON "DaySchedule" USING btree ("weekScheduleId" int4_ops,"day" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "ScheduledTask_dayScheduleId_timeSlot_key" ON "ScheduledTask" USING btree ("dayScheduleId" int4_ops,"timeSlot" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Currency_name_key" ON "Currency" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Spell_name_key" ON "Spell" USING btree ("name" text_ops);