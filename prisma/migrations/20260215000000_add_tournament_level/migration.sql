-- CreateEnum
CREATE TYPE "TournamentLevel" AS ENUM ('GRAND_SLAM', 'ATP_1000', 'ATP_500', 'ATP_250', 'WTA_1000', 'WTA_500', 'WTA_250');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "level" "TournamentLevel" NOT NULL DEFAULT 'GRAND_SLAM';

-- DropIndex
DROP INDEX "Tournament_year_gender_key";

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_year_gender_level_key" ON "Tournament"("year", "gender", "level");
