const STORE_KEY = "eplate.preview.v1";
const PRICE = 150;

const statuses = [
  "Pending Payment",
  "Paid",
  "Missing Geran/VOC",
  "Missing Chassis Number",
  "Ready For Processing",
  "Processing Plate",
  "Plate Arrived",
  "Installation Scheduled",
  "Installation Proof Pending",
  "Completed",
  "Cancelled",
  "Refunded"
];

const staffAccounts = [
  { username: "admin", password: "admin123", role: "Admin" },
  { username: "installer", password: "install123", role: "Installer" }
];

const initialData = {
  customers: [],
  orders: [],
  messages: [],
  sessions: { customerPhone: null, staff: null },
  mockOtp: null,
  orderSeq: 1000,
  invoiceSeq: 5000
};

let state = loadState();

function loadState() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return structuredClone(initialData);
  try {
    return { ...structuredClone(initialData), ...JSON.parse(raw) };
  } catch {
    return structuredClone(initialData);
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function routeTo(hash) {
  location.hash = hash;
}

function nowIso() {
  return new Date().toISOString();
}

function fmtDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" });
}

function money(value) {
  return `RM${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "").replace(/^0/, "+60");
}

function normalizePlate(plate) {
  return String(plate || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function statusClass(status) {
  const s = status.toLowerCase();
  if (s.includes("paid") || s.includes("completed") || s.includes("ready")) return "paid";
  if (s.includes("missing") || s.includes("pending")) return "pending";
  if (s.includes("cancelled") || s.includes("refunded")) return "cancelled";
  if (s.includes("processing") || s.includes("scheduled") || s.includes("arrived")) return "processing";
  return "";
}

function currentCustomer() {
  return state.sessions.customerPhone
    ? state.customers.find((customer) => customer.phone === state.sessions.customerPhone)
    : null;
}

function customerOrders() {
  const customer = currentCustomer();
  if (!customer) return [];
  return state.orders.filter((order) => order.customerPhone === customer.phone);
}

function addMessage(orderId, phone, template, body) {
  state.messages.unshift({
    id: `MSG-${Date.now()}`,
    orderId,
    phone,
    template,
    body,
    status: "Mock sent",
    createdAt: nowIso()
  });
  saveState();
}

function nextOrderId() {
  state.orderSeq += 1;
  return `EP${state.orderSeq}`;
}

function nextInvoiceId() {
  state.invoiceSeq += 1;
  return `INV-${state.invoiceSeq}`;
}

function readFiles(input) {
  const files = Array.from(input.files || []);
  return Promise.all(files.map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      dataUrl: reader.result
    });
    reader.onerror = () => resolve({ name: file.name, type: file.type || "application/octet-stream", size: file.size, dataUrl: "" });
    reader.readAsDataURL(file);
  })));
}

function downloadText(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(filename, dataUrl) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function appShell(content, active = "home") {
  const customer = currentCustomer();
  const staff = state.sessions.staff;
  document.querySelector("#app").innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <div class="mark">JP</div>
          <div>ePlate Order Preview</div>
        </div>
        <nav class="nav">
          <button class="${active === "home" ? "active" : ""}" data-route="#/">Home</button>
          <button class="${active === "order" ? "active" : ""}" data-route="#/order">Order</button>
          <button class="${active === "account" ? "active" : ""}" data-route="#/account">Account</button>
          <button class="${active === "admin" ? "active" : ""}" data-route="#/staff">Staff</button>
          ${customer ? `<button data-action="customer-logout">Logout ${escapeHtml(customer.phone)}</button>` : `<button class="primary" data-route="#/login">Customer Login</button>`}
          ${staff ? `<button data-action="staff-logout">Staff Logout</button>` : ""}
        </nav>
      </header>
      <main class="wrap">${content}</main>
    </div>
  `;
}

function bindShellActions() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => routeTo(button.dataset.route));
  });
  document.querySelector("[data-action='customer-logout']")?.addEventListener("click", () => {
    state.sessions.customerPhone = null;
    saveState();
    routeTo("#/");
  });
  document.querySelector("[data-action='staff-logout']")?.addEventListener("click", () => {
    state.sessions.staff = null;
    saveState();
    routeTo("#/staff");
  });
}

function renderHome() {
  appShell(`
    <section class="hero">
      <div>
        <div class="kicker">Pre-launch working system</div>
        <h1>Order flow, account, dashboard, and installer upload in one preview app.</h1>
        <p class="lead">This version runs without paid hosting, SMS credits, ToyyibPay live keys, or WhatsApp API fees. It is ready for workflow testing while the public SEO site stays online separately.</p>
        <div class="row">
          <button class="btn primary" data-route="#/order">Start customer order</button>
          <button class="btn" data-route="#/staff">Open staff dashboard</button>
        </div>
      </div>
      <div class="panel">
        <div class="plate-preview">
          <div>
            <div class="plate-number">JLM8733</div>
            <div class="plate-caption">Plate-only mockup preview</div>
          </div>
        </div>
        <div class="grid two" style="margin-top:18px">
          <div class="card">
            <div class="kicker">Customer</div>
            <h3>Phone OTP login</h3>
            <p class="muted small">Mock OTP appears on screen during preview. Later this connects to SMS.</p>
          </div>
          <div class="card">
            <div class="kicker">Staff</div>
            <h3>Admin + Installer</h3>
            <p class="muted small">Admin manages orders. Installer can search plate and upload completion photos.</p>
          </div>
        </div>
      </div>
    </section>
  `);
  bindShellActions();
}

function renderLogin(next = "#/order") {
  appShell(`
    <section class="panel" style="max-width:520px;margin:40px auto">
      <div class="kicker">Customer login</div>
      <h2>Login with phone number</h2>
      <p class="lead">No password. The preview uses mock OTP and shows the code after you click send.</p>
      <form class="form" id="otp-form">
        <div class="field">
          <label>Mobile number</label>
          <input name="phone" placeholder="0107607333" required>
        </div>
        <button class="btn dark" type="submit">Send OTP</button>
      </form>
      <div id="otp-area"></div>
    </section>
  `, "account");
  bindShellActions();
  document.querySelector("#otp-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const phone = normalizePhone(new FormData(event.currentTarget).get("phone"));
    const code = String(Math.floor(100000 + Math.random() * 900000));
    state.mockOtp = { phone, code, expiresAt: Date.now() + 5 * 60 * 1000 };
    saveState();
    document.querySelector("#otp-area").innerHTML = `
      <div class="card" style="margin-top:16px">
        <p class="success">Mock OTP sent. Demo code: ${code}</p>
        <form class="form" id="verify-form">
          <div class="field">
            <label>OTP code</label>
            <input name="code" inputmode="numeric" required>
          </div>
          <button class="btn primary" type="submit">Verify and continue</button>
        </form>
      </div>
    `;
    document.querySelector("#verify-form").addEventListener("submit", (verifyEvent) => {
      verifyEvent.preventDefault();
      const submitted = new FormData(verifyEvent.currentTarget).get("code");
      if (!state.mockOtp || state.mockOtp.phone !== phone || state.mockOtp.code !== submitted || Date.now() > state.mockOtp.expiresAt) {
        document.querySelector("#otp-area .success").outerHTML = `<p class="error">Invalid or expired OTP.</p>`;
        return;
      }
      let customer = state.customers.find((item) => item.phone === phone);
      if (!customer) {
        customer = { phone, createdAt: nowIso() };
        state.customers.push(customer);
      }
      state.sessions.customerPhone = phone;
      state.mockOtp = null;
      saveState();
      routeTo(next);
    });
  });
}

function renderOrder() {
  const customer = currentCustomer();
  if (!customer) return renderLogin("#/order");
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const reorderId = params.get("reorder");
  const previous = state.orders.find((order) => order.id === reorderId && order.customerPhone === customer.phone);
  appShell(`
    <section>
      <div class="steps">
        <div class="step-pill active">1 Details</div>
        <div class="step-pill">2 Preview</div>
        <div class="step-pill">3 Mock payment</div>
      </div>
      <div class="grid two">
        <form class="panel form" id="order-form">
          <div>
            <div class="kicker">New order</div>
            <h2>Vehicle and owner details</h2>
            <p class="muted">Mandatory before payment: name, phone number, and vehicle plate. Geran/VOC and chassis can be added later.</p>
          </div>
          <div class="field">
            <label>Vehicle owner name *</label>
            <input name="ownerName" required value="${escapeHtml(previous?.ownerName || "")}">
          </div>
          <div class="field">
            <label>Vehicle owner mobile number *</label>
            <input name="ownerPhone" required value="${escapeHtml(previous?.ownerPhone || customer.phone)}">
          </div>
          <div class="field">
            <label>Vehicle plate number *</label>
            <input name="plate" required value="${escapeHtml(previous?.plate || "")}" placeholder="JLM8733">
          </div>
          <div class="field">
            <label>Vehicle brand</label>
            <input name="brand" value="${escapeHtml(previous?.brand || "")}" placeholder="Toyota">
          </div>
          <div class="field">
            <label>Chassis number</label>
            <input name="chassis" value="${escapeHtml(previous?.chassis || "")}" placeholder="Can be added later">
          </div>
          <div class="field">
            <label>Geran / VOC</label>
            <input name="geran" type="file" accept=".pdf,.jpg,.jpeg,.png,.heic">
            <div class="hint">Optional before payment, mandatory before processing.</div>
          </div>
          <button class="btn primary" type="submit">Review order</button>
        </form>
        <aside class="panel">
          <div class="kicker">Plate preview</div>
          <div class="plate-preview">
            <div>
              <div class="plate-number" id="live-plate">${escapeHtml(previous?.plate || "ABC1234")}</div>
              <div class="plate-caption">Customer confirms this before mock payment</div>
            </div>
          </div>
          <div class="price">${money(PRICE)}</div>
          <p class="muted">Fixed product price for this preview. Admin settings can be added later when the backend exists.</p>
          <div id="review-box"></div>
        </aside>
      </div>
    </section>
  `, "order");
  bindShellActions();
  const form = document.querySelector("#order-form");
  const plateInput = form.elements.plate;
  plateInput.addEventListener("input", () => {
    document.querySelector("#live-plate").textContent = normalizePlate(plateInput.value) || "ABC1234";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const geranFiles = await readFiles(form.elements.geran);
    const draft = {
      ownerName: String(data.ownerName).trim(),
      ownerPhone: normalizePhone(data.ownerPhone),
      plate: normalizePlate(data.plate),
      brand: String(data.brand || "").trim(),
      chassis: String(data.chassis || "").trim(),
      geranFiles
    };
    document.querySelector("#review-box").innerHTML = renderReview(draft);
    document.querySelector("#confirm-order").addEventListener("click", () => createMockPaidOrder(draft));
  });
}

function renderReview(draft) {
  return `
    <div class="card" style="margin-top:18px">
      <h3>Confirm details</h3>
      <div class="kv"><strong>Name</strong><span>${escapeHtml(draft.ownerName)}</span></div>
      <div class="kv"><strong>Phone</strong><span>${escapeHtml(draft.ownerPhone)}</span></div>
      <div class="kv"><strong>Plate</strong><span>${escapeHtml(draft.plate)}</span></div>
      <div class="kv"><strong>Brand</strong><span>${escapeHtml(draft.brand || "-")}</span></div>
      <div class="kv"><strong>Chassis</strong><span>${escapeHtml(draft.chassis || "Add later")}</span></div>
      <div class="kv"><strong>Geran/VOC</strong><span>${draft.geranFiles.length ? draft.geranFiles.map((file) => escapeHtml(file.name)).join(", ") : "Upload later"}</span></div>
      <button class="btn primary full" id="confirm-order" type="button" style="margin-top:12px">Confirm and mock pay ${money(PRICE)}</button>
      <p class="hint">Mock ToyyibPay will mark this payment as successful immediately.</p>
    </div>
  `;
}

function createMockPaidOrder(draft) {
  const id = nextOrderId();
  const invoiceId = nextInvoiceId();
  const missingGeran = !draft.geranFiles.length;
  const missingChassis = !draft.chassis;
  const status = missingGeran ? "Missing Geran/VOC" : missingChassis ? "Missing Chassis Number" : "Ready For Processing";
  const order = {
    id,
    invoiceId,
    customerPhone: state.sessions.customerPhone,
    ownerName: draft.ownerName,
    ownerPhone: draft.ownerPhone,
    plate: draft.plate,
    brand: draft.brand,
    chassis: draft.chassis,
    geranFiles: draft.geranFiles,
    installationFiles: [],
    amount: PRICE,
    paymentStatus: "Paid",
    status,
    installationAt: "",
    createdAt: nowIso(),
    paidAt: nowIso(),
    completedAt: ""
  };
  state.orders.unshift(order);
  addMessage(id, order.ownerPhone, "order_payment_confirmed", `Payment received for ${order.plate}. Invoice ${invoiceId} is ready.`);
  saveState();
  routeTo(`#/order-success?id=${id}`);
}

function renderOrderSuccess() {
  const id = new URLSearchParams(location.hash.split("?")[1] || "").get("id");
  const order = state.orders.find((item) => item.id === id);
  appShell(`
    <section class="panel" style="max-width:720px;margin:36px auto">
      <div class="kicker">Mock payment success</div>
      <h2>Order ${escapeHtml(order?.id || "")} is paid</h2>
      <p class="lead">A mock WhatsApp confirmation and invoice were generated. In production this will happen after ToyyibPay verifies the payment callback.</p>
      ${order ? renderOrderSummary(order) : `<p class="error">Order not found.</p>`}
      <div class="row" style="margin-top:18px">
        <button class="btn primary" data-route="#/account">View account</button>
        <button class="btn" data-invoice="${escapeHtml(order?.id || "")}">Download invoice</button>
      </div>
    </section>
  `, "account");
  bindShellActions();
  bindInvoiceButtons();
}

function renderAccount() {
  const customer = currentCustomer();
  if (!customer) return renderLogin("#/account");
  const orders = customerOrders();
  appShell(`
    <section>
      <div class="row" style="justify-content:space-between;margin-bottom:18px">
        <div>
          <div class="kicker">Customer account</div>
          <h2>Your orders</h2>
          <p class="muted">View previous orders, download invoices, upload pending Geran/VOC, and reorder missing or damaged plates.</p>
        </div>
        <button class="btn primary" data-route="#/order">New order</button>
      </div>
      <div class="list">
        ${orders.length ? orders.map(renderCustomerOrderCard).join("") : `<div class="empty">No orders yet.</div>`}
      </div>
    </section>
  `, "account");
  bindShellActions();
  bindOrderActions();
  bindInvoiceButtons();
}

function renderCustomerOrderCard(order) {
  return `
    <article class="order-card">
      <div class="order-head">
        <div>
          <strong>${escapeHtml(order.id)}</strong>
          <div class="muted small">${escapeHtml(order.plate)} · ${escapeHtml(order.ownerName)}</div>
        </div>
        <span class="status ${statusClass(order.status)}">${escapeHtml(order.status)}</span>
      </div>
      ${renderOrderSummary(order)}
      <div class="row">
        <button class="btn" data-invoice="${escapeHtml(order.id)}">Download invoice</button>
        <button class="btn" data-route="#/order?reorder=${escapeHtml(order.id)}">Reorder plate</button>
        ${!order.geranFiles.length ? `<label class="btn">Upload Geran/VOC<input type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" data-upload-geran="${escapeHtml(order.id)}" hidden></label>` : ""}
        ${!order.chassis ? `<button class="btn" data-add-chassis="${escapeHtml(order.id)}">Add chassis</button>` : ""}
      </div>
    </article>
  `;
}

function renderOrderSummary(order) {
  return `
    <div class="grid two">
      <div>
        <div class="kv"><strong>Invoice</strong><span>${escapeHtml(order.invoiceId)}</span></div>
        <div class="kv"><strong>Amount</strong><span>${money(order.amount)}</span></div>
        <div class="kv"><strong>Paid</strong><span>${fmtDate(order.paidAt)}</span></div>
        <div class="kv"><strong>Installation</strong><span>${order.installationAt ? fmtDate(order.installationAt) : "-"}</span></div>
      </div>
      <div>
        <div class="kv"><strong>Geran/VOC</strong><span>${order.geranFiles.length ? order.geranFiles.map((file) => escapeHtml(file.name)).join(", ") : "Pending"}</span></div>
        <div class="kv"><strong>Chassis</strong><span>${escapeHtml(order.chassis || "Pending")}</span></div>
        <div class="kv"><strong>Install photos</strong><span>${order.installationFiles.length}/4 uploaded</span></div>
        <div class="kv"><strong>Created</strong><span>${fmtDate(order.createdAt)}</span></div>
      </div>
    </div>
  `;
}

function bindOrderActions() {
  document.querySelectorAll("[data-upload-geran]").forEach((input) => {
    input.addEventListener("change", async () => {
      const order = state.orders.find((item) => item.id === input.dataset.uploadGeran);
      if (!order) return;
      order.geranFiles = await readFiles(input);
      if (order.geranFiles.length && order.chassis && order.status.includes("Missing")) order.status = "Ready For Processing";
      saveState();
      renderAccount();
    });
  });
  document.querySelectorAll("[data-add-chassis]").forEach((button) => {
    button.addEventListener("click", () => {
      const chassis = prompt("Enter chassis number");
      if (!chassis) return;
      const order = state.orders.find((item) => item.id === button.dataset.addChassis);
      if (!order) return;
      order.chassis = chassis.trim().toUpperCase();
      if (order.geranFiles.length && order.status.includes("Missing")) order.status = "Ready For Processing";
      saveState();
      renderAccount();
    });
  });
}

function invoiceText(order) {
  return [
    "ePlate.my Preview Invoice",
    `Invoice: ${order.invoiceId}`,
    `Order: ${order.id}`,
    `Date paid: ${fmtDate(order.paidAt)}`,
    "",
    `Customer: ${order.ownerName}`,
    `Phone: ${order.ownerPhone}`,
    `Vehicle plate: ${order.plate}`,
    `Vehicle brand: ${order.brand || "-"}`,
    "",
    `JPJePlate package: ${money(order.amount)}`,
    "Payment method: Mock ToyyibPay",
    "",
    "This is a pre-launch preview invoice generated locally."
  ].join("\n");
}

function bindInvoiceButtons() {
  document.querySelectorAll("[data-invoice]").forEach((button) => {
    button.addEventListener("click", () => {
      const order = state.orders.find((item) => item.id === button.dataset.invoice);
      if (order) downloadText(`${order.invoiceId}.txt`, invoiceText(order));
    });
  });
}

function renderStaffLogin() {
  appShell(`
    <section class="panel" style="max-width:520px;margin:40px auto">
      <div class="kicker">Staff login</div>
      <h2>Admin and installer access</h2>
      <p class="lead">Preview accounts are listed in the README. Production will use hashed passwords and server sessions.</p>
      <form class="form" id="staff-login">
        <div class="field">
          <label>Username</label>
          <input name="username" required>
        </div>
        <div class="field">
          <label>Password</label>
          <input name="password" type="password" required>
        </div>
        <button class="btn primary" type="submit">Login</button>
      </form>
      <p class="hint">Admin: admin / admin123. Installer: installer / install123.</p>
      <div id="staff-error"></div>
    </section>
  `, "admin");
  bindShellActions();
  document.querySelector("#staff-login").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const account = staffAccounts.find((item) => item.username === data.username && item.password === data.password);
    if (!account) {
      document.querySelector("#staff-error").innerHTML = `<p class="error">Invalid staff login.</p>`;
      return;
    }
    state.sessions.staff = { username: account.username, role: account.role };
    saveState();
    routeTo(account.role === "Installer" ? "#/installer" : "#/admin");
  });
}

function renderStaffEntry() {
  const staff = state.sessions.staff;
  if (!staff) return renderStaffLogin();
  return staff.role === "Installer" ? routeTo("#/installer") : routeTo("#/admin");
}

function renderAdmin() {
  const staff = state.sessions.staff;
  if (!staff) return renderStaffLogin();
  if (staff.role !== "Admin") return routeTo("#/installer");
  const sortedOrders = [...state.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  appShell(`
    <section class="split">
      <aside class="side">
        <div class="card">
          <div class="kicker">Admin</div>
          <h3>${escapeHtml(staff.username)}</h3>
          <p class="muted small">Can manage all orders, statuses, exports, invoices, documents, and WhatsApp logs.</p>
        </div>
        <div class="card form">
          <div class="field">
            <label>Export from Order ID</label>
            <input id="export-from" placeholder="EP1001">
          </div>
          <div class="field">
            <label>Export to Order ID</label>
            <input id="export-to" placeholder="EP1010">
          </div>
        </div>
        <button class="btn dark" id="export-csv">Export Excel CSV</button>
        <button class="btn" id="seed-order">Add sample order</button>
        <button class="btn danger" id="reset-demo">Reset demo data</button>
      </aside>
      <div class="grid">
        <div>
          <div class="kicker">Orders</div>
          <h2>Customer orders</h2>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th><th>Customer</th><th>Plate</th><th>Payment</th><th>Status</th><th>Missing</th><th>Install</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${sortedOrders.length ? sortedOrders.map(renderAdminRow).join("") : `<tr><td colspan="8">No orders yet.</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="grid two">
          <div class="panel">
            <h3>Mock WhatsApp log</h3>
            <div class="message-log">
              ${state.messages.length ? state.messages.map((message) => `
                <div class="log-item">
                  <strong>${escapeHtml(message.template)}</strong>
                  <div>${escapeHtml(message.body)}</div>
                  <div class="muted">${escapeHtml(message.phone)} · ${fmtDate(message.createdAt)}</div>
                </div>
              `).join("") : `<div class="empty">No messages yet.</div>`}
            </div>
          </div>
          <div class="panel">
            <h3>Provider mode</h3>
            <p class="muted">OTP, payment, WhatsApp, invoice delivery, and file storage are mocked. This lets you test the business workflow now without monthly fees.</p>
          </div>
        </div>
      </div>
    </section>
  `, "admin");
  bindShellActions();
  bindAdminActions();
}

function renderAdminRow(order) {
  const missing = [
    !order.geranFiles.length ? "Geran/VOC" : "",
    !order.chassis ? "Chassis" : "",
    order.status === "Installation Proof Pending" && order.installationFiles.length < 4 ? "Install photos" : ""
  ].filter(Boolean).join(", ") || "-";
  return `
    <tr>
      <td><strong>${escapeHtml(order.id)}</strong><br><span class="muted">${escapeHtml(order.invoiceId)}</span></td>
      <td>${escapeHtml(order.ownerName)}<br><span class="muted">${escapeHtml(order.ownerPhone)}</span></td>
      <td><strong>${escapeHtml(order.plate)}</strong><br><span class="muted">${escapeHtml(order.brand || "-")}</span></td>
      <td><span class="status paid">${escapeHtml(order.paymentStatus)}</span><br>${money(order.amount)}</td>
      <td>
        <select data-status="${escapeHtml(order.id)}">
          ${statuses.map((status) => `<option ${status === order.status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}
        </select>
      </td>
      <td>${escapeHtml(missing)}</td>
      <td><input type="datetime-local" data-install-date="${escapeHtml(order.id)}" value="${order.installationAt ? order.installationAt.slice(0,16) : ""}"></td>
      <td>
        <div class="row">
          <button class="btn" data-invoice="${escapeHtml(order.id)}">Invoice</button>
          <button class="btn" data-view-docs="${escapeHtml(order.id)}">Docs</button>
        </div>
      </td>
    </tr>
  `;
}

function bindAdminActions() {
  bindInvoiceButtons();
  document.querySelectorAll("[data-status]").forEach((select) => {
    select.addEventListener("change", () => {
      const order = state.orders.find((item) => item.id === select.dataset.status);
      if (!order) return;
      order.status = select.value;
      if (select.value === "Completed" && !order.completedAt) {
        order.completedAt = nowIso();
        addMessage(order.id, order.ownerPhone, "installation_completed", `Installation completed for ${order.plate}. Ask us about car insurance renewal support.`);
      }
      saveState();
      renderAdmin();
    });
  });
  document.querySelectorAll("[data-install-date]").forEach((input) => {
    input.addEventListener("change", () => {
      const order = state.orders.find((item) => item.id === input.dataset.installDate);
      if (!order) return;
      order.installationAt = input.value ? new Date(input.value).toISOString() : "";
      if (order.installationAt) {
        order.status = "Installation Scheduled";
        addMessage(order.id, order.ownerPhone, "installation_scheduled", `Installation for ${order.plate} is scheduled on ${fmtDate(order.installationAt)}.`);
      }
      saveState();
      renderAdmin();
    });
  });
  document.querySelectorAll("[data-view-docs]").forEach((button) => {
    button.addEventListener("click", () => {
      const order = state.orders.find((item) => item.id === button.dataset.viewDocs);
      if (!order) return;
      const docs = [...order.geranFiles, ...order.installationFiles];
      if (!docs.length) return alert("No documents uploaded yet.");
      docs.forEach((file) => file.dataUrl && downloadDataUrl(file.name, file.dataUrl));
    });
  });
  document.querySelector("#export-csv")?.addEventListener("click", () => {
    const from = Number(String(document.querySelector("#export-from")?.value || "").replace(/\D/g, "")) || 0;
    const to = Number(String(document.querySelector("#export-to")?.value || "").replace(/\D/g, "")) || Number.MAX_SAFE_INTEGER;
    const exportOrders = state.orders.filter((order) => {
      const orderNo = Number(order.id.replace(/\D/g, ""));
      return orderNo >= from && orderNo <= to;
    });
    const headers = ["Order ID", "Invoice", "Name", "Phone", "Plate", "Brand", "Payment", "Amount", "Status", "Geran", "Chassis", "Install Date", "Created"];
    const rows = exportOrders.map((order) => [
      order.id,
      order.invoiceId,
      order.ownerName,
      order.ownerPhone,
      order.plate,
      order.brand || "",
      order.paymentStatus,
      order.amount,
      order.status,
      order.geranFiles.length ? "Uploaded" : "Pending",
      order.chassis || "Pending",
      order.installationAt || "",
      order.createdAt
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    downloadText("eplate-orders.csv", csv, "text/csv");
  });
  document.querySelector("#seed-order")?.addEventListener("click", () => {
    const phone = "+60107607333";
    if (!state.customers.find((customer) => customer.phone === phone)) state.customers.push({ phone, createdAt: nowIso() });
    const order = {
      id: nextOrderId(),
      invoiceId: nextInvoiceId(),
      customerPhone: phone,
      ownerName: "Demo Customer",
      ownerPhone: phone,
      plate: "JLM8733",
      brand: "Toyota",
      chassis: "",
      geranFiles: [],
      installationFiles: [],
      amount: PRICE,
      paymentStatus: "Paid",
      status: "Missing Geran/VOC",
      installationAt: "",
      createdAt: nowIso(),
      paidAt: nowIso(),
      completedAt: ""
    };
    state.orders.unshift(order);
    addMessage(order.id, phone, "order_payment_confirmed", `Payment received for ${order.plate}. Invoice ${order.invoiceId} is ready.`);
    saveState();
    renderAdmin();
  });
  document.querySelector("#reset-demo")?.addEventListener("click", () => {
    if (!confirm("Reset all preview data in this browser?")) return;
    state = structuredClone(initialData);
    saveState();
    renderAdmin();
  });
}

function renderInstaller() {
  const staff = state.sessions.staff;
  if (!staff) return renderStaffLogin();
  appShell(`
    <section class="panel" style="max-width:760px;margin:28px auto">
      <div class="kicker">Installer mobile flow</div>
      <h2>Search by vehicle plate</h2>
      <p class="lead">Installer accounts can only find an existing order by plate and upload installation proof photos.</p>
      <form class="form" id="installer-search">
        <div class="field">
          <label>Vehicle plate</label>
          <input name="plate" required placeholder="JLM8733">
        </div>
        <button class="btn primary" type="submit">Find order</button>
      </form>
      <div id="installer-result"></div>
    </section>
  `, "admin");
  bindShellActions();
  document.querySelector("#installer-search").addEventListener("submit", (event) => {
    event.preventDefault();
    const plate = normalizePlate(new FormData(event.currentTarget).get("plate"));
    const order = state.orders.find((item) => item.plate === plate);
    document.querySelector("#installer-result").innerHTML = order ? renderInstallerUpload(order) : `<div class="empty" style="margin-top:16px">No order found for ${escapeHtml(plate)}.</div>`;
    bindInstallerUpload(order);
  });
}

function renderInstallerUpload(order) {
  return `
    <div class="card" style="margin-top:18px">
      <div class="order-head">
        <div>
          <h3>${escapeHtml(order.plate)}</h3>
          <p class="muted">${escapeHtml(order.ownerName)} · ${escapeHtml(order.ownerPhone)}</p>
        </div>
        <span class="status ${statusClass(order.status)}">${escapeHtml(order.status)}</span>
      </div>
      <form class="form" id="install-upload">
        <div class="grid two">
          <div class="field"><label>Front vehicle pic</label><input name="front" type="file" accept="image/*" capture="environment" required></div>
          <div class="field"><label>Rear vehicle pic</label><input name="rear" type="file" accept="image/*" capture="environment" required></div>
          <div class="field"><label>QR sticker</label><input name="qr" type="file" accept="image/*" capture="environment" required></div>
          <div class="field"><label>Chassis number</label><input name="chassisPhoto" type="file" accept="image/*" capture="environment" required></div>
        </div>
        <button class="btn primary" type="submit">Submit installation proof</button>
      </form>
    </div>
  `;
}

function bindInstallerUpload(order) {
  const form = document.querySelector("#install-upload");
  if (!form || !order) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = [];
    for (const input of form.querySelectorAll("input[type='file']")) {
      const read = await readFiles(input);
      if (read[0]) files.push({ ...read[0], name: `${input.name}-${read[0].name}` });
    }
    order.installationFiles = files;
    order.status = "Completed";
    order.completedAt = nowIso();
    addMessage(order.id, order.ownerPhone, "installation_completed", `Installation completed for ${order.plate}. We can also help with car insurance renewal.`);
    saveState();
    document.querySelector("#installer-result").innerHTML = `<div class="card" style="margin-top:18px"><p class="success">Installation proof uploaded. Mock completion WhatsApp sent.</p></div>`;
  });
}

function renderNotFound() {
  appShell(`<div class="empty">Page not found.</div>`);
  bindShellActions();
}

function render() {
  const hash = location.hash || "#/";
  if (hash.startsWith("#/login")) return renderLogin();
  if (hash.startsWith("#/order-success")) return renderOrderSuccess();
  if (hash.startsWith("#/order")) return renderOrder();
  if (hash.startsWith("#/account")) return renderAccount();
  if (hash.startsWith("#/staff")) return renderStaffEntry();
  if (hash.startsWith("#/admin")) return renderAdmin();
  if (hash.startsWith("#/installer")) return renderInstaller();
  if (hash === "#/" || hash === "") return renderHome();
  return renderNotFound();
}

window.addEventListener("hashchange", render);
render();
