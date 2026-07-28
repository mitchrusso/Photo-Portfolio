ALTER TABLE "Workspace"
ADD COLUMN "defaultGalleryPasswordHash" TEXT,
ADD COLUMN "defaultGalleryTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "PortfolioGroup"
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Gallery"
ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
