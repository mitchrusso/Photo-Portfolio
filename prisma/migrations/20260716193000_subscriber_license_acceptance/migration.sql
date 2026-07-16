ALTER TABLE "TrialSignup"
  ADD COLUMN "subscriberLicenseAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "subscriberLicenseSignerName" TEXT,
  ADD COLUMN "subscriberLicenseVersion" TEXT;
