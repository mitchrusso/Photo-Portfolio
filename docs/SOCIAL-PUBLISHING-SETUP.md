# PhotoView.io direct social publishing

## What is implemented

PhotoView.io can now:

- let a subscriber choose exact visible portfolio photos;
- schedule one to three posts per posting day with a configurable number of days and hours between posts;
- include the public portfolio link in each caption;
- authorize Facebook Pages and Instagram Professional accounts through Meta OAuth without collecting social passwords;
- encrypt provider tokens at rest;
- create account-specific delivery jobs;
- publish due Facebook and Instagram image posts;
- retry transient failures up to five times;
- pause remaining deliveries and revoke a connection;
- show scheduled, published, canceled, and failed deliveries.

The feature remains safely disabled when Meta configuration is absent.

## Meta registration required before production activation

1. Create a business app at [Meta for Developers](https://developers.facebook.com/apps/).
2. Add the Facebook Login and Instagram API products needed for Page and professional-account publishing.
3. Register this exact production OAuth redirect URI:

   `https://photoview.io/api/social/meta/callback`

4. Request the minimum permissions used by PhotoView.io:

   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`

5. Complete Meta business verification and App Review for access beyond the app's administrators, developers, and test users.
6. In Vercel Production environment variables, add:

   - `META_APP_ID`
   - `META_APP_SECRET`
   - `META_GRAPH_API_VERSION` using the version selected in the Meta app, such as `vNN.N`
   - `SOCIAL_TOKEN_ENCRYPTION_KEY`, generated with `openssl rand -base64 32`

7. Apply the Prisma migration and redeploy. The existing protected Vercel cron invokes `/api/social/publish-due` every five minutes.

## Eligibility and product expectations

- Facebook automatic publishing targets Pages, not personal profiles.
- Instagram publishing requires an eligible Professional account.
- The subscriber always sees the provider's consent screen, selects an authorized account in PhotoView.io, previews the queue, and explicitly activates publishing.
- Disconnecting an account cancels its remaining unpublished deliveries.
- Token expiry and provider permission failures are visible in delivery history and require reconnection when appropriate.

## Additional platform sequence

Recommended order after Meta approval:

1. Pinterest Pins — highly aligned with photography and portfolio discovery.
2. LinkedIn member and organization posts — useful for commercial photographers; requires LinkedIn product approval.
3. TikTok photo/video Direct Post — requires a TikTok developer app and audit before public direct posting.
4. YouTube video uploads — OAuth and Google verification; this is a video workflow rather than a still-photo queue.
5. X — technically supported by its API, but currently pay-per-use and significantly more expensive for posts containing URLs.

Each additional platform should use the same PhotoView.io connection, delivery, retry, pause, and history infrastructure rather than introducing a paid aggregation vendor.
