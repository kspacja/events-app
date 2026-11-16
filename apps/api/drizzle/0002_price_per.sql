CREATE TYPE "events"."price_per" AS ENUM('person', 'group', 'hour');--> statement-breakpoint
ALTER TABLE "events"."occurrences" DROP CONSTRAINT "occurrences_price_valid";--> statement-breakpoint
ALTER TABLE "events"."occurrences" ADD COLUMN "price_per" "events"."price_per";--> statement-breakpoint
ALTER TABLE "events"."occurrences" ADD CONSTRAINT "occurrences_price_valid" CHECK (("events"."occurrences"."price_kind" IS DISTINCT FROM 'paid'
          AND "events"."occurrences"."price_from" IS NULL AND "events"."occurrences"."price_to" IS NULL AND "events"."occurrences"."price_currency" IS NULL AND "events"."occurrences"."price_per" IS NULL)
        OR ("events"."occurrences"."price_kind" = 'paid'
          AND "events"."occurrences"."price_from" IS NOT NULL AND "events"."occurrences"."price_from" >= 0 AND "events"."occurrences"."price_currency" IS NOT DISTINCT FROM 'PLN'
          AND ("events"."occurrences"."price_to" IS NULL OR "events"."occurrences"."price_to" >= "events"."occurrences"."price_from")));