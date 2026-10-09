-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "grade" INTEGER NOT NULL,
    "reviewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_user_id_reviewed_at_idx" ON "reviews"("user_id", "reviewed_at");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
