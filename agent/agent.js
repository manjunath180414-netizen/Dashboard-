
// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB7xfwR2gBijRnVaasu_DZKuY8gLifimH0",
  authDomain: "dashboard-bd51c.firebaseapp.com",
  projectId: "dashboard-bd51c",
  storageBucket: "dashboard-bd51c.firebasestorage.app",
  messagingSenderId: "689809644516",
  appId: "1:689809644516:web:75d6051b300983afb545f1"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let agentUID = null;

// Auth Check
auth.onAuthStateChanged(user=>{
    if(!user){
        window.location.href="index.html";
        return;
    }
    agentUID = user.uid;
    loadTodayLeads();
});

// Get today's start & end
function getTodayRange(){
    const start = new Date();
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    return {
        start: start.getTime(),
        end: end.getTime()
    };
}

// Load Today Leads
function loadTodayLeads(){

    const range = getTodayRange();

    db.collection("leads")
    .where("assignedTo","==",agentUID)
    .where("createdAt",">=",range.start)
    .where("createdAt","<=",range.end)
    .onSnapshot(snapshot=>{

        const table = document.getElementById("leadTable");
        table.innerHTML="";

        snapshot.forEach(doc=>{
            const data = doc.data();

            table.innerHTML += `
                <tr id="row-${doc.id}" class="${getRowClass(data)}">
                    <td>${data.studentName}</td>
                    <td onclick="copyNumber('${data.phone}')" style="cursor:pointer;color:#38bdf8;">
                        ${data.phone}
                    </td>
                    <td>
                        <select onchange="changeStatus('${doc.id}', this.value)">
                            ${generateStatusOptions(data.status)}
                        </select>
                    </td>
                    <td>
                        <input value="${data.remarks || ''}"
                        onchange="saveRemark('${doc.id}',this.value)">
                    </td>
                </tr>
            `;
        });

    });
}

function generateStatusOptions(current){

    const statuses = [
        "New",
        "Interested",
        "Follow Up",
        "Not Interested",
        "Switch Off",
        "Wrong/Invalid",
        "Joined"
    ];

    return statuses.map(status => 
        `<option value="${status}" ${status===current ? "selected" : ""}>${status}</option>`
    ).join("");
}

function getRowClass(data){

    if(data.status==="Wrong/Invalid") return "status-wrong";
    if(data.status==="Not Interested") return "status-not";
    if(data.status==="Joined") return "status-joined";
    if(data.status==="Follow Up" || data.status==="Interested") return "status-followup";

    return "";
}

function copyNumber(number){
    navigator.clipboard.writeText(number);
}

// Save Remark
function saveRemark(id,value){

    db.collection("leads").doc(id).update({
        remarks:value,
        updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Change Status
function changeStatus(id,newStatus){

    if(newStatus==="Interested" || newStatus==="Follow Up"){
        const date = prompt("Enter Followup Date (YYYY-MM-DD)");
        const time = prompt("Enter Followup Time (HH:MM)");

        if(!date || !time){
            alert("Followup date & time required");
            loadTodayLeads();
            return;
        }

        const followUpTime = new Date(date+" "+time).getTime();

        db.collection("leads").doc(id).update({
            status:"Follow Up",
            followUpTime:followUpTime,
            updatedAt:firebase.firestore.FieldValue.serverTimestamp()
        });

        return;
    }

    if(newStatus==="Switch Off"){
        const followUpTime = Date.now() + (12*60*60*1000);

        db.collection("leads").doc(id).update({
            status:"Switch Off",
            followUpTime:followUpTime,
            updatedAt:firebase.firestore.FieldValue.serverTimestamp()
        });

        return;
    }

    db.collection("leads").doc(id).update({
        status:newStatus,
        updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    });
}

function logout(){
    auth.signOut();
}
