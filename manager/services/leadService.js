
import { db } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  startAfter
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let lastVisible = null;
const pageSize = 25;

export function listenLeads(renderCallback) {

  const q = query(
    collection(db, "leads"),
    where("deleted", "==", false),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  return onSnapshot(q, (snapshot) => {

    const leads = [];
    snapshot.forEach(doc => {
      leads.push({ id: doc.id, ...doc.data() });
    });

    lastVisible = snapshot.docs[snapshot.docs.length - 1];

    renderCallback(leads);
  });
}

export function nextPage(renderCallback) {

  if (!lastVisible) return;

  const q = query(
    collection(db, "leads"),
    where("deleted", "==", false),
    orderBy("createdAt", "desc"),
    startAfter(lastVisible),
    limit(pageSize)
  );

  return onSnapshot(q, (snapshot) => {

    const leads = [];
    snapshot.forEach(doc => {
      leads.push({ id: doc.id, ...doc.data() });
    });

    lastVisible = snapshot.docs[snapshot.docs.length - 1];

    renderCallback(leads);
  });
}
