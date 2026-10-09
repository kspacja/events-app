CREATE SCHEMA "events";
--> statement-breakpoint
CREATE TYPE "events"."price_kind" AS ENUM('free', 'paid');--> statement-breakpoint
CREATE TABLE "events"."categories" (
	"slug" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events"."events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category_slug" text NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "events"."occurrences" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"venue_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"price_kind" "events"."price_kind",
	"price_from" numeric(10, 2),
	"price_to" numeric(10, 2),
	"price_currency" text,
	CONSTRAINT "occurrences_price_valid" CHECK (("events"."occurrences"."price_kind" IS DISTINCT FROM 'paid'
          AND "events"."occurrences"."price_from" IS NULL AND "events"."occurrences"."price_to" IS NULL AND "events"."occurrences"."price_currency" IS NULL)
        OR ("events"."occurrences"."price_kind" = 'paid'
          AND "events"."occurrences"."price_from" IS NOT NULL AND "events"."occurrences"."price_from" >= 0 AND "events"."occurrences"."price_currency" IS NOT DISTINCT FROM 'PLN'
          AND ("events"."occurrences"."price_to" IS NULL OR "events"."occurrences"."price_to" >= "events"."occurrences"."price_from")))
);
--> statement-breakpoint
CREATE TABLE "events"."venues" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events"."events" ADD CONSTRAINT "events_category_slug_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "events"."categories"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events"."occurrences" ADD CONSTRAINT "occurrences_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events"."occurrences" ADD CONSTRAINT "occurrences_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "events"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "occurrences_starts_at_idx" ON "events"."occurrences" USING btree ("starts_at");