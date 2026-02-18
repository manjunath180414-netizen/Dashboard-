// Sidebar Toggle
const sidebar = document.getElementById("sidebar");
const collapseBtn = document.getElementById("collapseBtn");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const overlay = document.getElementById("overlay");

let collapsed = false;

collapseBtn.addEventListener("click", () => {
  collapsed = !collapsed;

  if (collapsed) {
    sidebar.classList.remove("w-64");
    sidebar.classList.add("w-20");
    document.querySelectorAll(".sidebar-text").forEach(el => el.style.display = "none");
  } else {
    sidebar.classList.remove("w-20");
    sidebar.classList.add("w-64");
    document.querySelectorAll(".sidebar-text").forEach(el => el.style.display = "inline");
  }
});

mobileMenuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("hidden");
  overlay.classList.toggle("hidden");
});

overlay.addEventListener("click", () => {
  sidebar.classList.add("hidden");
  overlay.classList.add("hidden");
});


// KPI Dummy Data (Structured for Firestore later)
const dashboardData = {
  totalLeads: 1284,
  newToday: 32,
  joined: 210,
  revenue: 580000
};

// Render KPIs
document.getElementById("totalLeads").innerText = dashboardData.totalLeads;
document.getElementById("newToday").innerText = dashboardData.newToday;
document.getElementById("joinedCount").innerText = dashboardData.joined;
document.getElementById("revenueCount").innerText =
  "₹" + dashboardData.revenue.toLocaleString();
