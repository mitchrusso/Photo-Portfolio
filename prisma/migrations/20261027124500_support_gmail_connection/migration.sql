CREATE TABLE "SupportGoogleConnection" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "accessTokenEncrypted" TEXT NOT NULL,
  "refreshTokenEncrypted" TEXT,
  "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
  "scopes" JSONB NOT NULL,
  "connectedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupportGoogleConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportGoogleConnection_email_key" ON "SupportGoogleConnection"("email");
