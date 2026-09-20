CREATE TYPE "public"."company_role" AS ENUM('developer', 'publisher');--> statement-breakpoint
CREATE TYPE "public"."tracking_status" AS ENUM('backlog', 'playing', 'completed', 'abandoned');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "companies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "game_companies" (
	"game_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"role" "company_role" NOT NULL,
	CONSTRAINT "game_companies_game_id_company_id_role_pk" PRIMARY KEY("game_id","company_id","role")
);
--> statement-breakpoint
CREATE TABLE "game_genres" (
	"game_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "game_genres_game_id_genre_id_pk" PRIMARY KEY("game_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rawg_id" integer,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"cover_url" text,
	"release_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_rawg_id_unique" UNIQUE("rawg_id")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "library_entries" (
	"game_id" uuid PRIMARY KEY NOT NULL,
	"status" "tracking_status" DEFAULT 'backlog' NOT NULL,
	"rating" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_entries_rating_range" CHECK ("library_entries"."rating" is null or ("library_entries"."rating" >= 1 and "library_entries"."rating" <= 10))
);
--> statement-breakpoint
CREATE TABLE "ownership_sources" (
	"game_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ownership_sources_game_id_provider_pk" PRIMARY KEY("game_id","provider")
);
--> statement-breakpoint
ALTER TABLE "game_companies" ADD CONSTRAINT "game_companies_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_companies" ADD CONSTRAINT "game_companies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_genres" ADD CONSTRAINT "game_genres_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_genres" ADD CONSTRAINT "game_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_entries" ADD CONSTRAINT "library_entries_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_sources" ADD CONSTRAINT "ownership_sources_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "games_slug_idx" ON "games" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "ownership_provider_external_idx" ON "ownership_sources" USING btree ("provider","external_id");