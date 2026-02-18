import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { db } from "./firebase-init.js";

const leadsRef = collection(db, "leads");

/*
  BULLETPROOF AGENT QUERY
  - Checks assignedTo = UID OR email
  - Filters deleted client-side
  - No orderBy (avoids index error)
*/

export function subscribeAgentLeads(user, callback) {

  const q = query(
    leadsRef,
    where("assignedTo", "in", [user.uid, user.email]),
    limit(25)
  );

  return onSnapshot(q, (snapshot) => {

    const leads = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(l => l.deleted !== true); // safe boolean check

    callback(leads);
  });
}

export async function updateLead(leadId, data) {
  const leadDoc = doc(db, "leads", leadId);
  data.updatedAt = serverTimestamp();
  await updateDoc(leadDoc, data);
}
