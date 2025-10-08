import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://tenseishitarav2.onrender.com");

function getImageUrl(filename) {
  if (!filename) return "/images/placeholder.png";
  if (typeof filename === "string" && filename.startsWith("http")) return filename;
  return `${API_BASE}${filename.startsWith("/") ? filename : `/${filename}`}`;
}

export default function Deals({ addToCart, siteDiscount = 0 }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  const [discount, setDiscount] = useState(() => {
    const saved = sessionStorage.getItem("siteDiscount");
    return siteDiscount || (saved ? parseInt(saved) : 0);
  });
  useEffect(() => {
    if (siteDiscount && siteDiscount !== discount) {
      setDiscount(siteDiscount);
      sessionStorage.setItem("siteDiscount", siteDiscount);
    }
  }, [siteDiscount]); // eslint-disable-line

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/products`);
        const data = await res.json();
        if (!alive) return;
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load products", e);
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Sort “dealiness” — here just by base price desc to create a “featured deals” feel.
  const sorted = useMemo(() => {
    const clone = [...products];
    clone.sort((a, b) => (parseFloat(b.listPrice) || 0) - (parseFloat(a.listPrice) || 0));
    return clone;
  }, [products]);

  const colors = {
    bg: "#0b0e14",
    text: "#e5e7eb",
    sub: "rgba(229,231,235,.75)",
    accent: "#00c4ff",
    line: "rgba(255,255,255,0.10)",
    panel: "#12161f",
    price: "#f87171",
    chip: "rgba(255,255,255,.06)",
  };

  const add = (p) =>
    addToCart?.({
      id: p.productID,
      name: p.productTitle,
      price: parseFloat(p.listPrice) || 0,
      qty: 1,
      stock: p.stock || 10,
      pic: p.productImage,
      optionKey: "default",
    });

  return (
    <section style={{ background: colors.bg, minHeight: "100vh", color: colors.text }}>
      <div className="container" style={{ maxWidth: 1200, padding: "32px 16px" }}>
        {/* Hero */}
        <div className="row g-4 align-items-center mb-3">
          <div className="col-12 col-md-7 text-center text-md-start">
            <p
              className="mb-1 text-uppercase"
              style={{ letterSpacing: ".18em", color: "rgba(229,231,235,.6)", fontSize: 12 }}
            >
              This week
            </p>
            <h1 className="mb-2" style={{ fontWeight: 800, fontSize: 46, color: "#fff" }}>
              Deals
            </h1>
            <p style={{ color: colors.sub }}>
              Save up to <strong style={{ color: "#fff" }}>{discount}%</strong> across the store.
              New offers each week.
            </p>
            <div className="d-flex gap-3 justify-content-center justify-content-md-start">
              <button
                className="btn"
                onClick={() => navigate("/categories")}
                style={{
                  borderRadius: 14,
                  background: "transparent",
                  border: `1px solid ${colors.line}`,
                  color: colors.text,
                  padding: "10px 16px",
                }}
              >
                Browse Categories
              </button>
              <button
                className="btn"
                onClick={() => navigate("/products")}
                style={{
                  borderRadius: 14,
                  background: "#fff",
                  color: colors.bg,
                  padding: "10px 16px",
                  fontWeight: 700,
                }}
              >
                Shop All
              </button>
            </div>
          </div>
          <div className="col-12 col-md-5">
            <div
              style={{
                width: "100%",
                aspectRatio: "4 / 3",
                borderRadius: 20,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                border: "1px solid rgba(229,231,235,.15)",
              }}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center" style={{ color: colors.sub }}>Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="text-center" style={{ color: colors.sub }}>No deals available.</div>
        ) : (
          <>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h2 style={{ margin: 0, color: "#fff", fontSize: 24 }}>This Week’s Picks</h2>
              <span
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: colors.chip,
                  border: `1px solid ${colors.line}`,
                }}
              >
                Storewide −{discount}%
              </span>
            </div>

            <div className="row g-3">
              {sorted.map((p) => {
                const base = parseFloat(p.listPrice) || 0;
                const d = (base * (1 - discount / 100)).toFixed(2);
                return (
                  <div key={p.productID} className="col-6 col-md-4 col-xl-3">
                    <div
                      className="h-100"
                      style={{
                        background: colors.panel,
                        border: `1px solid ${colors.line}`,
                        borderRadius: 14,
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "transform .15s ease",
                      }}
                      onClick={() => navigate(`/product/${p.productID}`)}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    >
                      <div style={{ height: 180, background: "#0f1420", overflow: "hidden" }}>
                        <img
                          src={getImageUrl(p.productImage)}
                          alt={p.productTitle}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => (e.currentTarget.src = "/images/placeholder.png")}
                        />
                      </div>
                      <div className="p-2 d-flex flex-column" style={{ gap: 6 }}>
                        <div className="text-truncate" title={p.productTitle} style={{ fontSize: 14 }}>
                          {p.productTitle}
                        </div>
                        <div className="d-flex align-items-baseline gap-2">
                          <span style={{ color: colors.price, fontWeight: 700 }}>${d}</span>
                          <small style={{ color: colors.sub, textDecoration: "line-through" }}>
                            ${base.toFixed(2)}
                          </small>
                        </div>
                        <div className="mt-auto d-flex justify-content-end">
                          <button
                            className="btn btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              add(p);
                            }}
                            style={{
                              borderRadius: 10,
                              background: colors.accent,
                              color: "#fff",
                              padding: "6px 10px",
                              fontWeight: 700,
                            }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
