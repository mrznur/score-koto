-- CreateTable
CREATE TABLE "FootballMatch" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "status" TEXT NOT NULL,
    "elapsed" INTEGER,
    "competition" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "round" TEXT,
    "venue" TEXT,
    "kickoff" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FootballMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CricketMatch" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "venue" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "teams" JSONB NOT NULL,
    "score" JSONB,
    "seriesId" TEXT,
    "matchStarted" BOOLEAN NOT NULL DEFAULT false,
    "matchEnded" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CricketMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CricketScorecard" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "inning" TEXT NOT NULL,
    "batting" JSONB NOT NULL,
    "bowling" JSONB NOT NULL,
    "extras" JSONB,
    "totals" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CricketScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "records" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FootballMatch_providerId_key" ON "FootballMatch"("providerId");

-- CreateIndex
CREATE INDEX "FootballMatch_status_idx" ON "FootballMatch"("status");

-- CreateIndex
CREATE INDEX "FootballMatch_kickoff_idx" ON "FootballMatch"("kickoff");

-- CreateIndex
CREATE INDEX "FootballMatch_competitionId_idx" ON "FootballMatch"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CricketMatch_providerId_key" ON "CricketMatch"("providerId");

-- CreateIndex
CREATE INDEX "CricketMatch_matchStarted_matchEnded_idx" ON "CricketMatch"("matchStarted", "matchEnded");

-- CreateIndex
CREATE INDEX "CricketMatch_date_idx" ON "CricketMatch"("date");

-- CreateIndex
CREATE INDEX "CricketScorecard_matchId_idx" ON "CricketScorecard"("matchId");

-- CreateIndex
CREATE INDEX "SyncLog_provider_job_idx" ON "SyncLog"("provider", "job");

-- CreateIndex
CREATE INDEX "SyncLog_createdAt_idx" ON "SyncLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiUsage_provider_date_key" ON "ApiUsage"("provider", "date");

-- AddForeignKey
ALTER TABLE "CricketScorecard" ADD CONSTRAINT "CricketScorecard_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "CricketMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
