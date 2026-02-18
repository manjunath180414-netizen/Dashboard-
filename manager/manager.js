import { listenLeads } from "./services/leadService.js";
import { loadAgents, getAgentName, getAllAgents } from "./services/userService.js";
import { db } from "./services/firebase-init.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const leadTableBody = document.getElementById("leadTableBody");

// Modal
const leadModal = document.getElementById("leadModal");
const openLeadModal = document.getElementById("openLeadModal");
const closeLeadModal = document.getElementById("closeLeadModal");
const saveLead = document.getElementById("saveLead");

const leadStudentName = document.getElementById("leadStudentName");
const leadPhone = document.getElementById("leadPhone");
const leadAgent = document.getElementById("leadAgent");

// Bulk
const bulkBar = document.getElementById("bulkBar");
const selectedCount = document.getElementById("selectedCount");
const bulkAgent = document.getElementById("bulkAgent");
const bulkAssignBtn = document.getElementById("bulkAssignBtn");

let selectedLeads = new Set();

async function init() {

  await loadAgents();
  populateAgentDropdown();

  listenLeads(renderLeads);
}

function populateAgentDropdown() {

  const agents = getAllAgents();

  for (let uid in agents) {
    const option1 = document.createElement("option");
    option1.value = uid;
    option1.textContent = agents[uid];
    leadAgent.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = uid;
    option2.textContent = agents[uid];
    bulkAgent.appendChild(option2);
  }
}

function renderLeads(leads) {

  leadTableBody.innerHTML = "";
  selectedLeads.clear();
  updateBulkBar();

  leads.forEach(lead => {

    const row = document.createElement("tr");
    row.className = "border-b border-gray-700 hover:bg-gray-800 transition";

    row.innerHTML = `
      <td class="p-4">
        <input type="checkbox" data-id="${lead.id}" />
      </td>
      <td class="p-4">${lead.studentName || ""}</td>
      <td class="p-4">${lead.phone || ""}</td>
      <td class="p-4">${lead.status || ""}</td>
      <td class="p-4">${getAgentName(lead.assignedTo)}</td>
      <td class="p-4">₹${lead.amount || 0}</td>
      <td class="p-4">${lead.followUpTime ? "Yes" : "-"}</td>
      <td class="p-4">${lead.createdAt ? lead.createdAt.toDate().toLocaleDateString() : ""}</td>
      <td class="p-4">⋮</td>
    `;

    const checkbox = row.querySelector("input");

    checkbox.addEventListener("change", (e) => {

      if (e.target.checked) {
        selectedLeads.add(lead.id);
      } else {
        selectedLeads.delete(lead.id);
      }

      updateBulkBar();
    });

    leadTableBody.appendChild(row);
  });
}

function updateBulkBar() {

  if (selectedLeads.size > 0) {
    bulkBar.classList.remove("hidden");
    selectedCount.textContent = `${selectedLeads.size} Selected`;
  } else {
    bulkBar.classList.add("hidden");
  }
}

// Bulk Assign
bulkAssignBtn.addEventListener("click", async () => {

  const agentUID = bulkAgent.value;

  if (!agentUID) {
    alert("Select an agent");
    return;
  }

  const batch = writeBatch(db);

  selectedLeads.forEach(leadId => {
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

// Modal logic
openLeadModal.addEventListener("click", () => {
  leadModal.classList.remove("hidden");
  leadModal.classList.add("flex");
});

closeLeadModal.addEventListener("click", () => {
  leadModal.classList.add("hidden");
  leadModal.classList.remove("flex");
});

// Save Lead
saveLead.addEventListener("click", async () => {

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

init();
