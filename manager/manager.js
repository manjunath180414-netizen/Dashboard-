
import { listenLeads, listenStats } from "./services/leadService.js";
import { loadAgents, getAgentName, getAllAgents } from "./services/userService.js";


import { db } from "./services/firebase-init.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ===============================
   DOM ELEMENTS
================================ */

const leadTableBody = document.getElementById("leadTableBody");

// KPI
const totalLeadsEl = document.getElementById("totalLeads");
const newTodayEl = document.getElementById("newToday");
const joinedCountEl = document.getElementById("joinedCount");
const revenueCountEl = document.getElementById("revenueCount");

// Detail Modal
const detailModal = document.getElementById("detailModal");
const closeDetailModal = document.getElementById("closeDetailModal");
const saveDetail = document.getElementById("saveDetail");

const detailStudent = document.getElementById("detailStudent");
const detailPhone = document.getElementById("detailPhone");
const detailStatus = document.getElementById("detailStatus");
const detailFollowUp = document.getElementById("detailFollowUp");
const detailAmount = document.getElementById("detailAmount");
const detailRemarks = document.getElementById("detailRemarks");

const followUpContainer = document.getElementById("followUpContainer");
const amountContainer = document.getElementById("amountContainer");
const historyContainer = document.getElementById("historyContainer");

let currentLead = null;
// Bulk Assign
const bulkBar = document.getElementById("bulkBar");
const selectedCount = document.getElementById("selectedCount");
const bulkAgent = document.getElementById("bulkAgent");
const bulkAssignBtn = document.getElementById("bulkAssignBtn");

let selectedLeads = new Set();



/* ===============================
   INIT
================================ */

async function init() {
  await loadAgents();
  populateAgentDropdown();
  listenLeads(renderLeads);
  listenStats(updateKPI);
}

init();

/* ===============================
   KPI UPDATE (ALL LEADS)
================================ */

function updateKPI(stats) {
  totalLeadsEl.innerText = stats.total;
  newTodayEl.innerText = stats.newCount;
  joinedCountEl.innerText = stats.joinedCount;
  revenueCountEl.innerText = "₹" + stats.revenue.toLocaleString();
}

/* ===============================
   RENDER TABLE (PAGINATED)
================================ */

function renderLeads(leads) {

  leadTableBody.innerHTML = "";
  selectedLeads.clear();
  updateBulkBar();

  leads.forEach((lead) => {

    const row = document.createElement("tr");
    row.className =
      "border-b border-gray-700 hover:bg-gray-800 transition";

    row.innerHTML = `
      <td class="p-4">
        <input type="checkbox" class="lead-checkbox" />
      </td>
      <td class="p-4 cursor-pointer">${lead.studentName || ""}</td>
      <td class="p-4 cursor-pointer">${lead.phone || ""}</td>
      <td class="p-4 cursor-pointer">${lead.status || "New"}</td>
      <td class="p-4 cursor-pointer">${getAgentName(lead.assignedTo)}</td>
      <td class="p-4">₹${lead.amount || 0}</td>
      <td class="p-4">
        ${lead.createdAt ? lead.createdAt.toDate().toLocaleDateString() : ""}
      </td>
    `;

    const checkbox = row.querySelector(".lead-checkbox");

    checkbox.addEventListener("change", function () {

      if (this.checked) {
        selectedLeads.add(lead.id);
      } else {
        selectedLeads.delete(lead.id);
      }

      updateBulkBar();
    });

    row.addEventListener("click", function (e) {
      if (!e.target.classList.contains("lead-checkbox")) {
        openDetailModal(lead);
      }
    });

    leadTableBody.appendChild(row);
  });
}



/* ===============================
   OPEN DETAIL MODAL
================================ */

function openDetailModal(lead) {
  currentLead = lead;

  detailStudent.textContent = lead.studentName || "";
  detailPhone.textContent = lead.phone || "";
  detailRemarks.value = lead.remarks || "";

  // SAFE STATUS SET
  detailStatus.value = lead.status || "New";

  // FOLLOW UP VALUE
  if (lead.followUpTime) {
    const dt = lead.followUpTime.toDate();
    detailFollowUp.value = dt.toISOString().slice(0, 16);
  } else {
    detailFollowUp.value = "";
  }

  // AMOUNT
  detailAmount.value = lead.amount || "";

  toggleStatusFields();
  loadHistory(lead.id);

  detailModal.classList.remove("hidden");
  detailModal.classList.add("flex");
}

/* ===============================
   STATUS FIELD TOGGLE
================================ */

function toggleStatusFields() {
  if (detailStatus.value === "Follow Up") {
    followUpContainer.classList.remove("hidden");
  } else {
    followUpContainer.classList.add("hidden");
  }

  if (detailStatus.value === "Joined") {
    amountContainer.classList.remove("hidden");
  } else {
    amountContainer.classList.add("hidden");
  }
}

detailStatus.addEventListener("change", toggleStatusFields);

/* ===============================
   CLOSE MODAL
================================ */

closeDetailModal.addEventListener("click", () => {
  detailModal.classList.add("hidden");
  detailModal.classList.remove("flex");
});

/* ===============================
   SAVE CHANGES
================================ */

saveDetail.addEventListener("click", async () => {
  if (!currentLead) return;

  const oldStatus = currentLead.status || "New";
  const newStatus = detailStatus.value;

  let updateData = {
    status: newStatus,
    remarks: detailRemarks.value,
    updatedAt: serverTimestamp()
  };

  // FOLLOW UP LOGIC
  if (newStatus === "Follow Up") {
    if (!detailFollowUp.value) {
      alert("Select follow up time");
      return;
    }

    updateData.followUpTime = new Date(detailFollowUp.value);
  } else {
    if (oldStatus === "Follow Up") {
      updateData.followUpTime = null;

      await logHistory(
        currentLead.id,
        "FOLLOWUP_RESET",
        oldStatus,
        newStatus
      );
    }
  }

  // JOINED LOGIC
  if (newStatus === "Joined") {
    if (!detailAmount.value) {
      alert("Enter amount");
      return;
    }

    updateData.amount = Number(detailAmount.value);

    await logHistory(
      currentLead.id,
      "AMOUNT_UPDATED",
      currentLead.amount || 0,
      updateData.amount
    );
  }

  await updateDoc(doc(db, "leads", currentLead.id), updateData);

  await logHistory(
    currentLead.id,
    "STATUS_CHANGED",
    oldStatus,
    newStatus
  );

  detailModal.classList.add("hidden");
  detailModal.classList.remove("flex");
});
/* ===============================
   ADD LEAD MODAL
================================ */

// Open modal
openLeadModal?.addEventListener("click", () => {
  leadModal.classList.remove("hidden");
  leadModal.classList.add("flex");
});

// Close modal
closeLeadModal?.addEventListener("click", () => {
  leadModal.classList.add("hidden");
  leadModal.classList.remove("flex");
});

// Save new lead
saveLead?.addEventListener("click", async () => {

  const studentName = leadStudentName.value.trim();
  const phone = leadPhone.value.trim();
  const assignedTo = leadAgent.value || null;

  if (!studentName || !phone) {
    alert("Please fill all required fields");
    return;
  }

  await addDoc(collection(db, "leads"), {
    studentName,
    phone,
    status: "New",
    assignedTo,
    amount: 0,
    remarks: "",
    deleted: false,
    followUpTime: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  leadModal.classList.add("hidden");
  leadModal.classList.remove("flex");

  leadStudentName.value = "";
  leadPhone.value = "";
  leadAgent.value = "";
});


/* ===============================
   HISTORY LOGGING
================================ */

async function logHistory(leadId, type, oldValue, newValue) {
  await addDoc(
    collection(db, "leads", leadId, "history"),
    {
      actionType: type,
      oldValue,
      newValue,
      changedBy: "manager",
      role: "manager",
      timestamp: serverTimestamp()
    }
  );
}

/* ===============================
   LOAD HISTORY (ON DEMAND)
================================ */

async function loadHistory(leadId) {
  historyContainer.innerHTML = "";

  const q = query(
    collection(db, "leads", leadId, "history"),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.className = "bg-[#0B1120] p-3 rounded-lg";

    div.textContent =
      `${data.actionType}: ${data.oldValue} → ${data.newValue}`;

    historyContainer.appendChild(div);
  });
}

function updateBulkBar() {
  if (selectedLeads.size > 0) {
    bulkBar.classList.remove("hidden");
    selectedCount.textContent = selectedLeads.size + " Selected";
  } else {
    bulkBar.classList.add("hidden");
  }
}

bulkAssignBtn?.addEventListener("click", async () => {

  const agentUID = bulkAgent.value;

  if (!agentUID) {
    alert("Select an agent");
    return;
  }

  const { doc, writeBatch, serverTimestamp } = await import(
    "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js"
  );

  const batch = writeBatch(db);

  selectedLeads.forEach((leadId) => {
    const leadRef = doc(db, "leads", leadId);

    batch.update(leadRef, {
      assignedTo: agentUID,
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();

  selectedLeads.clear();
  bulkAgent.value = "";
  updateBulkBar();
});
/* ===============================
   IMPORT LEADS (CSV / EXCEL)
================================ */

const importBtn = document.getElementById("importLeadsBtn");
const fileInput = document.getElementById("fileInput");

if (importBtn) {
  importBtn.onclick = function () {
    fileInput.click();
  };
}

if (fileInput) {
  fileInput.onchange = function () {
    alert("File selected successfully");
  };
}


fileInput?.addEventListener("change", async (e) => {

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function (evt) {

    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!jsonData.length) {
      alert("File is empty");
      return;
    }

    // Detect headers
    const headers = Object.keys(jsonData[0]);

    let nameKey = null;
    let phoneKey = null;

    headers.forEach(header => {
      const normalized = header.toLowerCase().replace(/\s/g, "");

      if (!nameKey && normalized.includes("name")) {
        nameKey = header;
      }

      if (!phoneKey && (
        normalized.includes("number") ||
        normalized.includes("phone") ||
        normalized.includes("mobile")
      )) {
        phoneKey = header;
      }
    });

    if (!nameKey || !phoneKey) {
      alert("Could not detect Name and Phone columns");
      return;
    }

    const leadsToUpload = [];

    jsonData.forEach(row => {

      const studentName = row[nameKey]?.toString().trim();
      const phone = row[phoneKey]?.toString().trim();

      if (!studentName || !phone) return;

      leadsToUpload.push({
        studentName,
        phone,
        status: "New",
        assignedTo: null,
        amount: 0,
        remarks: "",
        deleted: false,
        followUpTime: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    if (!leadsToUpload.length) {
      alert("No valid leads found");
      return;
    }

    // Batch upload (500 limit)
    const { writeBatch, doc } = await import(
      "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js"
    );

    let batch = writeBatch(db);
    let counter = 0;

    for (let i = 0; i < leadsToUpload.length; i++) {

      const newRef = doc(collection(db, "leads"));
      batch.set(newRef, leadsToUpload[i]);
      counter++;

      if (counter === 500) {
        await batch.commit();
        batch = writeBatch(db);
        counter = 0;
      }
    }

    if (counter > 0) {
      await batch.commit();
    }

    alert(`${leadsToUpload.length} leads imported successfully`);
  };

  reader.readAsArrayBuffer(file);
});
function populateAgentDropdown() {

  const agents = getAllAgents();

  if (!agents || Object.keys(agents).length === 0) {
    bulkAgent.innerHTML = '<option value="">No Agents Found</option>';
    return;
  }

  bulkAgent.innerHTML = '<option value="">Select Agent</option>';

  for (let uid in agents) {
    const option = document.createElement("option");
    option.value = uid;
    option.textContent = agents[uid];
    bulkAgent.appendChild(option);
  }
}
