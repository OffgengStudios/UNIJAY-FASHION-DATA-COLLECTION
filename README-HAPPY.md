# UNIJAY public collector

No participant login, account, password or dashboard. This static collector posts multipart JSON directly to HAPPY /api/v1/participant-intake and obtains the approved privacy notice/version from /config. HAPPY PostgreSQL owns participant records. Code.gs and appsscript.json are legacy references and are excluded from the build. No Google Sheet migration is authorized.

Node >=22. Run npm test, then set HAPPY_API_BASE_URL to the HTTPS HAPPY API origin and run npm run build. Deploy only dist/. The API must allow the collector origin in API_CORS_ORIGINS. Never place tokens or staff credentials in config.js. Empty or invalid API config, unavailable notice or closed intake disables submission. A retry with unchanged fields retains its submission UUID within the open page; changed fields start a new submission. Uncertain duplicate identities receive staff review with an indistinguishable public receipt.

Names are collected separately; no automatic splitting. Ghana Card is sent only to HAPPY and uses protected domain identity storage. Topic of interest maps to training_interests rather than verified skills. Existing branding and favicons are retained. Browser tests are maintained in the separate HAPPY repository integration/unijay-browser.cjs; server contract acceptance uses the actual collector payload builder.

Publish the implementation branch before setting the HAPPY repository UNIJAY_INTAKE_REF variable to that reviewed branch/SHA. Both repositories must pass their contracts before a release. Programme owners must supply approved privacy text/version and onboarding policy; synthetic test notice is never production policy.
