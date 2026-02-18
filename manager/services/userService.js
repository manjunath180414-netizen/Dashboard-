
import { db } from "./firebase-init.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let agentMap = {};

export async function loadAgents() {
  const q = query(
    collection(db, "users"),
    where("role", "==", "agent")
  );

  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    agentMap[doc.id] = doc.data().name;
  });

  return agentMap;
}

export function getAgentName(uid) {
  return agentMap[uid] || "Unassigned";
}
