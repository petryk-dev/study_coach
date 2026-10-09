-- CreateTable
CREATE TABLE "quizzes" (
    "id" SERIAL NOT NULL,
    "deck_id" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
