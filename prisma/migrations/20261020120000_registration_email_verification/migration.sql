CREATE TABLE "EmailSuppression" (
    "recipientHash" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'resend_webhook',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("recipientHash")
);

CREATE INDEX "EmailSuppression_reason_updatedAt_idx" ON "EmailSuppression"("reason", "updatedAt");

CREATE TABLE "RegistrationEmailVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "tokenHash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationEmailVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RegistrationEmailVerification_tokenHash_key" ON "RegistrationEmailVerification"("tokenHash");
CREATE INDEX "RegistrationEmailVerification_email_createdAt_idx" ON "RegistrationEmailVerification"("email", "createdAt");
CREATE INDEX "RegistrationEmailVerification_expiresAt_idx" ON "RegistrationEmailVerification"("expiresAt");
