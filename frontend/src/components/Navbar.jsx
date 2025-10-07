import React from "react";
import { Link } from "react-router-dom";
import {
  BsSearch,
  BsServer,
  BsJournal,
  BsBarChartFill,
  BsBasket,
} from "react-icons/bs";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Navbar({ user, logout, cart = [] }) {
  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const getUserImage = (imgPath) =>
    imgPath ? `${API}${imgPath}` : `${API}/uploads/default.png`;

  /* ===========================
     ADMIN NAV (minimal)
  =========================== */
  if (user?.isAdmin) {
    return (
      <header
        className="header admin-header"
        style={{
          background: "#0b0e14",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <section
          className="flex"
          style={{
            padding: "0.8rem 2rem",
            gap: "1rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Admin logo */}
          <Link to="/admin/dashboard" className="logo" style={{ color: "#e5e7eb" }}>
            Admin Panel<span style={{ color: "#00c4ff" }}>.</span>
          </Link>

          {/* Center: search (non-functional placeholder) */}
          <form style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: 280,
                height: 36,
                borderRadius: 999,
                padding: "0 12px",
                background: "#12161f",
                border: "1px solid rgba(255,255,255,.1)",
              }}
            >
              <BsSearch style={{ color: "rgba(229,231,235,.6)" }} />
              <input
                type="text"
                placeholder="Search products..."
                style={{
                  background: "transparent",
                  color: "#e5e7eb",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  marginLeft: 8,
                  width: "100%",
                }}
              />
            </div>
          </form>

          {/* Right: quick links + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link
              className="icon-wrapper"
              to="/admin/dashboard"
              title="Dashboard"
              style={iconPill}
            >
              <BsServer />
            </Link>
            <Link
              className="icon-wrapper"
              to="/admin/products"
              title="Products"
              style={iconPill}
            >
              <BsJournal />
            </Link>
            <Link
              className="icon-wrapper"
              to="/admin/reports"
              title="Reports"
              style={iconPill}
            >
              <BsBarChartFill />
            </Link>

            <button onClick={logout} style={btnGhost}>
              Logout
            </button>

            <img
              src={getUserImage(user?.userImg)}
              alt="Admin"
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,.12)",
                objectFit: "cover",
              }}
            />
          </div>
        </section>
      </header>
    );
  }

  /* ===========================
     USER NAV (simple dark bar)
  =========================== */
  return (
    <header
      className="header"
      style={{
        background: "#0b0e14",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <section
        className="flex"
        style={{
          padding: "0.8rem 2rem",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* LEFT: logo dot + HOME */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.2rem",
            color: "#e5e7eb",
            textDecoration: "none",
            letterSpacing: "0.35em",
            fontSize: "1.6rem",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: "rgba(255,255,255,0.08)",
              display: "inline-block",
            }}
          />
          HOME
        </Link>

        {/* CENTER: links */}
        <nav
          className="d-none d-md-flex"
          style={{
            gap: "2.4rem",
            color: "rgba(229,231,235,.85)",
            fontSize: "1.6rem",
            alignItems: "center",
          }}
        >
          <Link to="/categories" className="nav-link" style={linkMid}>
            Categories
          </Link>
          <Link to="/products" className="nav-link" style={linkMid}>
            All Products
          </Link>
          <Link to="/deals" className="nav-link" style={linkMid}>
            Deals
          </Link>
        </nav>

        {/* RIGHT: auth + cart */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user ? (
            <>
              <Link to="/account" style={btnGhost}>
                Account
              </Link>
              <button onClick={logout} style={btnGhost}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" style={btnGhost}>
              Sign in
            </Link>
          )}

          <Link
            to="/cart"
            className="position-relative"
            style={{
              padding: "0.5rem 1.2rem",
              borderRadius: 12,
              background: "#fff",
              color: "#0b0e14",
              textDecoration: "none",
              fontSize: "1.5rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: ".5rem",
            }}
            title="Cart"
          >
            <BsBasket />
            Cart
            {cartCount > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background: "#e11d48",
                  color: "#fff",
                  borderRadius: 999,
                  height: 18,
                  minWidth: 18,
                  padding: "0 6px",
                  lineHeight: "18px",
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </section>
    </header>
  );
}

/* ——— tiny inline style helpers ——— */
const iconPill = {
  height: 34,
  width: 34,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 10,
  background: "rgba(255,255,255,.08)",
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,.1)",
};

const btnGhost = {
  padding: "0.5rem 1.2rem",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(229,231,235,.9)",
  background: "transparent",
  textDecoration: "none",
  fontSize: "1.5rem",
  cursor: "pointer",
};

const linkMid = {
  color: "rgba(229,231,235,.85)",
  textDecoration: "none",
};
