CREATE TABLE "spellbook_deck_card" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"deckId" varchar(255) NOT NULL,
	"cardId" integer NOT NULL,
	"zone" varchar(10) NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spellbook_deck" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "spellbook_deck_card" ADD CONSTRAINT "spellbook_deck_card_deckId_spellbook_deck_id_fk" FOREIGN KEY ("deckId") REFERENCES "public"."spellbook_deck"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spellbook_deck" ADD CONSTRAINT "spellbook_deck_userId_spellbook_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."spellbook_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deck_card_deck_id_idx" ON "spellbook_deck_card" USING btree ("deckId");--> statement-breakpoint
CREATE INDEX "deck_user_id_idx" ON "spellbook_deck" USING btree ("userId");