// src/pages/Account.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Backend base
const API_BASE =  process.env.REACT_APP_API_URL || window.location.origin;

// Resolve user/media image
function getImageUrl(filename) {
  if (!filename) return "/images/default-user.png";
  if (typeof filename === "string" && filename.startsWith("http")) return filename;
  return `${API_BASE}${filename.startsWith("/uploads/") ? filename : `/uploads/${filename}`}`;
}

export default function Account({ user, setUser }) {
  const navigate = useNavigate();

  // ----------------- Hooks (unconditional) -----------------
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "" });
  const [profileImage, setProfileImage] = useState("/images/default-user.png");
  const [imageFile, setImageFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showOrders, setShowOrders] = useState(false);
  const [showPayments, setShowPayments] = useState(false);

  // ----------------- Effects -----------------
  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  // Seed form state from user
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
      setProfileImage(getImageUrl(user.profileImage));
    }
  }, [user]);

  // ----------------- Handlers -----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setProfileImage(URL.createObjectURL(file)); // preview
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const form = new FormData();
      form.append("firstName", formData.firstName);
      form.append("lastName", formData.lastName);
      form.append("email", formData.email);
      if (imageFile) form.append("profileImage", imageFile);

      const res = await axios.post(`${API_BASE}/api/user/update-profile`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setIsEditing(false);
      alert("✅ Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("❌ Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Theme tokens -----------------
  const bg = "#0b0e14";
  const panel = "#12161f";
  const border = "1px solid rgba(255,255,255,0.10)";
  const text = "#e5e7eb";
  const sub = "#9ca3af";
  const accent = "#29C5F6";

  // Graceful placeholder during redirect
  if (!user) {
    return (
      <section style={{ background: bg, color: text, minHeight: "60vh" }} className="d-flex align-items-center justify-content-center">
        <div>Redirecting to login…</div>
      </section>
    );
  }

  // Mock data (wireframe)
  const recentOrders = (user.recentOrders?.length ? user.recentOrders : [
    { id: "A1239", name: "Product Name", price: 29.99, status: "Shipped" },
    { id: "A1240", name: "Product Name", price: 59.99, status: "Shipped" },
    { id: "A1241", name: "Product Name", price: 16.49, status: "Processing" },
  ]).slice(0, 3);

  const notifications = user.notifications?.length
    ? user.notifications
    : [
        { id: 1, text: "Order #42134 Shipped" },
        { id: 2, text: "20% Off This Week" },
        { id: 3, text: "Payment Method Updated" },
        { id: 4, text: "Address Verified" },
      ];

  // Static, non-blinking wishlist preview
  const wishlistPreviewStatic = [
    { id: 1, productTitle: "Sample Product", productImage: "/images/placeholder.png" },
    { id: 2, productTitle: "Sample Product", productImage: "/images/placeholder.png" },
    { id: 3, productTitle: "Sample Product", productImage: "/images/placeholder.png" },
  ];

  // ----------------- Render -----------------
  return (
    <section style={{ background: bg, color: text, minHeight: "100vh", padding: "2rem 1rem" }}>
      <div className="container" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 style={{ fontWeight: 700, fontSize: 36, color: "#fff" }}>Account</h1>
          <button onClick={() => navigate(-1)} className="btn btn-sm" style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", color: text }}>
            Back
          </button>
        </div>

        <div className="row g-3">
          {/* LEFT: Sidebar */}
          <div className="col-12 col-lg-2">
            <div style={{ background: panel, border, borderRadius: 12, padding: 12 }}>
              {[
                { label: "Profile Overview", onClick: () => navigate("/account") },
                { label: "Orders & History", onClick: () => setShowOrders(true) },
                { label: "Payment Methods", onClick: () => setShowPayments(true) },
                { label: "Wishlist", onClick: () => navigate("/wishlist") },
                { label: "Settings", onClick: () => navigate("/settings") },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={b.onClick}
                  className="btn w-100 text-start mb-2"
                  style={{
                    borderRadius: 10,
                    background: "transparent",
                    color: text,
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* CENTER: Profile + Content */}
          <div className="col-12 col-lg-7">
            {/* Profile Card */}
            <div style={{ background: panel, border, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center">
                  <img
                    src={profileImage}
                    alt="profile"
                    className="me-3"
                    style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.15)" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                      {formData.firstName || user.firstName} {formData.lastName || user.lastName}
                    </div>
                    <div style={{ color: sub, fontSize: 14 }}>{formData.email || user.email}</div>
                  </div>
                </div>

                <div className="mt-3 mt-lg-0">
                  {!isEditing ? (
                    <button
                      className="btn"
                      onClick={() => setIsEditing(true)}
                      style={{ borderRadius: 12, background: "#fff", color: "#000", fontWeight: 600 }}
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="d-flex gap-2">
                      <button
                        className="btn"
                        onClick={handleSave}
                        disabled={loading}
                        style={{ borderRadius: 12, background: accent, color: "#fff", fontWeight: 600 }}
                      >
                        {loading ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="btn"
                        onClick={() => setIsEditing(false)}
                        style={{ borderRadius: 12, background: "transparent", color: text, border: "1px solid rgba(255,255,255,0.15)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="row g-2 mt-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label" style={{ color: sub }}>First Name</label>
                    <input className="form-control" name="firstName" value={formData.firstName} onChange={handleChange} />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label" style={{ color: sub }}>Last Name</label>
                    <input className="form-control" name="lastName" value={formData.lastName} onChange={handleChange} />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label" style={{ color: sub }}>Email</label>
                    <input className="form-control" type="email" name="email" value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label" style={{ color: sub }}>Profile Image</label>
                    <input className="form-control" type="file" accept="image/*" onChange={handleFileChange} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="row g-2 mb-3">
              {[
                { label: "Orders", value: user?.ordersCount ?? 12 },
                { label: "Wishlist", value: user?.wishlist?.length ?? 8 },
                { label: "Addresses", value: user?.addressesCount ?? 3 },
                { label: "Payments", value: user?.paymentsCount ?? 2 },
              ].map((t) => (
                <div key={t.label} className="col-6 col-md-3">
                  <div style={{ background: panel, border, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                    <div style={{ color: sub, fontSize: 12 }}>{t.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>{t.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            <div style={{ background: panel, border, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0" style={{ color: "#fff" }}>Recent Orders</h5>
                <button className="btn btn-sm" onClick={() => setShowOrders(true)} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", color: text }}>
                  View all
                </button>
              </div>
              {recentOrders.map((o, i) => (
                <div key={i} className="d-flex align-items-center justify-content-between" style={{ padding: "8px 0", borderBottom: i === recentOrders.length - 1 ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="text-truncate" style={{ maxWidth: 280 }}>{o.name}</div>
                  <div style={{ color: sub }}>${Number(o.price).toFixed(2)}</div>
                  <div style={{ color: o.status === "Shipped" ? "#34d399" : "#fbbf24" }}>{o.status}</div>
                </div>
              ))}
            </div>

            {/* Wishlist Preview (Static + disabled actions to avoid blinking) */}
            <div style={{ background: panel, border, borderRadius: 12, padding: 16 }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0" style={{ color: "#fff" }}>Wishlist Preview</h5>
                <button
                  className="btn btn-sm"
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: text,
                    background: "transparent",
                    cursor: "default",
                  }}
                  disabled
                >
                  Manage Wishlist
                </button>
              </div>
              <div className="row g-2">
                {wishlistPreviewStatic.map((p) => (
                  <div key={p.id} className="col-12 col-md-4">
                    <div
                      style={{
                        background: "#0f1420",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                        padding: 12,
                        minHeight: 220,
                        textAlign: "center",
                      }}
                    >
                      <img
                        src={p.productImage}
                        alt={p.productTitle}
                        style={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                          borderRadius: 8,
                          marginBottom: 8,
                        }}
                      />
                      <div className="small text-truncate" style={{ color: "#e5e7eb" }}>
                        {p.productTitle}
                      </div>
                      <div className="mt-2 d-flex gap-2 justify-content-center">
                        <button
                          className="btn btn-sm"
                          style={{
                            background: "#29C5F6",
                            color: "#fff",
                            borderRadius: 10,
                            width: "80px",
                          }}
                          disabled
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{
                            background: "transparent",
                            color: text,
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 10,
                            width: "80px",
                          }}
                          disabled
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Notifications */}
          <div className="col-12 col-lg-3">
            <div style={{ background: panel, border, borderRadius: 12, padding: 16 }}>
              <h5 className="mb-3" style={{ color: "#fff" }}>Notifications</h5>
              <div className="d-flex flex-column" style={{ gap: 10 }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ background: "#0f1420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 10, color: text }}>
                    {n.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <DarkModal open={showOrders} onClose={() => setShowOrders(false)} title="Order History">
          <OrderHistoryBody onView={(id) => console.log("View order", id)} />
        </DarkModal>

        <DarkModal open={showPayments} onClose={() => setShowPayments(false)} title="Payment Methods">
          <PaymentMethodsBody />
        </DarkModal>

        <div style={{ height: 24 }} />
      </div>
    </section>
  );
}

/* ===========================
   Modal + Bodies (same file)
   =========================== */

function DarkModal({ open, onClose, title, children }) {
  // Install/remove ESC handler only while the modal is open
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 1050,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  };

  const dialog = {
    width: "min(960px, 96vw)",
    background: "#12161f",
    color: "#e5e7eb",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
  };

  const header = {
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const titleStyle = { margin: 0, fontWeight: 700, fontSize: 18, color: "#fff" };
  const closeBtn = {
    background: "transparent",
    color: "#e5e7eb",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: "6px 10px",
  };

  return (
    <div style={overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div style={dialog} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <h3 style={titleStyle}>{title}</h3>
          <button style={closeBtn} onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        <div style={{ maxHeight: "75vh", overflow: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function OrderHistoryBody({ onView = () => {} }) {
  const pills = {
    base: {
      fontSize: 12,
      padding: "3px 8px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.12)",
    },
    shipped: { color: "#34d399", borderColor: "rgba(52,211,153,.35)" },
    processing: { color: "#fbbf24", borderColor: "rgba(251,191,36,.35)" },
    cancelled: { color: "#ef4444", borderColor: "rgba(239,68,68,.35)" },
  };

  const orders = [
    { id: "TS-102394", date: "2025-02-04", items: 3, total: 129.97, status: "Shipped", address: "221B Baker St, London" },
    { id: "TS-102311", date: "2025-01-27", items: 1, total: 49.99, status: "Processing", address: "221B Baker St, London" },
    { id: "TS-102201", date: "2025-01-02", items: 2, total: 75.48, status: "Cancelled", address: "221B Baker St, London" },
  ];

  const row = {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.8fr 0.5fr 0.6fr 0.9fr 0.6fr",
    gap: 12,
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };
  const headerRow = {
    ...row,
    fontSize: 12,
    color: "rgba(229,231,235,.6)",
    textTransform: "uppercase",
    letterSpacing: ".06em",
  };
  const actionBtn = {
    background: "#29C5F6",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 600,
  };

  return (
    <div>
      <div style={headerRow}>
        <div>Order</div><div>Date</div><div>Items</div><div>Total</div><div>Status</div><div>Action</div>
      </div>

      {orders.map((o) => (
        <div key={o.id} style={row}>
          <div style={{ fontWeight: 600, color: "#fff" }}>{o.id}</div>
          <div>{o.date}</div>
          <div>{o.items}</div>
          <div>${o.total.toFixed(2)}</div>
          <div>
            <span
              style={{
                ...pills.base,
                ...(o.status === "Shipped"
                  ? pills.shipped
                  : o.status === "Processing"
                  ? pills.processing
                  : pills.cancelled),
              }}
            >
              {o.status}
            </span>
          </div>
          <div>
            <button style={actionBtn} onClick={() => onView(o.id)}>View Details</button>
          </div>
        </div>
      ))}

      {/* Example expanded card */}
      <div style={{ margin: 16, background: "#0f1420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Order TS-102394</div>
        <div style={{ color: "rgba(229,231,235,.7)", fontSize: 14 }}>
          Shipped to 221B Baker St · Tracking: UPS 1Z 999 AA1 01
        </div>
        <div className="row g-2 mt-2">
          {["Rimuru Tempest Cosplay", "Death Note Hoodie", "Kanna Kamui Figure"].map((name, i) => (
            <div key={i} className="col-12 col-md-4">
              <div style={{ background: "#0b0e14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 14, color: "#e5e7eb" }}>{name}</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Qty 1 · $39.99</div>
              </div>
            </div>
          ))}
        </div>
        <div className="d-flex justify-content-end" style={{ gap: 16, marginTop: 12, color: "#e5e7eb" }}>
          <div>Subtotal: <strong>$119.97</strong></div>
          <div>Shipping: <strong>$9.99</strong></div>
          <div>Tax: <strong>$9.99</strong></div>
          <div>Total: <strong>$139.95</strong></div>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodsBody() {
  const panel = {
    background: "#0f1420",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 14,
  };
  const card = (brand, last4, exp, primary) => ({ brand, last4, exp, primary });
  const methods = [
    card("Visa", "4242", "08/27", true),
    card("Mastercard", "4444", "12/26", false),
    card("Amex", "0005", "05/28", false),
  ];
  const badge = {
    fontSize: 11,
    padding: "2px 6px",
    borderRadius: 999,
    color: "#34d399",
    border: "1px solid rgba(52,211,153,.35)",
  };
  const ghost = {
    background: "transparent",
    color: "#e5e7eb",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: "6px 10px",
    fontSize: 12,
  };
  const solid = {
    background: "#29C5F6",
    color: "#fff",
    borderRadius: 10,
    padding: "6px 10px",
    fontSize: 12,
    border: "none",
  };

  return (
    <div style={{ padding: 16 }}>
      <div className="row g-3">
        {methods.map((m, i) => (
          <div key={i} className="col-12 col-md-6">
            <div style={panel}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div style={{ fontWeight: 700, color: "#e5e7eb" }}>
                    {m.brand} •••• {m.last4}
                  </div>
                  <div style={{ color: "rgba(229,231,235,.7)", fontSize: 13 }}>
                    Expires {m.exp}
                  </div>
                </div>
                {m.primary && <span style={badge}>Primary</span>}
              </div>

              <div className="d-flex gap-2 mt-3">
                <button style={solid}>Use</button>
                <button style={ghost}>Make Primary</button>
                <button style={ghost}>Edit</button>
                <button style={{ ...ghost, color: "#ef4444", borderColor: "rgba(239,68,68,.35)" }}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add new card form (mock) */}
        <div className="col-12">
          <div style={{ ...panel, background: "#12161f" }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#fff" }}>
              Add new card
            </div>
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <label className="form-label" style={{ color: "rgba(229,231,235,.7)" }}>
                  Cardholder Name
                </label>
                <input className="form-control" placeholder="Jane Doe" />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label" style={{ color: "rgba(229,231,235,.7)" }}>
                  Card Number
                </label>
                <input className="form-control" placeholder="•••• •••• •••• ••••" />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label" style={{ color: "rgba(229,231,235,.7)" }}>
                  Expiry
                </label>
                <input className="form-control" placeholder="MM/YY" />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label" style={{ color: "rgba(229,231,235,.7)" }}>
                  CVC
                </label>
                <input className="form-control" placeholder="•••" />
              </div>
              <div className="col-12 col-md-6 d-flex align-items-end">
                <button style={{ ...solid, padding: "10px 14px" }}>Save Card</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
