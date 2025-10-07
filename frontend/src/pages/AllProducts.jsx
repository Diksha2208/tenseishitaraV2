import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://ts-anime-backend.onrender.com");

function getImageUrl(filename) {
  if (!filename) return "/images/placeholder.png";
  if (typeof filename === "string" && filename.startsWith("http")) return filename;
  return `${API_BASE}${filename.startsWith("/") ? filename : `/${filename}`}`;
}

export default function AllProducts({ addToCart, siteDiscount = 0 }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  // UI state
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest"); // price_asc | price_desc | name_asc | name_desc | newest
  const [page, setPage] = useState(1);
  const perPage = 24;

  // discount
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

  // filter + sort
  const filtered = useMemo(() => {
    let arr = [...products];

    if (q.trim()) {
      const needle = q.toLowerCase();
      arr = arr.filter(
        (p) =>
          String(p.productTitle || "").toLowerCase().includes(needle) ||
          String(p.categoryName || "").toLowerCase().includes(needle)
      );
    }

    const price = (p) => parseFloat(p.listPrice) || 0;
    const name = (p) => String(p.productTitle || "");
    const created = (p) => new Date(p.createdAt || p.updatedAt || 0).getTime();

    switch (sort) {
      case "price_asc":
        arr.sort((a, b) => price(a) - price(b));
        break;
      case "price_desc":
        arr.sort((a, b) => price(b) - price(a));
        break;
      case "name_asc":
        arr.sort((a, b) => name(a).localeCompare(name(b)));
        break;
      case "name_desc":
        arr.sort((a, b) => name(b).localeCompare(name(a)));
        break;
      default:
        // newest
        arr.sort((a, b) => created(b) - created(a));
    }
    return arr;
  }, [products, q, sort]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * perPage, pageSafe * perPage);

  const colors = {
    bg: "#0b0e14",
    text: "#e5e7eb",
    sub: "rgba(229,231,235,.75)",
    accent: "#00c4ff",
    line: "rgba(255,255,255,0.10)",
    panel: "#12161f",
    price: "#f87171",
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
        {/* Heading */}
        <div className="text-center mb-3">
          <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, color: "#fff" }}>
            All <span style={{ color: colors.accent }}>Products</span>
          </h1>
          <p style={{ color: colors.sub, marginTop: 8 }}>
            Browse everything, or search and sort to find what you need.
          </p>
        </div>

        {/* Controls */}
        <div
          className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3"
          style={{ border: `1px solid ${colors.line}`, borderRadius: 12, padding: 12, background: colors.panel }}
        >
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search products or categories…"
            className="form-control"
            style={{
              maxWidth: 460,
              background: "#0f1420",
              color: colors.text,
              border: `1px solid ${colors.line}`,
              borderRadius: 10,
            }}
          />
          <div className="d-flex gap-2 align-items-center">
            <label className="me-1" style={{ color: colors.sub, fontSize: 12 }}>
              Sort
            </label>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="form-select"
              style={{
                background: "#0f1420",
                color: colors.text,
                border: `1px solid ${colors.line}`,
                borderRadius: 10,
              }}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A → Z</option>
              <option value="name_desc">Name: Z → A</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center" style={{ color: colors.sub }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center" style={{ color: colors.sub }}>
            No products found.
          </div>
        ) : (
          <>
            <div className="row g-3">
              {pageItems.map((p) => {
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

            {/* Pagination */}
            <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
              <button
                className="btn btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe === 1}
                style={{ border: `1px solid ${colors.line}`, background: "transparent", color: colors.text }}
              >
                ← Prev
              </button>
              <span style={{ color: colors.sub, fontSize: 12 }}>
                Page {pageSafe} / {totalPages}
              </span>
              <button
                className="btn btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe === totalPages}
                style={{ border: `1px solid ${colors.line}`, background: "transparent", color: colors.text }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
