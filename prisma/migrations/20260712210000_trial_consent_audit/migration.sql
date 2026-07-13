ALTER TABLE "TrialSignup"
  ADD COLUMN "acceptableUseAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "acceptableUseVersion" TEXT,
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "termsVersion" TEXT;
