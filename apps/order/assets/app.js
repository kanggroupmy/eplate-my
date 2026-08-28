const PRICE = 150;
const ADMIN_HOST = location.hostname.startsWith("admin.");
const STAFF_KEY = "eplate.staff.preview";
let lastOtp = null;

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

function qs(selector) {
  return document.querySelector(selector);
}

function html(value = "") {
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

function money(centsOrRinggit) {
  const value = Number(centsOrRinggit || 0);
  return `RM${(value > 1000 ? value / 100 : value).toFixed(2)}`;
}

function fmtDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" });
}

function statusClass(status = "") {
  const value = status.toLowerCase();
  if (value.includes("completed") || value.includes("ready") || value.includes("paid")) return "paid";
  if (value.includes("missing") || value.includes("pending")) return "pending";
  if (value.includes("cancelled") || value.includes("refunded")) return "cancelled";
  if (value.includes("processing") || value.includes("scheduled") || value.includes("arrived")) return "processing";
  return "";
}

async function api(path, options = {}) {
  const headers = {};
  let body;
  if (options.form) {
    body = options.form;
  } else if (options.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  const response = await fetch(path, {
    method: options.method || (body ? "POST" : "GET"),
    headers,
    body,
    credentials: "include"
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) throw new Error(payload?.error || payload || "Request failed");
  return payload;
}

function routeTo(hash) {
  location.hash = hash;
}

function setApp(content, active = "") {
  const staff = getStaff();
  const nav = ADMIN_HOST ? `
    <button class="${active === "staff" ? "active" : ""}" data-route="#/staff">Staff Login</button>
    <button class="${active === "admin" ? "active" : ""}" data-route="#/admin">Admin</button>
    <button class="${active === "installer" ? "active" : ""}" data-route="#/installer">Installer</button>
    ${staff ? `<button data-action="logout">Logout ${html(staff.username)}</button>` : ""}
  ` : `
    <button class="${active === "order" ? "active" : ""}" data-route="#/order">Order</button>
    <button class="${active === "account" ? "active" : ""}" data-route="#/account">Account</button>
    <button class="primary" data-route="#/login">Customer Login</button>
  `;
  qs("#app").innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <div class="mark">JP</div>
          <div>${ADMIN_HOST ? "ePlate Staff" : "ePlate Order"}</div>
        </div>
        <nav class="nav">${nav}</nav>
      </header>
      <main class="wrap">${content}</main>
    </div>
  `;
  document.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => routeTo(button.dataset.route)));
  qs("[data-action='logout']")?.addEventListener("click", async () => {
    await api("/api/auth/logout", { method: "POST", body: {} }).catch(() => {});
    sessionStorage.removeItem(STAFF_KEY);
    routeTo(ADMIN_HOST ? "#/staff" : "#/");
  });
}

function getStaff() {
  try {
    return JSON.parse(sessionStorage.getItem(STAFF_KEY) || "null");
  } catch {
    return null;
  }
}

function showError(target, error) {
  qs(target).innerHTML = `<p class="error">${html(error.message || error)}</p>`;
}

function renderCustomerLogin(next = "#/account") {
  setApp(`
    <section class="panel" style="max-width:520px;margin:40px auto">
      <div class="kicker">Customer login</div>
      <h2>Login with phone OTP</h2>
      <p class="lead">No password. In preview mode, the OTP is shown after sending.</p>
      <form class="form" id="otp-form">
        <div class="field">
          <label>Mobile number</label>
          <input name="phone" placeholder="0107607333" required>
        </div>
        <button class="btn dark" type="submit">Send OTP</button>
      </form>
      <div id="login-result"></div>
    </section>
  `, "account");
  qs("#otp-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const phone = normalizePhone(new FormData(event.currentTarget).get("phone"));
    try {
      const result = await api("/api/auth/otp/request", { body: { phone } });
      lastOtp = { phone, code: result.mockOtp };
      qs("#login-result").innerHTML = `
        <div class="card" style="margin-top:16px">
          ${result.mockOtp ? `<p class="success">Mock OTP sent. Demo code: ${html(result.mockOtp)}</p>` : `<p class="success">OTP sent.</p>`}
          <form class="form" id="verify-form">
            <div class="field">
              <label>OTP code</label>
              <input name="code" inputmode="numeric" required>
            </div>
            <button class="btn primary" type="submit">Verify and continue</button>
          </form>
          <div id="verify-result"></div>
        </div>
      `;
      qs("#verify-form").addEventListener("submit", async (verifyEvent) => {
        verifyEvent.preventDefault();
        const code = String(new FormData(verifyEvent.currentTarget).get("code") || "").trim();
        try {
          await api("/api/auth/otp/verify", { body: { phone: lastOtp.phone, code } });
          routeTo(next);
        } catch (error) {
          showError("#verify-result", error);
        }
      });
    } catch (error) {
      showError("#login-result", error);
    }
  });
}

async function requireCustomer(nextHash) {
  try {
    return await api("/api/customer/me");
  } catch {
    renderCustomerLogin(nextHash);
    return null;
  }
}

async function renderOrder() {
  const me = await requireCustomer("#/order");
  if (!me) return;
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const previous = (me.orders || []).find((order) => order.id === params.get("reorder"));
  setApp(`
    <section>
      <div class="steps">
        <div class="step-pill active">1 Details</div>
        <div class="step-pill">2 Preview</div>
        <div class="step-pill">3 Payment</div>
      </div>
      <div class="grid two">
        <form class="panel form" id="order-form">
          <div>
            <div class="kicker">New order</div>
            <h2>Vehicle and owner details</h2>
            <p class="muted">Required before payment: owner name, mobile number, and vehicle plate.</p>
          </div>
          <div class="field"><label>Vehicle owner name *</label><input name="ownerName" required value="${html(previous?.owner_name || "")}"></div>
          <div class="field"><label>Vehicle owner mobile number *</label><input name="ownerPhone" required value="${html(previous?.owner_phone || me.customer.phone)}"></div>
          <div class="field"><label>Vehicle plate number *</label><input name="plate" required placeholder="JLM8733" value="${html(previous?.plate || "")}"></div>
          <div class="field"><label>Vehicle brand</label><input name="brand" placeholder="Toyota" value="${html(previous?.brand || "")}"></div>
          <div class="field"><label>Chassis number</label><input name="chassis" placeholder="Can be added later" value="${html(previous?.chassis || "")}"></div>
          <div class="field">
            <label>Geran / VOC</label>
            <input name="geran" type="file" accept=".pdf,.jpg,.jpeg,.png,.heic">
            <div class="hint">Optional before payment, mandatory before processing.</div>
          </div>
          <button class="btn primary" type="submit">Review order</button>
          <div id="order-error"></div>
        </form>
        <aside class="panel">
          <div class="kicker">Plate preview</div>
          <div class="plate-preview">
            <div>
              <div class="plate-number" id="live-plate">${html(previous?.plate || "ABC1234")}</div>
              <div class="plate-caption">Confirm this before payment</div>
            </div>
          </div>
          <div class="price">${money(PRICE)}</div>
          <div id="review-box"></div>
        </aside>
      </div>
    </section>
  `, "order");
  const form = qs("#order-form");
  form.elements.plate.addEventListener("input", () => {
    qs("#live-plate").textContent = normalizePlate(form.elements.plate.value) || "ABC1234";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const draft = {
      ownerName: String(data.ownerName).trim(),
      ownerPhone: normalizePhone(data.ownerPhone),
      plate: normalizePlate(data.plate),
      brand: String(data.brand || "").trim(),
      chassis: String(data.chassis || "").trim(),
      geran: form.elements.geran.files[0] || null
    };
    qs("#review-box").innerHTML = renderReview(draft);
    qs("#confirm-order").addEventListener("click", () => submitOrder(draft));
  });
}

function renderReview(draft) {
  return `
    <div class="card" style="margin-top:18px">
      <h3>Confirm details</h3>
      <div class="kv"><strong>Name</strong><span>${html(draft.ownerName)}</span></div>
      <div class="kv"><strong>Phone</strong><span>${html(draft.ownerPhone)}</span></div>
      <div class="kv"><strong>Plate</strong><span>${html(draft.plate)}</span></div>
      <div class="kv"><strong>Brand</strong><span>${html(draft.brand || "-")}</span></div>
      <div class="kv"><strong>Chassis</strong><span>${html(draft.chassis || "Add later")}</span></div>
      <div class="kv"><strong>Geran/VOC</strong><span>${html(draft.geran?.name || "Upload later")}</span></div>
      <button class="btn primary full" id="confirm-order" type="button" style="margin-top:12px">Confirm and mock pay ${money(PRICE)}</button>
      <p class="hint">Payment is still mocked until ToyyibPay keys are connected.</p>
      <div id="pay-result"></div>
    </div>
  `;
}

async function submitOrder(draft) {
  try {
    const created = await api("/api/orders", { body: draft });
    if (draft.geran) {
      const form = new FormData();
      form.append("kind", "geran");
      form.append("file", draft.geran);
      await api(`/api/orders/${created.order.id}/files`, { form });
    }
    await api(`/api/orders/${created.order.id}/mock-pay`, { method: "POST", body: {} });
    routeTo(`#/order-success?id=${created.order.id}`);
  } catch (error) {
    showError("#pay-result", error);
  }
}

async function renderOrderSuccess() {
  const id = new URLSearchParams(location.hash.split("?")[1] || "").get("id");
  const me = await requireCustomer("#/account");
  if (!me) return;
  const order = (me.orders || []).find((item) => item.id === id);
  setApp(`
    <section class="panel" style="max-width:720px;margin:36px auto">
      <div class="kicker">Payment success</div>
      <h2>Order ${html(order?.id || "")} is paid</h2>
      <p class="lead">A mock WhatsApp confirmation and PDF invoice were generated.</p>
      ${order ? renderOrderSummary(order) : `<p class="error">Order not found.</p>`}
      <div class="row" style="margin-top:18px">
        <button class="btn primary" data-route="#/account">View account</button>
        ${order ? `<a class="btn" href="/api/invoices/${html(order.invoice_id)}.pdf">Download invoice PDF</a>` : ""}
      </div>
    </section>
  `, "account");
}

async function renderAccount() {
  const me = await requireCustomer("#/account");
  if (!me) return;
  const orders = me.orders || [];
  setApp(`
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
  bindCustomerOrderActions();
}

function renderCustomerOrderCard(order) {
  const files = order.files || [];
  const hasGeran = files.some((file) => file.kind === "geran");
  return `
    <article class="order-card">
      <div class="order-head">
        <div>
          <strong>${html(order.id)}</strong>
          <div class="muted small">${html(order.plate)} · ${html(order.owner_name)}</div>
        </div>
        <span class="status ${statusClass(order.status)}">${html(order.status)}</span>
      </div>
      ${renderOrderSummary(order)}
      <div class="row">
        <a class="btn" href="/api/invoices/${html(order.invoice_id)}.pdf">Download invoice PDF</a>
        <button class="btn" data-route="#/order?reorder=${html(order.id)}">Reorder plate</button>
        ${!hasGeran ? `<label class="btn">Upload Geran/VOC<input type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" data-upload-geran="${html(order.id)}" hidden></label>` : ""}
        ${!order.chassis ? `<button class="btn" data-add-chassis="${html(order.id)}">Add chassis</button>` : ""}
      </div>
    </article>
  `;
}

function renderOrderSummary(order) {
  const files = order.files || [];
  const hasGeran = files.some((file) => file.kind === "geran");
  return `
    <div class="grid two">
      <div>
        <div class="kv"><strong>Invoice</strong><span>${html(order.invoice_id)}</span></div>
        <div class="kv"><strong>Amount</strong><span>${money(order.amount_cents)}</span></div>
        <div class="kv"><strong>Paid</strong><span>${fmtDate(order.paid_at)}</span></div>
        <div class="kv"><strong>Installation</strong><span>${fmtDate(order.installation_at)}</span></div>
      </div>
      <div>
        <div class="kv"><strong>Geran/VOC</strong><span>${hasGeran ? "Uploaded" : "Pending"}</span></div>
        <div class="kv"><strong>Chassis</strong><span>${html(order.chassis || "Pending")}</span></div>
        <div class="kv"><strong>Install photos</strong><span>${files.filter((file) => file.kind !== "geran").length}/4 uploaded</span></div>
        <div class="kv"><strong>Created</strong><span>${fmtDate(order.created_at)}</span></div>
      </div>
    </div>
  `;
}

function bindCustomerOrderActions() {
  document.querySelectorAll("[data-upload-geran]").forEach((input) => {
    input.addEventListener("change", async () => {
      const form = new FormData();
      form.append("kind", "geran");
      form.append("file", input.files[0]);
      await api(`/api/orders/${input.dataset.uploadGeran}/files`, { form });
      renderAccount();
    });
  });
  document.querySelectorAll("[data-add-chassis]").forEach((button) => {
    button.addEventListener("click", async () => {
      const chassis = prompt("Enter chassis number");
      if (!chassis) return;
      await api(`/api/orders/${button.dataset.addChassis}`, { method: "PATCH", body: { chassis } });
      renderAccount();
    });
  });
}

function renderStaffLogin() {
  setApp(`
    <section class="panel" style="max-width:520px;margin:40px auto">
      <div class="kicker">Staff login</div>
      <h2>Admin and installer access</h2>
      <form class="form" id="staff-login">
        <div class="field"><label>Username</label><input name="username" required></div>
        <div class="field"><label>Password</label><input name="password" type="password" required></div>
        <button class="btn primary" type="submit">Login</button>
      </form>
      <div id="staff-result"></div>
    </section>
  `, "staff");
  qs("#staff-login").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const result = await api("/api/admin/login", { body: data });
      sessionStorage.setItem(STAFF_KEY, JSON.stringify(result.staff));
      routeTo(result.staff.role === "Installer" ? "#/installer" : "#/admin");
    } catch (error) {
      showError("#staff-result", error);
    }
  });
}

async function renderAdmin() {
  if (!ADMIN_HOST) return routeTo("#/");
  try {
    const data = await api("/api/admin/orders");
    const orders = data.orders || [];
    setApp(`
      <section class="split">
        <aside class="side">
          <div class="card">
            <div class="kicker">Admin</div>
            <h3>Order management</h3>
            <p class="muted small">Manage statuses, installation dates, invoices, documents, and exports.</p>
          </div>
          <div class="card form">
            <div class="field"><label>Export from Order ID</label><input id="export-from" placeholder="EP1234"></div>
            <div class="field"><label>Export to Order ID</label><input id="export-to" placeholder="EP1299"></div>
            <button class="btn dark" id="export-csv">Export Excel CSV</button>
          </div>
        </aside>
        <div class="grid">
          <div>
            <div class="kicker">Orders</div>
            <h2>Customer orders</h2>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Plate</th><th>Payment</th><th>Status</th><th>Files</th><th>Install</th><th>Actions</th></tr></thead>
              <tbody>${orders.length ? orders.map(renderAdminRow).join("") : `<tr><td colspan="8">No orders yet.</td></tr>`}</tbody>
            </table>
          </div>
          <div id="admin-result"></div>
        </div>
      </section>
    `, "admin");
    bindAdminActions();
  } catch (error) {
    renderStaffLogin();
    qs("#staff-result").innerHTML = `<p class="error">${html(error.message)}. Login again.</p>`;
  }
}

function renderAdminRow(order) {
  const files = order.files || [];
  return `
    <tr>
      <td><strong>${html(order.id)}</strong><br><span class="muted">${html(order.invoice_id)}</span></td>
      <td>${html(order.owner_name)}<br><span class="muted">${html(order.owner_phone)}</span></td>
      <td><strong>${html(order.plate)}</strong><br><span class="muted">${html(order.brand || "-")}</span></td>
      <td><span class="status ${order.payment_status === "Paid" ? "paid" : "pending"}">${html(order.payment_status)}</span><br>${money(order.amount_cents)}</td>
      <td><select data-status="${html(order.id)}">${statuses.map((status) => `<option ${status === order.status ? "selected" : ""}>${html(status)}</option>`).join("")}</select></td>
      <td>${files.length ? files.map((file) => `<a class="file-chip" href="/api/admin/files/${html(file.id)}">${html(file.kind)}</a>`).join(" ") : "-"}</td>
      <td><input type="datetime-local" data-install-date="${html(order.id)}" value="${order.installation_at ? order.installation_at.slice(0, 16) : ""}"></td>
      <td><a class="btn" href="/api/invoices/${html(order.invoice_id)}.pdf">Invoice</a></td>
    </tr>
  `;
}

function bindAdminActions() {
  document.querySelectorAll("[data-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      await api(`/api/admin/orders/${select.dataset.status}`, { method: "PATCH", body: { status: select.value } });
      renderAdmin();
    });
  });
  document.querySelectorAll("[data-install-date]").forEach((input) => {
    input.addEventListener("change", async () => {
      const installationAt = input.value ? new Date(input.value).toISOString() : "";
      await api(`/api/admin/orders/${input.dataset.installDate}`, { method: "PATCH", body: { installationAt } });
      renderAdmin();
    });
  });
  qs("#export-csv")?.addEventListener("click", () => {
    const from = encodeURIComponent(qs("#export-from").value || "");
    const to = encodeURIComponent(qs("#export-to").value || "");
    location.href = `/api/admin/orders.csv?from=${from}&to=${to}`;
  });
}

function renderInstaller() {
  if (!ADMIN_HOST) return routeTo("#/");
  setApp(`
    <section class="panel" style="max-width:760px;margin:28px auto">
      <div class="kicker">Installer mobile flow</div>
      <h2>Search by vehicle plate</h2>
      <p class="lead">Installer accounts can find an existing order by plate and upload installation proof photos.</p>
      <form class="form" id="installer-search">
        <div class="field"><label>Vehicle plate</label><input name="plate" required placeholder="JLM8733"></div>
        <button class="btn primary" type="submit">Find order</button>
      </form>
      <div id="installer-result"></div>
    </section>
  `, "installer");
  qs("#installer-search").addEventListener("submit", async (event) => {
    event.preventDefault();
    const plate = normalizePlate(new FormData(event.currentTarget).get("plate"));
    try {
      const result = await api(`/api/installer/orders/plate/${plate}`);
      qs("#installer-result").innerHTML = renderInstallerUpload(result.order);
      bindInstallerUpload(result.order);
    } catch (error) {
      showError("#installer-result", error);
    }
  });
}

function renderInstallerUpload(order) {
  return `
    <div class="card" style="margin-top:18px">
      <div class="order-head">
        <div><h3>${html(order.plate)}</h3><p class="muted">${html(order.owner_name)} · ${html(order.owner_phone)}</p></div>
        <span class="status ${statusClass(order.status)}">${html(order.status)}</span>
      </div>
      <form class="form" id="install-upload">
        <div class="grid two">
          <div class="field"><label>Front vehicle pic</label><input name="front_vehicle" type="file" accept="image/*" capture="environment" required></div>
          <div class="field"><label>Rear vehicle pic</label><input name="rear_vehicle" type="file" accept="image/*" capture="environment" required></div>
          <div class="field"><label>QR sticker</label><input name="qr_sticker" type="file" accept="image/*" capture="environment" required></div>
          <div class="field"><label>Chassis number</label><input name="chassis_photo" type="file" accept="image/*" capture="environment" required></div>
        </div>
        <button class="btn primary" type="submit">Submit installation proof</button>
      </form>
      <div id="install-result"></div>
    </div>
  `;
}

function bindInstallerUpload(order) {
  qs("#install-upload").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(`/api/installer/orders/${order.id}/installation-files`, { form });
      qs("#install-result").innerHTML = `<p class="success">Installation proof uploaded. Completion WhatsApp logged.</p>`;
    } catch (error) {
      showError("#install-result", error);
    }
  });
}

function renderNotFound() {
  setApp(`<div class="empty">Page not found.</div>`);
}

async function render() {
  const hash = location.hash || "#/";
  if (ADMIN_HOST) {
    if (hash.startsWith("#/admin")) return renderAdmin();
    if (hash.startsWith("#/installer")) return renderInstaller();
    return renderStaffLogin();
  }
  if (hash.startsWith("#/login")) return renderCustomerLogin();
  if (hash.startsWith("#/order-success")) return renderOrderSuccess();
  if (hash.startsWith("#/order")) return renderOrder();
  if (hash.startsWith("#/account")) return renderAccount();
  if (hash === "#/" || hash === "") return renderOrder();
  return renderNotFound();
}

window.addEventListener("hashchange", render);
render();
