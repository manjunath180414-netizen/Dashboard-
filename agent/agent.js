import { auth, db } from "./services/firebase-init.js";

import {
  GoogleAuthProvider,
  signInWithPopup,
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
let selectedLead;

const provider = new GoogleAuthProvider();

/* ================= GOOGLE LOGIN ================= */
window.googleLogin = async function () {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert(error.message);
  }
};

/* ================= AUTH CHECK ================= */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    loginSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
    return;
  }

  currentUser = user;

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists() || snap.data().role !== "agent") {
    alert("Access denied. Not an agent.");
    await signOut(auth);
    return;
  }

  agentName.innerText = snap.data().name;

  loginSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");

  listenLeads(user.uid);
});

/* ================= LISTEN LEADS ================= */
function listenLeads(uid) {

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

    updateKPI();
    render();
  });
}

/* ================= KPI ================= */
function updateKPI() {
  kpiTotal.innerText = allLeads.length;
  kpiCallBack.innerText =
    allLeads.filter(l => l.status === "Call Back").length;
  kpiFollow.innerText =
    allLeads.filter(l => l.status === "Follow Up").length;

  const revenue = allLeads
    .filter(l => l.status === "Joined")
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  kpiRevenue.innerText = "₹" + revenue;
}

/* ================= TABLE ================= */
function render() {

  leadsTable.innerHTML = "";

  allLeads.forEach(lead => {

    const follow = lead.followUpTime
      ? new Date(lead.followUpTime.seconds * 1000).toLocaleString()
      : "-";

    leadsTable.innerHTML += `
      <tr class="border-b border-gray-800">
        <td class="p-4">${lead.studentName}</td>
        <td class="p-4">${lead.phone}</td>
        <td class="p-4">${lead.status}</td>
        <td class="p-4">${follow}</td>
        <td class="p-4">₹${lead.amount || 0}</td>
        <td class="p-4">
          <button onclick="openModal('${lead.id}')"
          class="bg-purple-600 px-3 py-1 rounded-xl">Edit</button>
        </td>
      </tr>
    `;
  });
}

/* ================= MODAL ================= */
window.openModal = function(id) {
  selectedLead = allLeads.find(l => l.id === id);
  editModal.classList.remove("hidden");
};

closeModal.onclick = () =>
  editModal.classList.add("hidden");

/* ================= SAVE ================= */
saveLead.onclick = async () => {

  const newStatus = statusInput.value;
  const followTime = followInput.value;
  const amount = amountInput.value;
  const remarks = remarksInput.value;

  if ((newStatus === "Call Back" || newStatus === "Follow Up") && !followTime)
    return alert("Follow-up time required");

  if (newStatus === "Joined" && !amount)
    return alert("Amount required");

  await updateDoc(doc(db, "leads", selectedLead.id), {
    status: newStatus,
    followUpTime:
      (newStatus === "Call Back" || newStatus === "Follow Up")
      ? new Date(followTime)
      : null,
    amount: newStatus === "Joined" ? Number(amount) : 0,
    remarks: remarks,
    updatedAt: serverTimestamp()
  });

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

  editModal.classList.add("hidden");
};

/* ================= LOGOUT ================= */
logoutBtn.onclick = () => signOut(auth);
