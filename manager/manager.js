import { listenLeads } from "./services/leadService.js";
import { loadAgents, getAgentName, getAllAgents } from "./services/userService.js";
import { db } from "./services/firebase-init.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Elements
const leadTableBody = document.getElementById("leadTableBody");
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

async function init() {
  await loadAgents();
  listenLeads(renderLeads);
}

function renderLeads(leads) {

  leadTableBody.innerHTML = "";

  leads.forEach(lead => {

    const row = document.createElement("tr");
    row.className = "border-b border-gray-700 hover:bg-gray-800 transition cursor-pointer";

    row.innerHTML = `
      <td class="p-4">${lead.studentName}</td>
      <td class="p-4">${lead.phone}</td>
      <td class="p-4">${lead.status}</td>
      <td class="p-4">${getAgentName(lead.assignedTo)}</td>
      <td class="p-4">₹${lead.amount || 0}</td>
      <td class="p-4">${lead.createdAt ? lead.createdAt.toDate().toLocaleDateString() : ""}</td>
    `;

    row.addEventListener("click", () => openDetailModal(lead));

    leadTableBody.appendChild(row);
  });
}

function openDetailModal(lead) {

  currentLead = lead;

  detailStudent.textContent = lead.studentName;
  detailPhone.textContent = lead.phone;
  detailStatus.value = lead.status;
  detailRemarks.value = lead.remarks || "";
  detailAmount.value = lead.amount || "";

  if (lead.followUpTime) {
    const dt = lead.followUpTime.toDate();
    detailFollowUp.value = dt.toISOString().slice(0,16);
  }

  toggleStatusFields();

  loadHistory(lead.id);

  detailModal.classList.remove("hidden");
  detailModal.classList.add("flex");
}

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

closeDetailModal.addEventListener("click", () => {
  detailModal.classList.add("hidden");
  detailModal.classList.remove("flex");
});

// Save Changes
saveDetail.addEventListener("click", async () => {

  const oldStatus = currentLead.status;
  const newStatus = detailStatus.value;

  let updateData = {
    status: newStatus,
    remarks: detailRemarks.value,
    updatedAt: serverTimestamp()
  };

  // Follow Up logic
  if (newStatus === "Follow Up") {

    if (!detailFollowUp.value) {
      alert("Select follow up time");
      return;
    }

    updateData.followUpTime = new Date(detailFollowUp.value);

  } else {
    if (oldStatus === "Follow Up") {
      updateData.followUpTime = null;

      await logHistory("FOLLOWUP_RESET", oldStatus, newStatus);
    }
  }

  // Joined logic
  if (newStatus === "Joined") {

    if (!detailAmount.value) {
      alert("Enter amount");
      return;
    }

    updateData.amount = Number(detailAmount.value);

    await logHistory("AMOUNT_UPDATED", currentLead.amount || 0, updateData.amount);
  }

  await updateDoc(doc(db, "leads", currentLead.id), updateData);

  await logHistory("STATUS_CHANGED", oldStatus, newStatus);

  detailModal.classList.add("hidden");
  detailModal.classList.remove("flex");
});

async function logHistory(type, oldValue, newValue) {

  await addDoc(
    collection(db, "leads", currentLead.id, "history"),
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

async function loadHistory(leadId) {

  historyContainer.innerHTML = "";

  const q = query(
    collection(db, "leads", leadId, "history"),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    const data = doc.data();

    const div = document.createElement("div");
    div.className = "bg-[#0B1120] p-3 rounded-lg";

    div.textContent =
      `${data.actionType}: ${data.oldValue} → ${data.newValue}`;

    historyContainer.appendChild(div);
  });
}

init();
