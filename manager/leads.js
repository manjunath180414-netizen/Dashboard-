import { db } from "./services/firebase-init.js";
import { loadAgents, getAllAgents } from "./services/userService.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const agentChips = document.getElementById("agentChips");
const statusCards = document.getElementById("statusCards");
const summaryCard = document.getElementById("summaryCard");
const leadsTableBody = document.getElementById("leadsTableBody");
const leadsTableContainer = document.getElementById("leadsTableContainer");

let currentAgentUID = null;
let agentLeads = [];

init();

async function init() {
  await loadAgents();
  renderAgents();
}

function renderAgents() {
  const agents = getAllAgents();

  for (let uid in agents) {
    const chip = document.createElement("button");
    chip.className =
      "px-4 py-2 bg-[#111827] rounded-full shadow hover:bg-cyan-500 transition";
    chip.textContent = agents[uid];

    chip.onclick = () => loadAgentLeads(uid);

    agentChips.appendChild(chip);
  }
}

function loadAgentLeads(uid) {
  currentAgentUID = uid;

  const q = query(
    collection(db, "leads"),
    where("assignedTo", "==", uid),
    where("deleted", "==", false)
  );

  onSnapshot(q, (snapshot) => {
    agentLeads = [];
    snapshot.forEach(doc => {
      agentLeads.push({ id: doc.id, ...doc.data() });
    });

    renderCards();
    renderSummary();
  });
}

function renderCards() {
  statusCards.innerHTML = "";
  statusCards.classList.remove("hidden");

  const stats = {
    "Called": agentLeads.filter(l => l.status !== "New").length,
    "Not Called": agentLeads.filter(l => l.status === "New").length,
    "Follow Up": agentLeads.filter(l => l.status === "Follow Up").length,
    "Not Interested": agentLeads.filter(l => l.status === "Not Interested").length,
    "Wrong / Invalid": agentLeads.filter(l => l.status === "Invalid / Wrong Number").length,
    "Switch Off": agentLeads.filter(l => l.status === "Not Received / Switch Off").length
  };

  for (let key in stats) {
    const card = document.createElement("div");
    card.className =
      "bg-[#111827] p-6 rounded-2xl shadow-lg cursor-pointer hover:scale-105 transition";

    card.innerHTML = `
      <h2 class="text-lg font-semibold">${key}</h2>
      <p class="text-3xl mt-2">${stats[key]}</p>
    `;

    card.onclick = () => renderFilteredLeads(key);

    statusCards.appendChild(card);
  }
}

function renderSummary() {
  summaryCard.classList.remove("hidden");

  const total = agentLeads.length;
  const joined = agentLeads.filter(l => l.status === "Joined");
  const revenue = joined.reduce((sum, l) => sum + (l.amount || 0), 0);

  summaryCard.innerHTML = `
    <h2 class="text-xl font-bold mb-4">Summary</h2>
    <p>Total Leads: ${total}</p>
    <p>Joined: ${joined.length}</p>
    <p>Revenue: ₹${revenue}</p>
    <p>Conversion: ${total ? ((joined.length / total) * 100).toFixed(1) : 0}%</p>
  `;
}

function renderFilteredLeads(type) {
  leadsTableContainer.classList.remove("hidden");
  leadsTableBody.innerHTML = "";

  let filtered = [];

  if (type === "Called")
    filtered = agentLeads.filter(l => l.status !== "New");
  else if (type === "Not Called")
    filtered = agentLeads.filter(l => l.status === "New");
  else
    filtered = agentLeads.filter(l => l.status.includes(type.split(" ")[0]));

  filtered.forEach(lead => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="p-3">${lead.studentName}</td>
      <td class="p-3">${lead.phone}</td>
      <td class="p-3">${lead.status}</td>
      <td class="p-3">₹${lead.amount || 0}</td>
    `;

    leadsTableBody.appendChild(row);
  });
}
