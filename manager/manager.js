import { listenLeads } from "./services/leadService.js";
import { loadAgents, getAgentName, getAllAgents } from "./services/userService.js";
import { db } from "./services/firebase-init.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const leadTableBody = document.getElementById("leadTableBody");

// Modal elements
const leadModal = document.getElementById("leadModal");
const openLeadModal = document.getElementById("openLeadModal");
const closeLeadModal = document.getElementById("closeLeadModal");
const saveLead = document.getElementById("saveLead");

const leadStudentName = document.getElementById("leadStudentName");
const leadPhone = document.getElementById("leadPhone");
const leadAgent = document.getElementById("leadAgent");

async function init() {

  await loadAgents();
  populateAgentDropdown();

  listenLeads(renderLeads);
}

function populateAgentDropdown() {

  const agents = getAllAgents();

  for (let uid in agents) {
    const option = document.createElement("option");
    option.value = uid;
    option.textContent = agents[uid];
    leadAgent.appendChild(option);
  }
}

function renderLeads(leads) {

  leadTableBody.innerHTML = "";

  leads.forEach(lead => {

    const row = `
      <tr class="border-b border-gray-700 hover:bg-gray-800 transition">
        <td class="p-4"><input type="checkbox" /></td>
        <td class="p-4">${lead.studentName || ""}</td>
        <td class="p-4">${lead.phone || ""}</td>
        <td class="p-4">${lead.status || ""}</td>
        <td class="p-4">${getAgentName(lead.assignedTo)}</td>
        <td class="p-4">₹${lead.amount || 0}</td>
        <td class="p-4">${lead.followUpTime ? "Yes" : "-"}</td>
        <td class="p-4">${lead.createdAt ? lead.createdAt.toDate().toLocaleDateString() : ""}</td>
        <td class="p-4">⋮</td>
      </tr>
    `;

    leadTableBody.innerHTML += row;
  });
}

// Open modal
openLeadModal.addEventListener("click", () => {
  leadModal.classList.remove("hidden");
  leadModal.classList.add("flex");
});

// Close modal
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

