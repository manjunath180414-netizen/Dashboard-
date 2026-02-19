import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { db } from "./firebase-init.js";

export function listenAgentLeads(uid, callback) {
  const q = query(collection(db, "leads"));

  return onSnapshot(q, (snapshot) => {
    const leads = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      console.log("Lead assignedTo:", data.assignedTo);
      console.log("Current UID:", uid);

      if (data.assignedTo === uid && data.deleted !== true) {
        leads.push({ id: docSnap.id, ...data });
      }
    });

    callback(leads);
  });
}

  return onSnapshot(q, (snapshot) => {
    const leads = [];
    snapshot.forEach((doc) => {
      leads.push({ id: doc.id, ...doc.data() });
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

