const API_BASE = (window.UNIJAY_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");
let intakeConfig = null;
let previousContent = null;
let submissionId = null;

const form = document.getElementById("registrationForm");
const submitButton = document.getElementById("submitButton");
const submitButtonText = document.getElementById("submitButtonText");
const submitSpinner = document.getElementById("submitSpinner");
const statusMessage = document.getElementById("statusMessage");
const successCard = document.getElementById("successCard");
const recordIdElement = document.getElementById("recordId");
const registerAnotherButton = document.getElementById("registerAnotherButton");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");

const fields = {
  firstName: document.getElementById("firstName"),
  otherNames: document.getElementById("otherNames"),
  surname: document.getElementById("surname"),
  phone: document.getElementById("phone"),
  dateOfBirth: document.getElementById("dateOfBirth"),
  ghanaCard: document.getElementById("ghanaCard"),
  location: document.getElementById("location"),
  topicOfInterest: document.getElementById("careerReadiness"),
  consent: document.getElementById("consent"),
};

const topicFields = {
  careerReadiness: document.getElementById("careerReadiness"),
  softSkills: document.getElementById("softSkills"),
};

const requiredDataFields = [
  "firstName",
  "surname",
  "phone",
  "dateOfBirth",
  "ghanaCard",
  "location",
  "topicOfInterest",
];

function normalizePhone(value) {
  const cleaned = String(value || "").replace(/[\s()-]/g, "");
  if (/^0\d{9}$/.test(cleaned)) return "+233" + cleaned.slice(1);
  if (/^233\d{9}$/.test(cleaned)) return "+" + cleaned;
  if (/^\+233\d{9}$/.test(cleaned)) return cleaned;
  return cleaned;
}

function formatPhoneForInput(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length >= 3) {
    const local = "0" + digits.slice(3, 12);
    return formatLocalPhone(local);
  }
  return formatLocalPhone(digits.slice(0, 10));
}

function formatLocalPhone(digits) {
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
}

function normalizeGhanaCard(value) {
  const compact = String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");

  const withoutPrefix = compact.startsWith("GHA") ? compact.slice(3) : compact;
  const digits = withoutPrefix.replace(/\D/g, "").slice(0, 10);

  if (!digits) return compact.startsWith("GHA") ? "GHA" : "";
  if (digits.length <= 9) return `GHA-${digits}`;
  return `GHA-${digits.slice(0, 9)}-${digits.slice(9)}`;
}

function setError(fieldName, message) {
  const input = fields[fieldName];
  const error = document.getElementById(`${fieldName}Error`);

  if (input) {
    if (input.type !== "checkbox") {
      input.classList.toggle("input-error", Boolean(message));
    }
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  if (error) error.textContent = message || "";
}

function clearStatus() {
  statusMessage.className = "status-message";
  statusMessage.textContent = "";
}

function getSelectedTopics() {
  return Object.values(topicFields)
    .filter((field) => field && field.checked)
    .map((field) => field.value);
}

function validateField(fieldName) {
  if (["firstName", "surname"].includes(fieldName)) {
    const value = fields[fieldName].value.trim();
    const valid = value.length >= 1;
    setError(fieldName, valid ? "" : "Enter the participant's name.");
    return valid;
  }

  if (fieldName === "phone") {
    const valid = /^\+233\d{9}$/.test(normalizePhone(fields.phone.value));
    setError(
      "phone",
      valid ? "" : "Enter a valid 10-digit Ghana phone number.",
    );
    return valid;
  }

  if (fieldName === "dateOfBirth") {
    const value = fields.dateOfBirth.value;
    let valid = Boolean(value);

    if (valid) {
      const dob = new Date(`${value}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      valid = !Number.isNaN(dob.getTime()) && dob < today;
    }

    setError(
      "dateOfBirth",
      valid ? "" : "Select a valid date of birth in the past.",
    );
    return valid;
  }

  if (fieldName === "ghanaCard") {
    const formatted = normalizeGhanaCard(fields.ghanaCard.value);
    const valid = /^GHA-\d{9}-\d$/.test(formatted);
    setError(
      "ghanaCard",
      valid ? "" : "Enter a valid Ghana Card number: GHA-XXXXXXXXX-X.",
    );
    return valid;
  }

  if (fieldName === "location") {
    const value = fields.location.value.trim();
    const valid = value.length >= 2;
    setError(
      "location",
      valid ? "" : "Enter the participant's current area or community.",
    );
    return valid;
  }

  if (fieldName === "topicOfInterest") {
    const selectedTopics = getSelectedTopics();
    const valid = selectedTopics.length > 0;
    setError(
      "topicOfInterest",
      valid ? "" : "Select at least one topic of interest.",
    );
    return valid;
  }

  if (fieldName === "consent") {
    const valid = fields.consent.checked;
    setError("consent", valid ? "" : "Consent is required before submission.");
    return valid;
  }

  return true;
}

function validateForm() {
  const results = [...requiredDataFields, "consent"].map(validateField);
  return results.every(Boolean);
}

function fieldLooksComplete(fieldName) {
  if (["firstName", "surname"].includes(fieldName))
    return fields[fieldName].value.trim().length >= 1;
  if (fieldName === "phone")
    return /^\+233\d{9}$/.test(normalizePhone(fields.phone.value));
  if (fieldName === "dateOfBirth") return Boolean(fields.dateOfBirth.value);
  if (fieldName === "ghanaCard")
    return /^GHA-\d{9}-\d$/.test(normalizeGhanaCard(fields.ghanaCard.value));
  if (fieldName === "location") return fields.location.value.trim().length >= 2;
  if (fieldName === "topicOfInterest") return getSelectedTopics().length > 0;
  return false;
}

function updateProgress() {
  const completed = requiredDataFields.filter(fieldLooksComplete).length;
  const percentage = (completed / requiredDataFields.length) * 100;
  progressText.textContent = `${completed} of ${requiredDataFields.length} fields completed`;
  progressBar.style.width = `${percentage}%`;
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting || !intakeConfig?.accepting_submissions;
  submitButtonText.textContent = isSubmitting
    ? "Submitting..."
    : "Submit Registration";
  submitSpinner.classList.toggle("visible", isSubmitting);

  [...Object.values(fields), ...Object.values(topicFields)].forEach((field) => {
    if (field)
      field.disabled =
        isSubmitting || (field === fields.consent && !intakeConfig);
  });
}

function showSuccess(recordId) {
  form.classList.add("submitted");
  successCard.hidden = false;
  recordIdElement.textContent = recordId || "Submitted";
  successCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetForAnotherRegistration() {
  form.reset();
  successCard.hidden = true;
  form.classList.remove("submitted");
  clearStatus();
  [...requiredDataFields, "consent"].forEach((name) => setError(name, ""));
  Object.values(topicFields).forEach((field) => {
    if (field) field.checked = false;
  });
  updateProgress();
  previousContent = null;
  submissionId = null;
  fields.firstName.focus();
}

// Prevent future dates in browsers that support native date limits.
const today = new Date();
today.setDate(today.getDate() - 1);
fields.dateOfBirth.max = today.toISOString().split("T")[0];

fields.phone.addEventListener("input", () => {
  fields.phone.value = formatPhoneForInput(fields.phone.value);
  setError("phone", "");
  updateProgress();
});

fields.ghanaCard.addEventListener("input", () => {
  fields.ghanaCard.value = normalizeGhanaCard(fields.ghanaCard.value);
  setError("ghanaCard", "");
  updateProgress();
});

requiredDataFields.forEach((fieldName) => {
  const field = fields[fieldName];
  if (!field) return;
  field.addEventListener("input", updateProgress);
  field.addEventListener("change", updateProgress);
  field.addEventListener("blur", () => validateField(fieldName));
});

Object.values(topicFields).forEach((field) => {
  if (!field) return;
  field.addEventListener("change", () => {
    setError("topicOfInterest", "");
    updateProgress();
    validateField("topicOfInterest");
  });
});

fields.consent.addEventListener("change", () => validateField("consent"));
registerAnotherButton.addEventListener("click", resetForAnotherRegistration);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  if (!intakeConfig?.accepting_submissions) return;
  if (!validateForm()) {
    const firstInvalid =
      requiredDataFields
        .map((name) => fields[name])
        .find((field) => field.getAttribute("aria-invalid") === "true") ||
      (!fields.consent.checked ? fields.consent : null);
    firstInvalid?.focus();
    return;
  }

  const values = {
    firstName: fields.firstName.value,
    otherNames: fields.otherNames.value,
    surname: fields.surname.value,
    phone: normalizePhone(fields.phone.value),
    dateOfBirth: fields.dateOfBirth.value,
    ghanaCard: normalizeGhanaCard(fields.ghanaCard.value),
    location: fields.location.value,
    topicOfInterest: getSelectedTopics(),
    website: document.getElementById("website").value,
  };
  const content = JSON.stringify([values, intakeConfig.privacy_notice_version]);
  if (content !== previousContent) {
    submissionId = crypto.randomUUID();
    previousContent = content;
  }
  const payload = UnijayIntake.buildPayload(
    values,
    intakeConfig.privacy_notice_version,
    submissionId,
  );
  const body = new FormData();
  body.set("payload", JSON.stringify(payload));
  setSubmitting(true);

  try {
    const response = await fetch(`${API_BASE}/api/v1/participant-intake`, {
      method: "POST",
      credentials: "omit",
      redirect: "error",
      body,
      signal: AbortSignal.timeout(20000),
    });

    const result = await response.json();
    if (!response.ok) {
      if (
        result?.error?.code === "PRIVACY_NOTICE_REQUIRED" ||
        result?.code === "PRIVACY_NOTICE_REQUIRED"
      )
        await loadConfiguration();
      throw new Error(
        "Registration could not be accepted. Check the fields and current privacy notice, then retry.",
      );
    }
    if (
      response.status !== 202 ||
      typeof result.receipt_id !== "string" ||
      result.status !== "RECEIVED"
    )
      throw new Error(
        "Unexpected registration response. Retry this submission.",
      );
    previousContent = null;
    submissionId = null;
    form.reset();
    updateProgress();
    showSuccess(result.receipt_id);
  } catch (error) {
    statusMessage.className = "status-message error";
    statusMessage.textContent =
      error.message ||
      "Unable to submit registration. Check your internet connection and try again.";
  } finally {
    setSubmitting(false);
  }
});

async function loadConfiguration() {
  intakeConfig = null;
  submitButton.disabled = true;
  fields.consent.checked = false;
  fields.consent.disabled = true;
  try {
    const url = new URL(API_BASE);
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      !["https:", "http:"].includes(url.protocol) ||
      (url.protocol === "http:" &&
        !["localhost", "127.0.0.1"].includes(url.hostname))
    )
      throw new Error("configuration");
    const response = await fetch(
      API_BASE + "/api/v1/participant-intake/config",
      {
        credentials: "omit",
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    const config = await response.json();
    if (
      !response.ok ||
      !config.accepting_submissions ||
      !config.privacy_notice_version ||
      !config.privacy_notice ||
      config.source_system !== "UNIJAY_FASHION"
    )
      throw new Error("configuration");
    for (const field of Object.values(topicFields)) {
      if (!config.training_interests?.[field.value])
        throw new Error("configuration");
    }
    document.getElementById("privacyNotice").textContent =
      config.privacy_notice;
    document.getElementById("privacyVersion").textContent =
      "Notice version: " + config.privacy_notice_version;
    intakeConfig = config;
    fields.consent.disabled = false;
    submitButton.disabled = false;
  } catch {
    document.getElementById("privacyNotice").textContent =
      "Registration is temporarily unavailable. Please try again later.";
  }
}
updateProgress();
loadConfiguration();
