import { auth } from "./services/firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { subscribeAgentLeads, updateLead } from "./services/agentService.js";
import { logHistory } from "./services/historyService.js";

let currentUser = null;
let leadsCache = [];
let lastVisible = null;
let selectedLead = null;

const table = document.getElementById("leadsTable");

onAuthStateChanged(auth, (user) => {
  if (!user) return location.href = "/";

  currentUser = user;
  loadLeads(currentUser);

});

function loadLeads(user) {

  subscribeAgentLeads(user, (leads) => {

    leadsCache = leads;
    renderLeads();
    calculateKPIs();

  });
}

function renderLeads() {
  table.innerHTML = "";

  leadsCache.forEach(lead => {
    table.innerHTML += `
      <tr class="border-b border-gray-700">
        <td class="p-4">${lead.studentName}</td>
        <td>${lead.phone}</td>
        <td>${lead.status}</td>
        <td>₹${lead.amount || 0}</td>
        <td>
          <button data-id="${lead.id}" class="editBtn text-cyan-400">
            Edit
          </button>
        </td>
      </tr>
    `;
  });

  attachEditEvents();
}

function calculateKPIs() {
  const total = leadsCache.length;
  const follow = leadsCache.filter(l => l.status === "Follow Up").length;
  const joined = leadsCache.filter(l => l.status === "Joined").length;
  const revenue = leadsCache
    .filter(l => l.status === "Joined")
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  document.getElementById("kpiTotal").textContent = total;
  document.getElementById("kpiFollow").textContent = follow;
  document.getElementById("kpiJoined").textContent = joined;
  document.getElementById("kpiRevenue").textContent = `₹${revenue}`;
}

function attachEditEvents() {
  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
}

function openModal(id) {
  selectedLead = leadsCache.find(l => l.id === id);
  document.getElementById("editModal").classList.remove("hidden");
}

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("editModal").classList.add("hidden");
});

document.getElementById("statusSelect").addEventListener("change", (e) => {
  const followInput = document.getElementById("followUpInput");
  const amountInput = document.getElementById("amountInput");

  followInput.classList.add("hidden");
  amountInput.classList.add("hidden");

  if (e.target.value === "Follow Up") {
    followInput.classList.remove("hidden");
  }

  if (e.target.value === "Joined") {
    amountInput.classList.remove("hidden");
  }
});

document.getElementById("saveLeadBtn").addEventListener("click", async () => {

  const status = document.getElementById("statusSelect").value;
  const remarks = document.getElementById("remarksInput").value;
  const followUpTime = document.getElementById("followUpInput").value;
  const amount = document.getElementById("amountInput").value;

  let updateData = { status, remarks };

  if (status === "Follow Up") {
    updateData.followUpTime = new Date(followUpTime);
  } else if (selectedLead.followUpTime) {
    updateData.followUpTime = null;

    await logHistory(selectedLead.id, {
      actionType: "FOLLOWUP_RESET",
      oldValue: selectedLead.followUpTime,
      newValue: null,
      changedBy: currentUser.uid,
      role: "agent"
    });
  }

  if (status === "Joined") {
    if (!amount) return alert("Amount required");
    updateData.amount = Number(amount);

    await logHistory(selectedLead.id, {
      actionType: "AMOUNT_UPDATED",
      oldValue: selectedLead.amount || 0,
      newValue: Number(amount),
      changedBy: currentUser.uid,
      role: "agent"
    });
  }

  await logHistory(selectedLead.id, {
    actionType: "STATUS_CHANGED",
    oldValue: selectedLead.status,
    newValue: status,
    changedBy: currentUser.uid,
    role: "agent"
  });

  await updateLead(selectedLead.id, updateData);

  document.getElementById("editModal").classList.add("hidden");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
});

