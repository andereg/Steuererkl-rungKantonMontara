const STORAGE_KEY = "tax_montara_form";

const incomeFields = [
  "salaryIncome",
  "bonusIncome",
  "sideIncome",
  "selfEmploymentIncome",
  "unemploymentIncome",
  "pensionIncome",
  "investmentIncome",
  "dividendIncome",
  "interestIncome",
  "rentalIncome",
  "otherIncome"
];

const assetFields = [
  "bankAccount1",
  "bankAccount2",
  "cashAssets",
  "cryptoAssets",
  "securitiesAssets",
  "propertyTaxValue"
];

const professionalFields = [
  "commutingCosts",
  "mealCosts",
  "homeOfficeCosts",
  "otherProfessionalCosts"
];

const healthFields = [
  "healthInsurancePremiums",
  "healthCostsNotCovered",
  "dentalCosts",
  "careCosts"
];

const pillarFields = [
  "pillar3aContribution",
  "pensionFundContribution"
];

const educationFields = [
  "educationCosts",
  "educationBooksCosts",
  "educationTravelCosts"
];

const debtFields = [
  "debtInterest",
  "otherDebtCosts",
  "lifeInsuranceCosts",
  "bankFees"
];

const otherDeductionFields = [
  "donations",
  "membershipFees",
  "propertyMaintenance",
  "energySavingInvestments",
  "childcareCosts",
  "alimonyPaid",
  "supportPayments"
];

const partnerIncomeFields = [
  "partnerIncome"
];

const standardDeductions = {
  commutingCosts: 1200,
  mealCosts: 1600,
  homeOfficeCosts: 0,
  otherProfessionalCosts: 300,
  healthInsurancePremiums: 4200,
  healthCostsNotCovered: 0,
  dentalCosts: 0,
  careCosts: 0,
  pillar3aContribution: 7056,
  pensionFundContribution: 0,
  educationCosts: 500,
  educationBooksCosts: 120,
  educationTravelCosts: 80,
  debtInterest: 0,
  otherDebtCosts: 0,
  lifeInsuranceCosts: 0,
  bankFees: 60,
  donations: 0,
  membershipFees: 0,
  propertyMaintenance: 0,
  energySavingInvestments: 0
};

function getForm() {
  return document.getElementById("taxForm");
}

function getAllFields(form) {
  return Array.from(form.querySelectorAll("input, select, textarea"));
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return `CHF ${Math.round(value).toLocaleString("de-CH")}`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function saveForm(form) {
  const data = {};

  getAllFields(form).forEach((field) => {
    if (!field.name && !field.id) return;

    const key = field.name || field.id;

    if (field.type === "checkbox") {
      data[key] = field.checked;
    } else {
      data[key] = field.value;
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadForm(form) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }

  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements[key] || document.getElementById(key);
    if (!field) return;

    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value;
    }
  });
}

function clearMessage() {
  const messageBox = document.getElementById("messageBox");
  if (messageBox) {
    messageBox.textContent = "";
  }
}

function showMessage(text, isError = false) {
  const messageBox = document.getElementById("messageBox");
  if (!messageBox) return;

  messageBox.textContent = text;
  messageBox.style.color = isError ? "#b42318" : "#17663a";
}

function getRequiredFields(form) {
  return Array.from(form.querySelectorAll("[data-required='true']"));
}

function isFieldFilled(field) {
  if (field.type === "checkbox") {
    return field.checked;
  }

  if (field.type === "number") {
    return field.value !== "";
  }

  return String(field.value || "").trim() !== "";
}

function updateCompletion(form) {
  const requiredFields = getRequiredFields(form);
  if (requiredFields.length === 0) {
    setText("completionText", "100%");
    return;
  }

  const completed = requiredFields.filter(isFieldFilled).length;
  const percent = Math.round((completed / requiredFields.length) * 100);
  setText("completionText", `${percent}%`);
}

function sumFields(form, fieldNames) {
  return fieldNames.reduce((sum, name) => {
    const field = form.elements[name];
    return sum + toNumber(field ? field.value : 0);
  }, 0);
}

function updateSummary(form) {
  const totalIncome = sumFields(form, incomeFields);
  const partnerIncomeTotal = sumFields(form, partnerIncomeFields);
  const assetsTotal = sumFields(form, assetFields);

  const professionalTotal = sumFields(form, professionalFields);
  const healthTotal = sumFields(form, healthFields);
  const pillarTotal = sumFields(form, pillarFields);
  const educationTotal = sumFields(form, educationFields);
  const debtTotal = sumFields(form, debtFields);
  const otherDeductionTotal = sumFields(form, otherDeductionFields);

  const deductionTotal =
      professionalTotal +
      healthTotal +
      pillarTotal +
      educationTotal +
      debtTotal +
      otherDeductionTotal;

  const taxableIncome = Math.max(0, totalIncome + partnerIncomeTotal - deductionTotal);

  setText("totalIncome", formatCurrency(totalIncome));
  setText("partnerIncomeTotal", formatCurrency(partnerIncomeTotal));
  setText("assetsTotal", formatCurrency(assetsTotal));
  setText("professionalTotal", formatCurrency(professionalTotal));
  setText("healthTotal", formatCurrency(healthTotal));
  setText("pillarTotal", formatCurrency(pillarTotal));
  setText("educationTotal", formatCurrency(educationTotal));
  setText("debtTotal", formatCurrency(debtTotal));
  setText("otherDeductionTotal", formatCurrency(otherDeductionTotal));
  setText("deductionTotal", formatCurrency(deductionTotal));
  setText("taxableIncome", formatCurrency(taxableIncome));
}

function buildChip(label, kind = "neutral") {
  const chip = document.createElement("span");
  chip.className = `chip chip-${kind}`;
  chip.textContent = label;

  chip.style.display = "inline-flex";
  chip.style.alignItems = "center";
  chip.style.padding = "6px 10px";
  chip.style.fontSize = "0.9rem";
  chip.style.margin = "4px";
  chip.style.background =
      kind === "success" ? "#e8f7ee" :
          kind === "warning" ? "#fff4e5" :
              "#eef2f6";
  chip.style.color =
      kind === "success" ? "#17663a" :
          kind === "warning" ? "#9a6700" :
              "#344054";

  return chip;
}

function updateChips(form) {
  const chipRow = document.getElementById("chipRow");
  if (!chipRow) return;

  chipRow.innerHTML = "";

  const requiredFields = getRequiredFields(form);
  const missingRequired = requiredFields.filter((field) => !isFieldFilled(field)).length;

  const attachedDocuments = [
    ["salaryStatementAttached", "Lohnausweis"],
    ["bankStatementsAttached", "Bankauszüge"],
    ["insuranceCertificatesAttached", "Versicherungsnachweise"],
    ["pillar3aCertificateAttached", "Säule 3a"],
    ["educationProofAttached", "Weiterbildung"],
    ["donationProofAttached", "Spendenbestätigungen"]
  ];

  const attached = attachedDocuments
      .filter(([name]) => form.elements[name] && form.elements[name].checked)
      .map(([, label]) => label);

  if (missingRequired === 0) {
    chipRow.appendChild(buildChip("Pflichtfelder vollständig", "success"));
  } else {
    chipRow.appendChild(buildChip(`${missingRequired} Pflichtfeld(er) offen`, "warning"));
  }

  if (attached.length > 0) {
    attached.forEach((label) => {
      chipRow.appendChild(buildChip(`Beilage: ${label}`, "neutral"));
    });
  } else {
    chipRow.appendChild(buildChip("Noch keine Beilagen markiert", "neutral"));
  }

  const hasProperty = form.elements.hasProperty?.value === "ja";
  if (hasProperty) {
    chipRow.appendChild(buildChip("Immobilie angegeben", "neutral"));
  }

  const withholdingTax = form.elements.withholdingTax?.value === "ja";
  if (withholdingTax) {
    chipRow.appendChild(buildChip("Quellenbesteuerung aktiv", "neutral"));
  }
}

function refreshUI(form) {
  updateCompletion(form);
  updateSummary(form);
  updateChips(form);
  saveForm(form);
}

function applyStandardDeductions(form) {
  Object.entries(standardDeductions).forEach(([name, value]) => {
    const field = form.elements[name];
    if (!field) return;
    field.value = value;
  });

  refreshUI(form);
  showMessage("Standardabzüge wurden vorbelegt.");
}

function clearStandardDeductions(form) {
  Object.keys(standardDeductions).forEach((name) => {
    const field = form.elements[name];
    if (!field) return;
    field.value = "";
  });

  refreshUI(form);
  showMessage("Vorbelegte Standardabzüge wurden entfernt.");
}

function validateForm(form) {
  const requiredFields = getRequiredFields(form);
  const firstInvalid = requiredFields.find((field) => !isFieldFilled(field));

  requiredFields.forEach((field) => {
    if (isFieldFilled(field)) {
      field.style.outline = "";
      field.style.borderColor = "";
    } else {
      field.style.outline = "2px solid rgba(180, 35, 24, 0.15)";
      field.style.borderColor = "#b42318";
    }
  });

  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalid.focus();
    return false;
  }

  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = getForm();
  if (!form) return;

  loadForm(form);
  refreshUI(form);

  const useStandardDeductions = document.getElementById("useStandardDeductions");
  if (useStandardDeductions) {
    useStandardDeductions.addEventListener("change", (event) => {
      if (event.target.checked) {
        applyStandardDeductions(form);
      } else {
        clearStandardDeductions(form);
      }
    });
  }

  form.addEventListener("input", () => {
    clearMessage();
    refreshUI(form);
  });

  form.addEventListener("change", () => {
    clearMessage();
    refreshUI(form);
  });

  const saveDraftButton = document.getElementById("saveDraftButton");
  if (saveDraftButton) {
    saveDraftButton.addEventListener("click", () => {
      saveForm(form);
      refreshUI(form);
      showMessage("Entwurf wurde lokal im Browser gespeichert.");
    });
  }

  const resetButton = document.getElementById("resetButton");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      window.setTimeout(() => {
        localStorage.removeItem(STORAGE_KEY);
        if (useStandardDeductions) {
          useStandardDeductions.checked = false;
        }
        refreshUI(form);
        showMessage("Formular wurde zurückgesetzt.");
      }, 0);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateForm(form)) {
      showMessage("Bitte fülle alle Pflichtfelder aus.", true);
      return;
    }

    saveForm(form);
    refreshUI(form);
    showMessage("Formular ist vollständig geprüft und lokal gespeichert.");
  });
});