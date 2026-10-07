const API_URL = "https://script.google.com/macros/s/AKfycbxifDCyKqY9ADKEeXNUo68YyMpn_VRBoENElTlrJxiB52YbTQIMLDMubpq-oI1g_zFgeA/exec";

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
  fullName: document.getElementById("fullName"),
  phone: document.getElementById("phone"),
  dateOfBirth: document.getElementById("dateOfBirth"),
  ghanaCard: document.getElementById("ghanaCard"),
  location: document.getElementById("location"),
  topicOfInterest: document.getElementById("careerReadiness"),
  consent: document.getElementById("consent")
};

const topicFields = {
  careerReadiness: document.getElementById("careerReadiness"),
  softSkills: document.getElementById("softSkills")
};

const requiredDataFields = ["fullName", "phone", "dateOfBirth", "ghanaCard", "location", "topicOfInterest"];

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
  if (fieldName === "fullName") {
    const value = fields.fullName.value.trim();
    const valid = value.length >= 2;
    setError("fullName", valid ? "" : "Enter the participant's full name.");
    return valid;
  }

  if (fieldName === "phone") {
    const valid = /^\+233\d{9}$/.test(normalizePhone(fields.phone.value));
    setError("phone", valid ? "" : "Enter a valid 10-digit Ghana phone number.");
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

    setError("dateOfBirth", valid ? "" : "Select a valid date of birth in the past.");
    return valid;
  }

  if (fieldName === "ghanaCard") {
    const formatted = normalizeGhanaCard(fields.ghanaCard.value);
    const valid = /^GHA-\d{9}-\d$/.test(formatted);
    setError("ghanaCard", valid ? "" : "Enter a valid Ghana Card number: GHA-XXXXXXXXX-X.");
    return valid;
  }

  if (fieldName === "location") {
    const value = fields.location.value.trim();
    const valid = value.length >= 2;
    setError("location", valid ? "" : "Enter the participant's current area or community.");
    return valid;
  }

  if (fieldName === "topicOfInterest") {
    const selectedTopics = getSelectedTopics();
    const valid = selectedTopics.length > 0;
    setError("topicOfInterest", valid ? "" : "Select at least one topic of interest.");
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
  if (fieldName === "fullName") return fields.fullName.value.trim().length >= 2;
  if (fieldName === "phone") return /^\+233\d{9}$/.test(normalizePhone(fields.phone.value));
  if (fieldName === "dateOfBirth") return Boolean(fields.dateOfBirth.value);
  if (fieldName === "ghanaCard") return /^GHA-\d{9}-\d$/.test(normalizeGhanaCard(fields.ghanaCard.value));
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
  submitButton.disabled = isSubmitting;
  submitButtonText.textContent = isSubmitting ? "Submitting..." : "Submit Registration";
  submitSpinner.classList.toggle("visible", isSubmitting);

  [...Object.values(fields), ...Object.values(topicFields)].forEach((field) => {
    if (field) field.disabled = isSubmitting;
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
  fields.fullName.focus();
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

  if (!validateForm()) {
    const firstInvalid = requiredDataFields
      .map((name) => fields[name])
      .find((field) => field.getAttribute("aria-invalid") === "true") || (!fields.consent.checked ? fields.consent : null);
    firstInvalid?.focus();
    return;
  }

  const payload = {
    fullName: fields.fullName.value.trim(),
    phone: normalizePhone(fields.phone.value),
    dateOfBirth: fields.dateOfBirth.value,
    ghanaCard: normalizeGhanaCard(fields.ghanaCard.value),
    location: fields.location.value.trim(),
    topicOfInterest: getSelectedTopics(),
    consent: true
  };

  setSubmitting(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    if (!response.ok || !response.headers.get("Content-Type")?.includes("application/json")) {
      throw new Error("The registration service is unavailable. Contact the registration administrator.");
    }

    const result = await response.json();

    if (!result.success) {
      if (result.code === "DUPLICATE") {
        throw new Error("This person may already be registered. The phone number or Ghana Card number already exists. Please check the details before trying again.");
      }
      throw new Error(result.message || "Submission failed.");
    }

    form.reset();
    updateProgress();
    showSuccess(result.recordId);
  } catch (error) {
    console.error(error);
    statusMessage.className = "status-message error";
    statusMessage.textContent = error.message || "Unable to submit registration. Check your internet connection and try again.";
  } finally {
    setSubmitting(false);
  }
});

updateProgress();
