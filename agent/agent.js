import { auth, db } from "./services/firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { listenAgentLeads, updateLead } from "./services/agentService.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let currentUser;
let allLeads = [];
let selectedLead = null;
let currentFilter = "ALL";

const table = document.getElementById("leadsTable");

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "../index.html";

  currentUser = user;

  const userSnap = await getDoc(doc(db, "users", user.uid));
  document.getElementById("agentName").innerText = userSnap.data().name;

  listenAgentLeads(user.uid, (leads) => {
    allLeads = leads;
    updateKPIs();
    renderTable();
  });
});

function updateKPIs() {
  document.getElementById("kpiTotal").innerText = allLeads.length;
  document.getElementById("kpiFollow").innerText = allLeads.filter(l => l.status === "Follow Up").length;
  document.getElementById("kpiJoined").innerText = allLeads.filter(l => l.status === "Joined").length;

  const revenue = allLeads
    .filter(l => l.status === "Joined")
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  document.getElementById("kpiRevenue").innerText = "₹" + revenue;
}

function renderTable() {
  table.innerHTML = "";

  let filtered = allLeads;
  if (currentFilter !== "ALL") {
    filtered = allLeads.filter(l => l.status === currentFilter);
  }

  filtered.forEach(lead => {
    table.innerHTML += `
      <tr class="border-b border-gray-800">
        <td class="p-4">${lead.studentName}</td>
        <td class="p-4">${lead.phone}</td>
        <td class="p-4">${lead.status}</td>
        <td class="p-4">${lead.followUpTime ? new Date(lead.followUpTime.seconds * 1000).toLocaleString() : "-"}</td>
        <td class="p-4">₹${lead.amount || 0}</td>
        <td class="p-4">
          <button class="bg-purple-600 px-3 py-1 rounded-xl" onclick="openModal('${lead.id}')">
            Edit
          </button>
        </td>
      </tr>
    `;
  });
}

window.openModal = (id) => {
  selectedLead = allLeads.find(l => l.id === id);
  document.getElementById("editModal").classList.remove("hidden");
};

document.getElementById("closeModal").onclick = () =>
  document.getElementById("editModal").classList.add("hidden");

document.getElementById("saveLead").onclick = async () => {
  const newStatus = document.getElementById("statusInput").value;
  const followTime = document.getElementById("followInput").value;
  const amount = document.getElementById("amountInput").value;
  const remarks = document.getElementById("remarksInput").value;

  if (newStatus === "Follow Up" && !followTime) return alert("Follow-up required");
  if (newStatus === "Joined" && !amount) return alert("Amount required");

  const updates = {
    status: newStatus,
    remarks: remarks,
    followUpTime: newStatus === "Follow Up" ? new Date(followTime) : null,
    amount: newStatus === "Joined" ? Number(amount) : 0
  };

  await updateLead(selectedLead.id, updates);

  await addDoc(collection(db, "leads", selectedLead.id, "history"), {
    actionType: "STATUS_CHANGED",
    oldValue: selectedLead.status,
    newValue: newStatus,
    changedBy: currentUser.uid,
    role: "agent",
    timestamp: serverTimestamp()
  });

  document.getElementById("editModal").classList.add("hidden");
};

document.querySelectorAll(".tabBtn").forEach(btn => {
  btn.onclick = () => {
    currentFilter = btn.dataset.filter;
    renderTable();
  };
});

document.getElementById("logoutBtn").onclick = () => signOut(auth);

