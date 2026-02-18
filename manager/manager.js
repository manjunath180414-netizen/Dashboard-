import { listenLeads, nextPage } from "./services/leadService.js";
import { loadAgents, getAgentName } from "./services/userService.js";

const leadTableBody = document.getElementById("leadTableBody");

async function init() {

  await loadAgents();

  listenLeads(renderLeads);
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

init();
