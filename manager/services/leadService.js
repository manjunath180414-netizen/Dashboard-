import { db } from "./firebase-init.js";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const pageSize = 25;

export function listenLeads(renderCallback) {

  const q = query(
    collection(db, "leads"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  return onSnapshot(q, (snapshot) => {

    const leads = [];

    let total = 0;
    let newCount = 0;
    let joinedCount = 0;
    let revenue = 0;

    snapshot.forEach(doc => {

      const data = doc.data();
      leads.push({ id: doc.id, ...data });

      total++;

      if (data.status === "New") {
        newCount++;
      }

      if (data.status === "Joined") {
        joinedCount++;
        revenue += Number(data.amount || 0);
      }
    });

    renderCallback(leads, {
      total,
      newCount,
      joinedCount,
      revenue
    });
  });
}
