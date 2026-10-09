CREATE SCHEMA "events";
--> statement-breakpoint
CREATE TYPE "events"."price_kind" AS ENUM('free', 'paid');--> statement-breakpoint
CREATE TABLE "events"."categories" (
	"slug" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events"."event_categories" (
	"event_id" text NOT NULL,
	"category_slug" text NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "event_categories_event_id_category_slug_pk" PRIMARY KEY("event_id","category_slug"),
	CONSTRAINT "event_categories_event_position_unique" UNIQUE("event_id","position"),
	CONSTRAINT "event_categories_position_valid" CHECK ("events"."event_categories"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "events"."events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
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
	"address" text NOT NULL,
	"city" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events"."event_categories" ADD CONSTRAINT "event_categories_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"."events"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "events"."event_categories" ADD CONSTRAINT "event_categories_category_slug_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "events"."categories"("slug") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "events"."occurrences" ADD CONSTRAINT "occurrences_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"."events"("id") ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "events"."occurrences" ADD CONSTRAINT "occurrences_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "events"."venues"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE INDEX "event_categories_category_slug_idx" ON "events"."event_categories" USING btree ("category_slug");--> statement-breakpoint
CREATE INDEX "occurrences_starts_at_idx" ON "events"."occurrences" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "occurrences_event_id_idx" ON "events"."occurrences" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "occurrences_venue_id_idx" ON "events"."occurrences" USING btree ("venue_id");