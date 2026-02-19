import { auth, db } from "./services/firebase-init.js";

import {
  signInWithEmailAndPassword,
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

let currentUser = null;
let allLeads = [];
let selectedLead = null;
let currentFilter = "ALL";

/* =========================
   🔐 LOGIN FUNCTION
========================= */

window.agentLogin = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message);
  }
};

/* =========================
   🔐 AUTH STATE CHECK
========================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    // show login screen
    document.getElementById("loginSection").classList.remove("hidden");
    document.getElementById("dashboardSection").classList.add("hidden");
    return;
  }

  currentUser = user;

  const userSnap = await getDoc(doc(db, "users", user.uid));

  if (!userSnap.exists() || userSnap.data().role !== "agent") {
    alert("Not authorized");
    return;
  }

  document.getElementById("agentName").innerText = userSnap.data().name;

  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("dashboardSection").classList.remove("hidden");

  listenAgentLeads(user.uid);
});

/* =========================
   📡 LISTEN LEADS
========================= */

function listenAgentLeads(uid) {

  const q = query(
    collection(db, "leads"),
    where("assignedTo", "==", uid)
  );

  onSnapshot(q, (snapshot) => {

    allLeads = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      if (data.deleted === true) return;

      allLeads.push({ id: docSnap.id, ...data });
    });

    updateKPIs();
    renderTable();
  });
}

/* =========================
   📊 KPI UPDATE
========================= */

function updateKPIs() {
  document.getElementById("kpiTotal").innerText = allLeads.length;
  document.getElementById("kpiFollow").innerText =
    allLeads.filter(l => l.status === "Follow Up").length;

  document.getElementById("kpiJoined").innerText =
    allLeads.filter(l => l.status === "Joined").length;

  const revenue = allLeads
    .filter(l => l.status === "Joined")
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  document.getElementById("kpiRevenue").innerText = "₹" + revenue;
}

/* =========================
   📋 TABLE RENDER
========================= */

function renderTable() {

  const table = document.getElementById("leadsTable");
  table.innerHTML = "";

  let filtered = allLeads;

  if (currentFilter !== "ALL") {
    filtered = allLeads.filter(l => l.status === currentFilter);
  }

  filtered.forEach(lead => {

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

/* =========================
   🪟 MODAL
========================= */

window.openModal = function (id) {
  selectedLead = allLeads.find(l => l.id === id);
  document.getElementById("editModal").classList.remove("hidden");
};

document.getElementById("closeModal").onclick = () =>
  document.getElementById("editModal").classList.add("hidden");

/* =========================
   💾 SAVE UPDATE
========================= */

document.getElementById("saveLead").onclick = async () => {

  const newStatus = document.getElementById("statusInput").value;
  const followTime = document.getElementById("followInput").value;
  const amount = document.getElementById("amountInput").value;
  const remarks = document.getElementById("remarksInput").value;

  if (newStatus === "Follow Up" && !followTime)
    return alert("Follow up time required");

  if (newStatus === "Joined" && !amount)
    return alert("Amount required");

  const updates = {
    status: newStatus,
    remarks: remarks,
    followUpTime: newStatus === "Follow Up"
      ? new Date(followTime)
      : null,
    amount: newStatus === "Joined"
      ? Number(amount)
      : 0,
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

/* =========================
   🧭 FILTER TABS
========================= */

document.querySelectorAll(".tabBtn").forEach(btn => {
  btn.onclick = () => {
    currentFilter = btn.dataset.filter;
    renderTable();
  };
});

/* =========================
   🚪 LOGOUT
========================= */

document.getElementById("logoutBtn").onclick = () => {
  signOut(auth);
};
