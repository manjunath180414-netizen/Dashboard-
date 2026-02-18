import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7xfwR2gBijRnVaasu_DZKuY8gLifimH0",
  authDomain: "dashboard-bd51c.firebaseapp.com",
  projectId: "dashboard-bd51c",
  storageBucket: "dashboard-bd51c.firebasestorage.app",
  messagingSenderId: "689809644516",
  appId: "1:689809644516:web:75d6051b300983afb545f1"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

