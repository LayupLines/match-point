-- AlterTable
ALTER TABLE "Match" ADD COLUMN "bracketPosition" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Match_roundId_bracketPosition_key" ON "Match"("roundId", "bracketPosition");
