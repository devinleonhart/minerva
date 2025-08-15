-- CreateEnum
CREATE TYPE "public"."PotionQuality" AS ENUM ('NORMAL', 'HQ', 'LQ');

-- CreateEnum
CREATE TYPE "public"."IngredientQuality" AS ENUM ('NORMAL', 'HQ', 'LQ');

-- CreateEnum
CREATE TYPE "public"."TaskType" AS ENUM ('GATHER_INGREDIENT', 'BREWING', 'SECURE_INGREDIENTS', 'RESEARCH_RECIPES', 'RESEARCH_SPELL', 'FREE_TIME');

-- CreateEnum
CREATE TYPE "public"."TimeSlot" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateTable
CREATE TABLE "public"."Recipe" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ingredient" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "secured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Potion" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quality" "public"."PotionQuality" NOT NULL DEFAULT 'NORMAL',
    "recipeId" INTEGER NOT NULL,

    CONSTRAINT "Potion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecipeIngredient" (
    "recipeId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("recipeId","ingredientId")
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

-- CreateTable
CREATE TABLE "public"."PotionInventoryItem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "potionId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PotionInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Item" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemInventoryItem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "ItemInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeekSchedule" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "totalScheduledUnits" INTEGER NOT NULL DEFAULT 0,
    "freeTimeUsed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WeekSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DaySchedule" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "weekScheduleId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "dayName" VARCHAR(20) NOT NULL,
    "totalUnits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DaySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduledTask" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "public"."TaskType" NOT NULL,
    "timeUnits" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "timeSlot" "public"."TimeSlot" NOT NULL,
    "details" JSONB,
    "dayScheduleId" INTEGER NOT NULL,

    CONSTRAINT "ScheduledTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskDefinition" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "public"."TaskType" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "timeUnits" INTEGER NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "description" TEXT NOT NULL,
    "restrictions" JSONB,

    CONSTRAINT "TaskDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeekSchedule_weekStartDate_key" ON "public"."WeekSchedule"("weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "DaySchedule_weekScheduleId_day_key" ON "public"."DaySchedule"("weekScheduleId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledTask_dayScheduleId_timeSlot_key" ON "public"."ScheduledTask"("dayScheduleId", "timeSlot");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDefinition_type_key" ON "public"."TaskDefinition"("type");

-- AddForeignKey
ALTER TABLE "public"."RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "public"."Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "public"."Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryItem" ADD CONSTRAINT "InventoryItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "public"."Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PotionInventoryItem" ADD CONSTRAINT "PotionInventoryItem_potionId_fkey" FOREIGN KEY ("potionId") REFERENCES "public"."Potion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemInventoryItem" ADD CONSTRAINT "ItemInventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DaySchedule" ADD CONSTRAINT "DaySchedule_weekScheduleId_fkey" FOREIGN KEY ("weekScheduleId") REFERENCES "public"."WeekSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduledTask" ADD CONSTRAINT "ScheduledTask_dayScheduleId_fkey" FOREIGN KEY ("dayScheduleId") REFERENCES "public"."DaySchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
