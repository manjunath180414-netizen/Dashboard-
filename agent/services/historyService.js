import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { db } from "./firebase-init.js";

export async function logHistory(leadId, logData) {
  const historyRef = collection(db, "leads", leadId, "history");

  await addDoc(historyRef, {
    ...logData,
    timestamp: serverTimestamp()
  });
}

