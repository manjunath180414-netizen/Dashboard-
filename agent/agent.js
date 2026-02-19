import { auth, db } from "./services/firebase-init.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let currentUser;
let allLeads = [];
let selectedLead = null;

/* ================= AUTH GUARD ================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;

  const userSnap = await getDoc(doc(db, "users", user.uid));

  if (!userSnap.exists() || userSnap.data().role !== "agent") {
    alert("Access denied");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("agentName").innerText = userSnap.data().name;

  loadLeads(user.uid);
});

/* ================= LOAD LEADS ================= */

function loadLeads(uid) {

  const q = query(
    collection(db, "leads"),
    where("assignedTo", "==", uid)
  );

  onSnapshot(q, (snapshot) => {

    allLeads = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.deleted === true) return;
      allLeads.push({ id: docSnap.id, ...data });
    });

    updateKPIs();
    renderTable();
  });
}

/* ================= KPI ================= */

function updateKPIs() {

  document.getElementById("kpiTotal").innerText = allLeads.length;

  document.getElementById("kpiFollow").innerText =
    allLeads.filter(l => l.status === "Follow Up").length;

  document.getElementById("kpiCallBack").innerText =
    allLeads.filter(l => l.status === "Call Back").length;

  const revenue = allLeads
    .filter(l => l.status === "Joined")
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  document.getElementById("kpiRevenue").innerText = "₹" + revenue;
}

/* ================= TABLE ================= */

function renderTable() {

  const table = document.getElementById("leadsTable");
  table.innerHTML = "";

  allLeads.forEach(lead => {

    const followUp = lead.followUpTime
      ? new Date(lead.followUpTime.seconds * 1000).toLocaleString()
      : "-";

    table.innerHTML += `
      <tr class="border-b border-gray-800">
        <td class="p-4">${lead.studentName}</td>
        <td class="p-4">${lead.phone}</td>
        <td class="p-4">${lead.status}</td>
        <td class="p-4">${followUp}</td>
        <td class="p-4">₹${lead.amount || 0}</td>
        <td class="p-4">
          <button onclick="openModal('${lead.id}')"
            class="bg-purple-600 px-3 py-1 rounded-xl">
            Edit
          </button>
        </td>
      </tr>
    `;
  });
}

/* ================= MODAL ================= */

window.openModal = function(id) {
  selectedLead = allLeads.find(l => l.id === id);
  document.getElementById("editModal").classList.remove("hidden");
};

document.getElementById("closeModal").onclick = () =>
  document.getElementById("editModal").classList.add("hidden");

/* ================= SAVE ================= */

document.getElementById("saveLead").onclick = async () => {

  const newStatus = document.getElementById("statusInput").value;
  const followTime = document.getElementById("followInput").value;
  const amount = document.getElementById("amountInput").value;
  const remarks = document.getElementById("remarksInput").value;

  if ((newStatus === "Follow Up" || newStatus === "Call Back") && !followTime)
    return alert("Follow up time required");

  if (newStatus === "Joined" && !amount)
    return alert("Amount required");

  const updates = {
    status: newStatus,
    remarks: remarks,
    followUpTime:
      (newStatus === "Follow Up" || newStatus === "Call Back")
        ? new Date(followTime)
        : null,
    amount: newStatus === "Joined" ? Number(amount) : 0,
    updatedAt: serverTimestamp()
  };

  await updateDoc(doc(db, "leads", selectedLead.id), updates);

  await addDoc(
    collection(db, "leads", selectedLead.id, "history"),
    {
      actionType: "STATUS_CHANGED",
      oldValue: selectedLead.status,
      newValue: newStatus,
      changedBy: currentUser.uid,
      role: "agent",
      timestamp: serverTimestamp()
    }
  );

  document.getElementById("editModal").classList.add("hidden");
};

/* ================= LOGOUT ================= */

document.getElementById("logoutBtn").onclick = () => signOut(auth);
