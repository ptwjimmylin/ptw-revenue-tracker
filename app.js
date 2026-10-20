// 請替換成你部署 Google Apps Script 後取得的 URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyHGrXEixH7MRGvB7X9nng4Upy2dCnRm6gHdCL2fh57YIfBMP0tUQiEe7dtmeqhJHBVLQ/exec";

let recordData = [];

document.addEventListener("DOMContentLoaded", () => {
  // 設定預設日期為今天
  document.getElementById("date").valueAsDate = new Date();
  fetchRecords();
});

// 從 Google Sheets 抓取最新資料
async function fetchRecords() {
  try {
    const response = await fetch(GAS_API_URL);
    recordData = await response.json();
    renderTable();
    updateDashboard();
  } catch (error) {
    console.error("Error fetching data:", error);
    alert("資料載入失敗，請檢視主機設定或網路連線。");
  }
}

// 渲染表格
function renderTable() {
  const tbody = document.getElementById("records");
  tbody.innerHTML = "";

  if (recordData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;">No records found.</td></tr>';
    return;
  }

  recordData.forEach(row => {
    const tr = document.createElement("tr");
    const total = Number(row.qty || 0) * Number(row.unitPrice || 0);

    tr.innerHTML = `
      <td>${row.date || ''}</td>
      <td>${row.customer || ''}</td>
      <td>${row.prNo || ''}</td>
      <td>${row.poNo || ''}</td>
      <td>${row.invoiceNo || ''}</td>
      <td>${row.category || ''}</td>
      <td>${row.description || ''}</td>
      <td>$${total.toLocaleString()}</td>
      <td><span class="badge ${getPaidBadgeClass(row.paidStatus)}">${row.paidStatus || 'Pending'}</span></td>
      <td>${row.status || 'Open'}</td>
      <td>${row.owner || ''}</td>
      <td><button class="del-btn" onclick="deleteRecord('${row.id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// 計算 KPI 指標
function updateDashboard() {
  let totalRevenue = 0;
  let pendingAR = 0;
  let activeProjects = 0;

  recordData.forEach(row => {
    const total = Number(row.qty || 0) * Number(row.unitPrice || 0);
    
    if (row.paidStatus === "Paid") {
      totalRevenue += total;
    } else if (row.paidStatus === "Pending") {
      pendingAR += total;
    }

    if (row.status === "Open" || row.status === "In Progress") {
      activeProjects++;
    }
  });

  document.getElementById("revenue").innerText = `$${totalRevenue.toLocaleString()}`;
  document.getElementById("pending").innerText = `$${pendingAR.toLocaleString()}`;
  document.getElementById("projects").innerText = activeProjects;
}

// 新增紀錄至 Google Sheets
async function saveRecord() {
  const submitBtn = document.getElementById("submitBtn");
  
  const payload = {
    action: "create",
    date: document.getElementById("date").value,
    customer: document.getElementById("customer").value,
    prNo: document.getElementById("prNo").value,
    poNo: document.getElementById("poNo").value,
    invoiceNo: document.getElementById("invoiceNo").value,
    category: document.getElementById("category").value,
    description: document.getElementById("description").value,
    qty: Number(document.getElementById("qty").value),
    unitPrice: Number(document.getElementById("unitPrice").value),
    paidStatus: document.getElementById("paidStatus").value,
    status: document.getElementById("status").value,
    owner: document.getElementById("owner").value
  };

  if (!payload.customer) {
    alert("Please select a customer.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Saving...";

  try {
    await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    // 清空輸入欄位
    document.getElementById("description").value = "";
    document.getElementById("prNo").value = "";
    document.getElementById("poNo").value = "";
    document.getElementById("invoiceNo").value = "";
    document.getElementById("qty").value = "1";
    document.getElementById("unitPrice").value = "0";

    await fetchRecords(); // 重新整理最新資料
  } catch (error) {
    console.error("Error saving data:", error);
    alert("儲存失敗！");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Save Record";
  }
}

// 刪除紀錄
async function deleteRecord(id) {
  if (!confirm("Are you sure you want to delete this record?")) return;

  try {
    await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "delete", id: id })
    });
    await fetchRecords();
  } catch (error) {
    console.error("Error deleting record:", error);
    alert("刪除失敗！");
  }
}

function getPaidBadgeClass(status) {
  if (status === "Paid") return "badge-paid";
  if (status === "Partial") return "badge-partial";
  return "badge-pending";
}