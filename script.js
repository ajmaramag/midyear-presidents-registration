const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzHgE-WPyy0aMpLjIXIaPpRhjW-OI1GUMQn0LNK2wsVUpJNmPA0kZmgiiO8DEiK50DKyQ/exec";

const universities = [
  "Adiong Memorial State College",
  "Aurora State College of Technology",
  "Bataan Peninsula State University",
  "Biliran Province State University",
  "Camarines Norte State College",
  "Camarines Sur Polytechnic College",
  "Camiguin Polytechnic State College",
  "Capiz State University",
  "Guimaras State University",
  "Ifugao State University",
  "Kalinga State University",
  "Leyte Normal University",
  "Marikina Polytechnic College",
  "National Aviation Academy of the Philippines",
  "Northern Bukidnon State College",
  "Pampanga State University",
  "President Ramon Magsaysay State University",
  "Romblon State University",
  "South Cotabato State College",
  "Southern Leyte State University",
  "Zamboanga Peninsula Polytechnic State University",
  "Zamboanga State College of Marine Science and Technology"
];

const form = document.querySelector("#registrationForm");
const institutionSelect = document.querySelector("#institution");
const companionsPanel = document.querySelector("#companionsPanel");
const companionList = document.querySelector("#companionList");
const addCompanionButton = document.querySelector("#addCompanionButton");
const landPanel = document.querySelector("#landPanel");
const airPanel = document.querySelector("#airPanel");
const formStatus = document.querySelector("#formStatus");
const submitButton = document.querySelector("#submitButton");

let companionId = 0;

function populateUniversities() {
  universities.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    institutionSelect.append(option);
  });
}

function setPanelEnabled(panel, enabled) {
  panel.hidden = !enabled;

  panel.querySelectorAll("input, select, textarea").forEach((field) => {
    field.disabled = !enabled;
    field.required = enabled && field.hasAttribute("data-required");
  });
}

function createCompanionCard() {
  companionId += 1;

  const card = document.createElement("div");
  card.className = "companion-card";
  card.dataset.companionCard = "";
  card.innerHTML = `
    <div class="companion-card-header">
      <h3>Companion</h3>
      <button class="button button-link" type="button" data-remove-companion>Remove</button>
    </div>
    <div class="field-grid">
      <label class="field" for="companionName${companionId}">
        <span>Name of companion</span>
        <input id="companionName${companionId}" type="text" data-field="name" data-required>
      </label>
      <label class="field" for="companionDesignation${companionId}">
        <span>Designation of companion</span>
        <input id="companionDesignation${companionId}" type="text" data-field="designation" data-required>
      </label>
      <label class="field" for="companionPhone${companionId}">
        <span>Cellphone number</span>
        <input id="companionPhone${companionId}" type="tel" placeholder="+63 9XX XXX XXXX" data-field="phone" data-required>
      </label>
      <label class="field" for="companionEmail${companionId}">
        <span>Email address</span>
        <input id="companionEmail${companionId}" type="email" placeholder="companion@example.edu.ph" data-field="email" data-required>
      </label>
    </div>
  `;

  card.querySelector("[data-remove-companion]").addEventListener("click", () => {
    card.remove();
    if (isBringingCompanions() && companionList.children.length === 0) {
      companionList.append(createCompanionCard());
    }
    updateCompanionLabels();
  });

  return card;
}

function updateCompanionLabels() {
  companionList.querySelectorAll("[data-companion-card]").forEach((card, index) => {
    card.querySelector("h3").textContent = `Companion ${index + 1}`;
  });
}

function isBringingCompanions() {
  return form.elements.bringingCompanions.value === "yes";
}

function updateCompanionSection() {
  const enabled = isBringingCompanions();

  if (enabled && companionList.children.length === 0) {
    companionList.append(createCompanionCard());
  }

  setPanelEnabled(companionsPanel, enabled);
  updateCompanionLabels();
}

function updateTransportSections() {
  const mode = form.elements.transportMode.value;
  setPanelEnabled(landPanel, mode === "land");
  setPanelEnabled(airPanel, mode === "air");
}

function value(selector, root = document) {
  const field = root.querySelector(selector);
  return field ? field.value.trim() : "";
}

function collectCompanions() {
  if (!isBringingCompanions()) {
    return [];
  }

  return [...companionList.querySelectorAll("[data-companion-card]")].map((card) => ({
    name: value('[data-field="name"]', card),
    designation: value('[data-field="designation"]', card),
    phone: value('[data-field="phone"]', card),
    email: value('[data-field="email"]', card)
  }));
}

function collectPayload() {
  const transportMode = form.elements.transportMode.value;

  return {
    submittedAt: new Date().toISOString(),
    institution: value("#institution"),
    president: {
      name: value("#presidentName"),
      cellphone: value("#presidentPhone"),
      email: value("#presidentEmail")
    },
    bringingCompanions: form.elements.bringingCompanions.value,
    companions: collectCompanions(),
    transportation: {
      mode: transportMode,
      landArrangement: transportMode === "land" ? form.elements.landArrangement.value : "",
      landDepartureDateTime: transportMode === "land" ? value("#landDepartureDateTime") : "",
      departureAirport: transportMode === "air" ? value("#departureAirport") : "",
      arrivalAirport: transportMode === "air" ? value("#arrivalAirport") : "",
      airline: transportMode === "air" ? value("#airline") : "",
      flightDateTime: transportMode === "air" ? value("#flightDateTime") : ""
    },
    accommodation: {
      hotel: value("#hotel"),
      checkIn: value("#checkIn"),
      checkOut: value("#checkOut")
    }
  };
}

function setStatus(message, type = "") {
  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`.trim();
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Submitting..." : "Submit registration";
}

function endpointIsConfigured() {
  return GOOGLE_SCRIPT_URL.startsWith("https://script.google.com/macros/s/");
}

async function submitToGoogleSheet(payload) {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });
}

form.addEventListener("change", (event) => {
  if (event.target.name === "bringingCompanions") {
    updateCompanionSection();
  }

  if (event.target.name === "transportMode") {
    updateTransportSections();
  }
});

addCompanionButton.addEventListener("click", () => {
  companionList.append(createCompanionCard());
  setPanelEnabled(companionsPanel, true);
  updateCompanionLabels();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  updateCompanionSection();
  updateTransportSections();
  setStatus("");

  if (!form.reportValidity()) {
    setStatus("Please complete the required fields before submitting.", "error");
    return;
  }

  if (!endpointIsConfigured()) {
    setStatus("Registration is not connected to the response sheet yet. Please contact the event secretariat.", "error");
    return;
  }

  setSubmitting(true);

  try {
    await submitToGoogleSheet(collectPayload());
    form.reset();
    companionList.innerHTML = "";
    updateCompanionSection();
    updateTransportSections();
    setStatus("Registration submitted. Thank you.", "success");
  } catch (error) {
    setStatus("Submission could not be completed. Please check the Google Sheet connection.", "error");
  } finally {
    setSubmitting(false);
  }
});

populateUniversities();
updateCompanionSection();
updateTransportSections();
