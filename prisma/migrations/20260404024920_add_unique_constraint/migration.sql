/*
  Warnings:

  - You are about to drop the column `quizId` on the `QuizAttempt` table. All the data in the column will be lost.
  - You are about to drop the column `quizId` on the `UserScore` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,content]` on the table `Article` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `articleId` to the `QuizAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `articleId` to the `UserScore` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QuizAttempt" DROP CONSTRAINT "QuizAttempt_quizId_fkey";

-- DropForeignKey
ALTER TABLE "UserScore" DROP CONSTRAINT "UserScore_quizId_fkey";

-- AlterTable
ALTER TABLE "QuizAttempt" DROP COLUMN "quizId",
ADD COLUMN     "articleId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserScore" DROP COLUMN "quizId",
ADD COLUMN     "articleId" TEXT NOT NULL,
ADD COLUMN     "timeSpent" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Article_userId_content_key" ON "Article"("userId", "content");

-- AddForeignKey
ALTER TABLE "UserScore" ADD CONSTRAINT "UserScore_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
