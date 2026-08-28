const STATUS = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  MISSING_GERAN: "Missing Geran/VOC",
  MISSING_CHASSIS: "Missing Chassis Number",
  READY: "Ready For Processing",
  PROCESSING: "Processing Plate",
  PLATE_ARRIVED: "Plate Arrived",
  INSTALLATION_SCHEDULED: "Installation Scheduled",
  INSTALLATION_PROOF_PENDING: "Installation Proof Pending",
  COMPLETED: "Completed"
};

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env, url);
      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ error: "Internal server error", detail: error.message }, 500);
    }
  }
};

async function handleApi(request, env, url) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  if (url.pathname === "/api/health") return json({ ok: true, env: env.APP_ENV || "unknown" });

  if (url.pathname === "/api/auth/logout" && request.method === "POST") return logout(request, env);
  if (url.pathname === "/api/auth/otp/request" && request.method === "POST") return requestOtp(request, env);
  if (url.pathname === "/api/auth/otp/verify" && request.method === "POST") return verifyOtp(request, env);
  if (url.pathname === "/api/customer/me" && request.method === "GET") return customerMe(request, env);
  if (url.pathname === "/api/orders" && request.method === "POST") return createOrder(request, env);
  if (url.pathname === "/api/orders" && request.method === "GET") return listCustomerOrders(request, env);

  const customerOrder = url.pathname.match(/^\/api\/orders\/([^/]+)$/);
  if (customerOrder && request.method === "PATCH") return updateCustomerOrder(request, env, customerOrder[1]);

  const orderFile = url.pathname.match(/^\/api\/orders\/([^/]+)\/files$/);
  if (orderFile && request.method === "POST") return uploadCustomerFile(request, env, orderFile[1]);

  const mockPay = url.pathname.match(/^\/api\/orders\/([^/]+)\/mock-pay$/);
  if (mockPay && request.method === "POST") return markOrderPaid(env, mockPay[1], { provider: "mock", raw: "{}" });

  const invoice = url.pathname.match(/^\/api\/invoices\/([^/]+)\.pdf$/);
  if (invoice && request.method === "GET") return invoicePdf(request, env, invoice[1]);

  if (url.pathname === "/api/admin/login" && request.method === "POST") return staffLogin(request, env);
  if (url.pathname === "/api/admin/orders" && request.method === "GET") return listAdminOrders(request, env, url);
  if (url.pathname === "/api/admin/orders.csv" && request.method === "GET") return exportOrdersCsv(request, env, url);

  const adminOrder = url.pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
  if (adminOrder && request.method === "PATCH") return updateAdminOrder(request, env, adminOrder[1]);

  const fileDownload = url.pathname.match(/^\/api\/admin\/files\/([^/]+)$/);
  if (fileDownload && request.method === "GET") return downloadFile(request, env, fileDownload[1]);

  const installerSearch = url.pathname.match(/^\/api\/installer\/orders\/plate\/([^/]+)$/);
  if (installerSearch && request.method === "GET") return installerFindOrder(request, env, installerSearch[1]);

  const installerUpload = url.pathname.match(/^\/api\/installer\/orders\/([^/]+)\/installation-files$/);
  if (installerUpload && request.method === "POST") return uploadInstallationFiles(request, env, installerUpload[1]);

  if (url.pathname === "/api/webhooks/whatsapp" && request.method === "GET") return verifyWhatsappWebhook(request, env, url);
  if (url.pathname === "/api/webhooks/whatsapp" && request.method === "POST") return receiveWhatsappWebhook(request, env);
  if (url.pathname === "/api/webhooks/toyyibpay" && request.method === "POST") return receiveToyyibpayWebhook(request, env);

  if (url.pathname === "/api/setup/staff" && request.method === "POST") return setupStaff(request, env);

  return json({ error: "Not found" }, 404);
}

async function requestOtp(request, env) {
  const { phone } = await request.json();
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return json({ error: "Phone number is required" }, 400);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const id = newId("otp");
  const createdAt = now();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO otp_codes (id, phone, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(id, normalizedPhone, await sha256(code), expiresAt, createdAt)
    .run();
  if (env.MOCK_PROVIDERS !== "true") await sendSms(env, normalizedPhone, `Your ePlate OTP is ${code}. It expires in 5 minutes.`);
  return json({ ok: true, mockOtp: env.MOCK_PROVIDERS === "true" ? code : undefined });
}

async function verifyOtp(request, env) {
  const { phone, code } = await request.json();
  const normalizedPhone = normalizePhone(phone);
  const codeHash = await sha256(String(code || "").trim());
  const otp = await env.DB.prepare(
    "SELECT * FROM otp_codes WHERE phone = ? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1"
  ).bind(normalizedPhone).first();
  if (!otp || otp.code_hash !== codeHash || Date.parse(otp.expires_at) < Date.now()) {
    return json({ error: "Invalid or expired OTP" }, 401);
  }
  await env.DB.prepare("UPDATE otp_codes SET consumed_at = ? WHERE id = ?").bind(now(), otp.id).run();
  let customer = await env.DB.prepare("SELECT * FROM customers WHERE phone = ?").bind(normalizedPhone).first();
  if (!customer) {
    customer = { id: newId("cus"), phone: normalizedPhone, created_at: now() };
    await env.DB.prepare("INSERT INTO customers (id, phone, created_at) VALUES (?, ?, ?)")
      .bind(customer.id, customer.phone, customer.created_at)
      .run();
  }
  return createSessionResponse(env, customer.id, "customer", { customer });
}

async function logout(request, env) {
  const token = readCookie(request, env.SESSION_COOKIE_NAME || "eplate_session");
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  const domain = env.COOKIE_DOMAIN ? ` Domain=${env.COOKIE_DOMAIN};` : "";
  return json({ ok: true }, 200, {
    "set-cookie": `${env.SESSION_COOKIE_NAME || "eplate_session"}=; Path=/;${domain} HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  });
}

async function customerMe(request, env) {
  const auth = await requireAuth(request, env, "customer");
  if (auth.response) return auth.response;
  const orders = await ordersForCustomer(env, auth.subject.id);
  return json({ customer: auth.subject, orders });
}

async function createOrder(request, env) {
  const auth = await requireAuth(request, env, "customer");
  if (auth.response) return auth.response;
  const body = await request.json();
  const ownerName = String(body.ownerName || "").trim();
  const ownerPhone = normalizePhone(body.ownerPhone);
  const plate = normalizePlate(body.plate);
  if (!ownerName || !ownerPhone || !plate) return json({ error: "Owner name, phone, and plate are required" }, 400);
  const id = nextOrderId();
  const invoiceId = nextInvoiceId();
  const createdAt = now();
  await env.DB.prepare(`
    INSERT INTO orders (
      id, invoice_id, customer_id, owner_name, owner_phone, plate, brand, chassis,
      amount_cents, payment_status, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    invoiceId,
    auth.subject.id,
    ownerName,
    ownerPhone,
    plate,
    String(body.brand || "").trim() || null,
    String(body.chassis || "").trim() || null,
    Number(env.PRODUCT_PRICE_CENTS || 15000),
    "Pending",
    STATUS.PENDING_PAYMENT,
    createdAt,
    createdAt
  ).run();
  const order = await orderById(env, id);
  return json({ order, payment: await createPaymentIntent(env, order) }, 201);
}

async function listCustomerOrders(request, env) {
  const auth = await requireAuth(request, env, "customer");
  if (auth.response) return auth.response;
  return json({ orders: await ordersForCustomer(env, auth.subject.id) });
}

async function updateCustomerOrder(request, env, orderId) {
  const auth = await requireAuth(request, env, "customer");
  if (auth.response) return auth.response;
  const order = await orderById(env, orderId);
  if (!order || order.customer_id !== auth.subject.id) return json({ error: "Order not found" }, 404);
  const body = await request.json();
  const chassis = String(body.chassis || "").trim().toUpperCase();
  if (!chassis) return json({ error: "Chassis number is required" }, 400);
  await env.DB.prepare("UPDATE orders SET chassis = ?, updated_at = ? WHERE id = ?")
    .bind(chassis, now(), order.id)
    .run();
  await refreshOrderCompletionState(env, order.id);
  return json({ order: await orderById(env, order.id) });
}

async function uploadCustomerFile(request, env, orderId) {
  const auth = await requireAuth(request, env, "customer");
  if (auth.response) return auth.response;
  const order = await orderById(env, orderId);
  if (!order || order.customer_id !== auth.subject.id) return json({ error: "Order not found" }, 404);
  const form = await request.formData();
  const kind = String(form.get("kind") || "geran");
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "File is required" }, 400);
  const record = await persistFile(env, order.id, kind, file, "customer", auth.subject.id);
  await refreshOrderCompletionState(env, order.id);
  return json({ file: record });
}

async function staffLogin(request, env) {
  const { username, password } = await request.json();
  const staff = await env.DB.prepare("SELECT * FROM staff_users WHERE username = ?").bind(username).first();
  if (!staff || !(await verifyPassword(password, staff.password_hash))) return json({ error: "Invalid login" }, 401);
  return createSessionResponse(env, staff.id, "staff", { staff: publicStaff(staff) });
}

async function listAdminOrders(request, env, url) {
  const auth = await requireAuth(request, env, "staff", "Admin");
  if (auth.response) return auth.response;
  const status = url.searchParams.get("status");
  const rows = status
    ? await env.DB.prepare("SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 500").bind(status).all()
    : await env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 500").all();
  return json({ orders: await attachFiles(env, rows.results || []) });
}

async function updateAdminOrder(request, env, orderId) {
  const auth = await requireAuth(request, env, "staff", "Admin");
  if (auth.response) return auth.response;
  const body = await request.json();
  const order = await orderById(env, orderId);
  if (!order) return json({ error: "Order not found" }, 404);
  const status = body.status || order.status;
  const installationAt = body.installationAt ?? order.installation_at;
  await env.DB.prepare("UPDATE orders SET status = ?, installation_at = ?, updated_at = ? WHERE id = ?")
    .bind(status, installationAt || null, now(), orderId)
    .run();
  if (installationAt && installationAt !== order.installation_at) {
    await sendWhatsapp(env, order.id, order.owner_phone, "installation_scheduled", `Installation for ${order.plate} is scheduled on ${installationAt}.`);
  }
  await audit(env, auth, "order.update", "order", orderId, body);
  return json({ order: await orderById(env, orderId) });
}

async function exportOrdersCsv(request, env, url) {
  const auth = await requireAuth(request, env, "staff", "Admin");
  if (auth.response) return auth.response;
  const from = Number(String(url.searchParams.get("from") || "").replace(/\D/g, "")) || 0;
  const to = Number(String(url.searchParams.get("to") || "").replace(/\D/g, "")) || Number.MAX_SAFE_INTEGER;
  const rows = await env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 2000").all();
  const filtered = (rows.results || []).filter((order) => {
    const orderNo = Number(order.id.replace(/\D/g, ""));
    return orderNo >= from && orderNo <= to;
  });
  const headers = ["Order ID", "Invoice", "Name", "Phone", "Plate", "Brand", "Payment", "Amount", "Status", "Geran", "Chassis", "Install Date", "Created"];
  const files = await filesByOrderIds(env, filtered.map((order) => order.id));
  const csvRows = filtered.map((order) => [
    order.id,
    order.invoice_id,
    order.owner_name,
    order.owner_phone,
    order.plate,
    order.brand || "",
    order.payment_status,
    (order.amount_cents / 100).toFixed(2),
    order.status,
    files[order.id]?.some((file) => file.kind === "geran") ? "Uploaded" : "Pending",
    order.chassis || "Pending",
    order.installation_at || "",
    order.created_at
  ]);
  const csv = [headers, ...csvRows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, { headers: { ...corsHeaders(), "content-type": "text/csv", "content-disposition": "attachment; filename=eplate-orders.csv" } });
}

async function downloadFile(request, env, fileId) {
  const auth = await requireAuth(request, env, "staff", "Admin");
  if (auth.response) return auth.response;
  const file = await env.DB.prepare("SELECT * FROM files WHERE id = ?").bind(fileId).first();
  if (!file) return json({ error: "File not found" }, 404);
  if (file.r2_key.startsWith("mock://")) {
    return json({ error: "This preview file was recorded without R2 storage enabled." }, 409);
  }
  const object = await env.UPLOADS.get(file.r2_key);
  if (!object) return json({ error: "Stored file not found" }, 404);
  await audit(env, auth, "file.download", "file", file.id, { orderId: file.order_id });
  return new Response(object.body, {
    headers: {
      "content-type": file.content_type,
      "content-disposition": `attachment; filename="${file.filename.replaceAll('"', "")}"`
    }
  });
}

async function installerFindOrder(request, env, plate) {
  const auth = await requireAuth(request, env, "staff");
  if (auth.response) return auth.response;
  const order = await env.DB.prepare("SELECT * FROM orders WHERE plate = ? ORDER BY created_at DESC LIMIT 1").bind(normalizePlate(plate)).first();
  if (!order) return json({ error: "Order not found" }, 404);
  return json({ order: await attachFiles(env, [order]).then((orders) => orders[0]) });
}

async function uploadInstallationFiles(request, env, orderId) {
  const auth = await requireAuth(request, env, "staff");
  if (auth.response) return auth.response;
  const order = await orderById(env, orderId);
  if (!order) return json({ error: "Order not found" }, 404);
  const form = await request.formData();
  const required = ["front_vehicle", "rear_vehicle", "qr_sticker", "chassis_photo"];
  const saved = [];
  for (const kind of required) {
    const file = form.get(kind);
    if (!(file instanceof File)) return json({ error: `${kind} is required` }, 400);
    saved.push(await persistFile(env, order.id, kind, file, "staff", auth.subject.id));
  }
  await env.DB.prepare("UPDATE orders SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?")
    .bind(STATUS.COMPLETED, now(), now(), order.id)
    .run();
  await sendWhatsapp(env, order.id, order.owner_phone, "installation_completed", `Installation completed for ${order.plate}. We can also help with car insurance renewal.`);
  await audit(env, auth, "installation.upload", "order", order.id, { files: saved.map((file) => file.id) });
  return json({ order: await orderById(env, order.id), files: saved });
}

async function verifyWhatsappWebhook(request, env, url) {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) return new Response(challenge || "", { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

async function receiveWhatsappWebhook(request, env) {
  const payload = await request.json();
  await env.DB.prepare(`
    INSERT INTO audit_logs (id, actor_type, actor_id, action, target_type, target_id, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(newId("audit"), "webhook", "whatsapp", "webhook.whatsapp", "provider", "meta", JSON.stringify(payload), now()).run();
  return json({ ok: true });
}

async function receiveToyyibpayWebhook(request, env) {
  const payload = await request.json().catch(() => ({}));
  const orderId = payload.order_id || payload.billExternalReferenceNo;
  if (!orderId) return json({ error: "Missing order reference" }, 400);
  return markOrderPaid(env, orderId, { provider: "toyyibpay", raw: JSON.stringify(payload), providerRef: payload.billCode || payload.refno || null });
}

async function setupStaff(request, env) {
  if (!env.SETUP_TOKEN) return json({ error: "SETUP_TOKEN is not configured" }, 403);
  const token = request.headers.get("x-setup-token");
  if (token !== env.SETUP_TOKEN) return json({ error: "Forbidden" }, 403);
  const { username, password, role = "Admin", displayName = username } = await request.json();
  if (!username || !password || !["Admin", "Installer"].includes(role)) return json({ error: "Invalid staff data" }, 400);
  const id = newId("staff");
  await env.DB.prepare(`
    INSERT INTO staff_users (id, username, password_hash, role, display_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash, role = excluded.role, display_name = excluded.display_name
  `).bind(id, username, await hashPassword(password), role, displayName, now()).run();
  return json({ ok: true, username, role });
}

async function createPaymentIntent(env, order) {
  if (env.MOCK_PROVIDERS === "true") return { provider: "mock", action: `/api/orders/${order.id}/mock-pay` };
  return {
    provider: "toyyibpay",
    action: "create_bill",
    note: "Wire TOYYIBPAY_SECRET_KEY and TOYYIBPAY_CATEGORY_CODE as Cloudflare secrets."
  };
}

async function markOrderPaid(env, orderId, payment) {
  const order = await orderById(env, orderId);
  if (!order) return json({ error: "Order not found" }, 404);
  const files = await filesByOrderIds(env, [order.id]);
  const hasGeran = files[order.id]?.some((file) => file.kind === "geran");
  const nextStatus = !hasGeran ? STATUS.MISSING_GERAN : !order.chassis ? STATUS.MISSING_CHASSIS : STATUS.READY;
  await env.DB.prepare("UPDATE orders SET payment_status = ?, status = ?, paid_at = ?, updated_at = ? WHERE id = ?")
    .bind("Paid", nextStatus, now(), now(), order.id)
    .run();
  await env.DB.prepare(`
    INSERT INTO payments (id, order_id, provider, provider_ref, status, amount_cents, raw_payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(newId("pay"), order.id, payment.provider, payment.providerRef || null, "Paid", order.amount_cents, payment.raw || "{}", now()).run();
  await sendWhatsapp(env, order.id, order.owner_phone, "order_payment_confirmed", `Payment received for ${order.plate}. Invoice ${order.invoice_id} is ready.`);
  return json({ order: await orderById(env, order.id) });
}

async function refreshOrderCompletionState(env, orderId) {
  const order = await orderById(env, orderId);
  if (!order || order.payment_status !== "Paid") return;
  const files = await filesByOrderIds(env, [order.id]);
  const hasGeran = files[order.id]?.some((file) => file.kind === "geran");
  const nextStatus = !hasGeran ? STATUS.MISSING_GERAN : !order.chassis ? STATUS.MISSING_CHASSIS : STATUS.READY;
  if (order.status.includes("Missing") || order.status === STATUS.PAID) {
    await env.DB.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").bind(nextStatus, now(), order.id).run();
  }
}

async function persistFile(env, orderId, kind, file, uploadedByType, uploadedById) {
  if (file.size > 20 * 1024 * 1024) throw new Error("File exceeds 20MB limit");
  const id = newId("file");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${orderId}/${kind}/${id}-${safeName}`;
  const storageKey = env.FILE_STORAGE === "r2" && env.UPLOADS ? key : `mock://${key}`;
  if (env.FILE_STORAGE === "r2" && env.UPLOADS) {
    await env.UPLOADS.put(key, file.stream(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
  }
  const record = {
    id,
    order_id: orderId,
    kind,
    filename: safeName,
    content_type: file.type || "application/octet-stream",
    size: file.size,
    r2_key: storageKey,
    uploaded_by_type: uploadedByType,
    uploaded_by_id: uploadedById,
    created_at: now()
  };
  await env.DB.prepare(`
    INSERT INTO files (id, order_id, kind, filename, content_type, size, r2_key, uploaded_by_type, uploaded_by_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(record.id, record.order_id, record.kind, record.filename, record.content_type, record.size, record.r2_key, record.uploaded_by_type, record.uploaded_by_id, record.created_at).run();
  return record;
}

async function orderById(env, orderId) {
  return env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
}

async function ordersForCustomer(env, customerId) {
  const rows = await env.DB.prepare("SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC").bind(customerId).all();
  return attachFiles(env, rows.results || []);
}

async function attachFiles(env, orders) {
  const byOrder = await filesByOrderIds(env, orders.map((order) => order.id));
  return orders.map((order) => ({ ...order, files: byOrder[order.id] || [] }));
}

async function filesByOrderIds(env, orderIds) {
  if (!orderIds.length) return {};
  const placeholders = orderIds.map(() => "?").join(",");
  const rows = await env.DB.prepare(`SELECT id, order_id, kind, filename, content_type, size, created_at FROM files WHERE order_id IN (${placeholders})`).bind(...orderIds).all();
  return (rows.results || []).reduce((acc, file) => {
    acc[file.order_id] ||= [];
    acc[file.order_id].push(file);
    return acc;
  }, {});
}

async function requireAuth(request, env, subjectType, role) {
  const token = readCookie(request, env.SESSION_COOKIE_NAME || "eplate_session");
  if (!token) return { response: json({ error: "Unauthenticated" }, 401) };
  const session = await env.DB.prepare("SELECT * FROM sessions WHERE token_hash = ?").bind(await sha256(token)).first();
  if (!session || session.subject_type !== subjectType || Date.parse(session.expires_at) < Date.now()) {
    return { response: json({ error: "Unauthenticated" }, 401) };
  }
  const subject = subjectType === "customer"
    ? await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(session.subject_id).first()
    : await env.DB.prepare("SELECT * FROM staff_users WHERE id = ?").bind(session.subject_id).first();
  if (!subject || (role && subject.role !== role)) return { response: json({ error: "Forbidden" }, 403) };
  return { session, subject: subjectType === "staff" ? publicStaff(subject) : subject };
}

async function createSessionResponse(env, subjectId, subjectType, payload) {
  const token = crypto.randomUUID() + "." + crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await env.DB.prepare("INSERT INTO sessions (token_hash, subject_id, subject_type, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(await sha256(token), subjectId, subjectType, expires.toISOString(), now())
    .run();
  const domain = env.COOKIE_DOMAIN ? ` Domain=${env.COOKIE_DOMAIN};` : "";
  return json(payload, 200, {
    "set-cookie": `${env.SESSION_COOKIE_NAME || "eplate_session"}=${token}; Path=/;${domain} HttpOnly; Secure; SameSite=Lax; Expires=${expires.toUTCString()}`
  });
}

async function sendSms(env, phone, body) {
  if (!env.SMS_API_URL) throw new Error("SMS_API_URL is not configured");
  await fetch(env.SMS_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.SMS_API_KEY}` },
    body: JSON.stringify({ to: phone, body })
  });
}

async function sendWhatsapp(env, orderId, phone, templateName, body) {
  let status = "Mock sent";
  let providerMessageId = null;
  let raw = "{}";
  if (env.MOCK_PROVIDERS !== "true") {
    const response = await fetch(`https://graph.facebook.com/${env.WHATSAPP_API_VERSION || "v20.0"}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone.replace("+", ""),
        type: "template",
        template: { name: templateName, language: { code: "en_US" } }
      })
    });
    raw = await response.text();
    status = response.ok ? "Sent" : "Failed";
    providerMessageId = JSON.parse(raw || "{}")?.messages?.[0]?.id || null;
  }
  await env.DB.prepare(`
    INSERT INTO whatsapp_messages (id, order_id, phone, template_name, body, provider_message_id, status, raw_payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(newId("msg"), orderId, phone, templateName, body, providerMessageId, status, raw, now()).run();
}

async function invoicePdf(request, env, invoiceId) {
  const auth = await requireAnyAuth(request, env);
  if (auth.response) return auth.response;
  const order = await env.DB.prepare("SELECT * FROM orders WHERE invoice_id = ?").bind(invoiceId).first();
  if (!order) return json({ error: "Invoice not found" }, 404);
  if (auth.subjectType === "customer" && order.customer_id !== auth.subject.id) return json({ error: "Forbidden" }, 403);
  const blob = createPdfBlob(invoiceText(order));
  return new Response(blob, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${invoiceId}.pdf"`
    }
  });
}

async function requireAnyAuth(request, env) {
  const customer = await requireAuth(request, env, "customer");
  if (!customer.response) return { ...customer, subjectType: "customer" };
  const staff = await requireAuth(request, env, "staff");
  if (!staff.response) return { ...staff, subjectType: "staff" };
  return { response: json({ error: "Unauthenticated" }, 401) };
}

function invoiceText(order) {
  return [
    "ePlate.my Invoice",
    `Invoice: ${order.invoice_id}`,
    `Order: ${order.id}`,
    `Date paid: ${order.paid_at || "-"}`,
    "",
    `Customer: ${order.owner_name}`,
    `Phone: ${order.owner_phone}`,
    `Vehicle plate: ${order.plate}`,
    `Vehicle brand: ${order.brand || "-"}`,
    "",
    `JPJePlate package: RM${(order.amount_cents / 100).toFixed(2)}`,
    `Payment status: ${order.payment_status}`
  ].join("\n");
}

function createPdfBlob(text) {
  const pdfText = text.split("\n").map((line, index) => {
    const escaped = line.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
    if (index === 0) return `/F1 18 Tf 50 780 Td (${escaped}) Tj`;
    return `0 -16 Td /F1 11 Tf (${escaped}) Tj`;
  }).join("\n");
  const stream = `BT\n${pdfText}\nET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefAt = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return pdf;
}

async function audit(env, auth, action, targetType, targetId, metadata) {
  await env.DB.prepare(`
    INSERT INTO audit_logs (id, actor_type, actor_id, action, target_type, target_id, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(newId("audit"), "staff", auth.subject.id, action, targetType, targetId, JSON.stringify(metadata || {}), now()).run();
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return `pbkdf2:${toHex(salt)}:${toHex(new Uint8Array(bits))}`;
}

async function verifyPassword(password, hash) {
  if (!hash?.startsWith("pbkdf2:")) return false;
  const [, saltHex, expected] = hash.split(":");
  const salt = fromHex(saltHex);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return toHex(new Uint8Array(bits)) === expected;
}

async function sha256(value) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(new Uint8Array(hash));
}

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}

function readCookie(request, name) {
  return (request.headers.get("cookie") || "")
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1];
}

function publicStaff(staff) {
  return { id: staff.id, username: staff.username, role: staff.role, display_name: staff.display_name };
}

function normalizePhone(phone) {
  const cleaned = String(phone || "").replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  return cleaned.startsWith("+") ? cleaned : cleaned.replace(/^0/, "+60");
}

function normalizePlate(plate) {
  return String(plate || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function nextOrderId() {
  return `EP${Date.now().toString().slice(-8)}`;
}

function nextInvoiceId() {
  return `INV-${Date.now().toString().slice(-8)}`;
}

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

function now() {
  return new Date().toISOString();
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), "content-type": "application/json", ...headers }
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-setup-token"
  };
}
