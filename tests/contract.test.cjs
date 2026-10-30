const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { buildPayload } = require("../data-collection-tool/intake-contract.js");
test("collector preserves names, identity, interests and versioned consent without recruitment decisions", () => {
  const result = buildPayload(
    {
      firstName: " Synthetic ",
      otherNames: " Optional ",
      surname: " Person ",
      phone: "0241234567",
      dateOfBirth: "1990-01-02",
      ghanaCard: "GHA-123456789-0",
      location: " Community ",
      topicOfInterest: ["CAREER_READINESS"],
    },
    "NOTICE-1",
    "00000000-0000-4000-8000-000000000001",
  );
  assert.deepEqual(result.basic, {
    first_name: "Synthetic",
    other_names: "Optional",
    surname: "Person",
  });
  assert.equal(result.identity.government_id_type, "GHANA_CARD");
  assert.equal(result.consent.notice_version, "NOTICE-1");
  assert.deepEqual(result.training_interests, ["CAREER_READINESS"]);
  assert.equal(result.contact.region_code, undefined);
  assert.equal(result.readiness_status, undefined);
  assert.equal(result.employment, undefined);
});
test("active HTML and app have no legacy transport or participant authentication", () => {
  const html = fs.readFileSync("data-collection-tool/index.html", "utf8");
  const app = fs.readFileSync("data-collection-tool/app.js", "utf8");
  assert.doesNotMatch(html + app, /script.google.com|type="password"|fullName/);
  assert.match(app, /credentials: "omit"/);
  assert.ok(app.includes("participant-intake/config"));
  assert.match(html, /intake-contract.js/);
});
