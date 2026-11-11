-- Give every existing subscriber one opportunity to see the new PhotoView
-- welcome video. The existing flag remains false after a subscriber chooses
-- "Dismiss future reminders" and new subscriber onboarding already sets it.
UPDATE "Workspace"
SET "welcomeTourPending" = true;
