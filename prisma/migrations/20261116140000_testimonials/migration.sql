CREATE TYPE "TestimonialStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastInitial" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "headshotUrl" TEXT NOT NULL,
    "permissionGranted" BOOLEAN NOT NULL DEFAULT false,
    "status" "TestimonialStatus" NOT NULL DEFAULT 'PENDING',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Testimonial_userId_key" ON "Testimonial"("userId");
CREATE INDEX "Testimonial_status_isFeatured_displayOrder_idx" ON "Testimonial"("status", "isFeatured", "displayOrder");
CREATE INDEX "Testimonial_workspaceId_submittedAt_idx" ON "Testimonial"("workspaceId", "submittedAt");

ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
