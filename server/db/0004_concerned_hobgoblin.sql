CREATE TABLE "PersonNotableEvent" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"personId" integer NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "PersonNotableEvent" ADD CONSTRAINT "PersonNotableEvent_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."Person"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Person" DROP COLUMN "notableEvents";