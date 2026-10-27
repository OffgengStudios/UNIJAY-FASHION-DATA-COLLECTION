(function (root) {
  "use strict";
  function buildPayload(fields, noticeVersion, submissionId) {
    return {
      submission_id: submissionId,
      basic: {
        first_name: fields.firstName.trim(),
        other_names: fields.otherNames?.trim() || null,
        surname: fields.surname.trim(),
      },
      contact: { phone_raw: fields.phone, community: fields.location.trim() },
      demographics: { date_of_birth: fields.dateOfBirth },
      identity: {
        government_id_type: "GHANA_CARD",
        government_id: fields.ghanaCard,
      },
      training_interests: fields.topicOfInterest,
      consent: { accepted: true, notice_version: noticeVersion },
      reviewed: true,
      website: fields.website || "",
    };
  }
  const contract = { buildPayload };
  if (typeof module !== "undefined" && module.exports)
    module.exports = contract;
  else root.UnijayIntake = contract;
})(typeof window !== "undefined" ? window : globalThis);
