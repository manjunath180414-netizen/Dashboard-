import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { db } from "./firebase-init.js";

export function listenAgentLeads(uid, callback) {
  const q = query(
    collection(db, "leads"),
    where("assignedTo", "==", uid)
  );

  return onSnapshot(q, (snapshot) => {
    const leads = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // SAFELY ignore deleted leads
      if (data.deleted === true) return;

      leads.push({ id: docSnap.id, ...data });
    });

    callback(leads);
  });
}

export async function updateLead(leadId, updates) {
  const leadRef = doc(db, "leads", leadId);
  await updateDoc(leadRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}
