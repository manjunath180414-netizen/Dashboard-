import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { db } from "./firebase-init.js";

const leadsRef = collection(db, "leads");

export function subscribeAgentLeads(uid, lastDoc, callback) {
  let q = query(
    leadsRef,
    where("assignedTo", "==", uid),
    where("deleted", "==", false),
    orderBy("createdAt", "desc"),
    limit(25)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  return onSnapshot(q, callback);
}

export async function updateLead(leadId, data) {
  const leadDoc = doc(db, "leads", leadId);
  data.updatedAt = serverTimestamp();
  await updateDoc(leadDoc, data);
}

