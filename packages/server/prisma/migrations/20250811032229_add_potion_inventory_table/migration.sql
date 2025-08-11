-- CreateTable
CREATE TABLE "public"."PotionInventoryItem" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "potionId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PotionInventoryItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PotionInventoryItem" ADD CONSTRAINT "PotionInventoryItem_potionId_fkey" FOREIGN KEY ("potionId") REFERENCES "public"."Potion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
