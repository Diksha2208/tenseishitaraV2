import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Dynamic API (same style you use elsewhere)
const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

function getImageUrl(filename) {
  if (!filename) return "/images/placeholder.png";
  if (typeof filename === "string" && filename.startsWith("http")) return filename;
  return `${API_BASE}${filename.startsWith("/") ? filename : `/${filename}`}`;
}

export default function Categories({ addToCart, siteDiscount = 0 }) {
  const navigate = useNavigate();
  const { id: routeId } = useParams(); // optional (if you mount this at /categories/:id)

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // discount (consistent with the rest of your app)
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

  // Fetch categories + all products once
  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setLoading(true);
        const [catsRes, prodsRes] = await Promise.all([
          fetch(`${API_BASE}/api/products/categories-with-image`),
          fetch(`${API_BASE}/api/products`),
        ]);

        const cats = await catsRes.json();
        const prods = await prodsRes.json();

        if (!isMounted) return;
        setCategories(Array.isArray(cats) ? cats : []);
        setAllProducts(Array.isArray(prods) ? prods : []);

        // choose active category:
        const initialId =
          routeId ||
          (Array.isArray(cats) && cats.length ? String(cats[0].categoryID) : null);
        setActiveCategoryId(initialId);
      } catch (e) {
        console.error("Failed to load categories/products:", e);
      } finally {
        isMounted && setLoading(false);
      }
    }
    bootstrap();
    return () => {
      isMounted = false;
    };
  }, [routeId]);

  // Products filtered for selected category
  const visibleProducts = useMemo(() => {
    if (!activeCategoryId) return [];
    return (allProducts || []).filter(
      (p) => String(p.categoryID) === String(activeCategoryId)
    );
  }, [allProducts, activeCategoryId]);

  const colors = {
    bg: "#0b0e14",
    text: "#e5e7eb",
    sub: "rgba(229,231,235,.75)",
    accent: "#00c4ff",
    line: "rgba(255,255,255,0.10)",
    panel: "#12161f",
    price: "#f87171",
  };

  const handleAdd = (p) => {
    addToCart?.({
      id: p.productID,
      name: p.productTitle,
      price: parseFloat(p.listPrice) || 0,
      qty: 1,
      stock: p.stock || 10,
      pic: p.productImage,
      optionKey: "default",
    });
  };

  return (
    <section style={{ background: colors.bg, minHeight: "100vh", color: colors.text }}>
      <div className="container" style={{ maxWidth: 1200, padding: "32px 16px" }}>
        {/* Heading */}
        <div className="text-center mb-3">
          <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, color: "#fff" }}>
            Shop By <span style={{ color: colors.accent }}>Categories</span>
          </h1>
        </div>

        {/* Categories pills */}
        <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
          {(categories || []).map((c) => {
            const active = String(activeCategoryId) === String(c.categoryID);
            return (
              <button
                key={c.categoryID}
                onClick={() => {
                  setActiveCategoryId(String(c.categoryID));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="btn"
                style={{
                  borderRadius: 14,
                  padding: "10px 16px",
                  background: "transparent",
                  color: active ? "#fff" : colors.text,
                  border: `1px solid ${active ? colors.accent : colors.line}`,
                  boxShadow: active ? `0 0 0 3px ${colors.accent}20 inset` : "none",
                }}
              >
                {c.categoryName}
              </button>
            );
          })}
        </div>

        {/* Loading or Empty */}
        {loading ? (
          <div className="text-center" style={{ color: colors.sub }}>Loading…</div>
        ) : !activeCategoryId ? (
          <div className="text-center" style={{ color: colors.sub }}>
            No categories found.
          </div>
        ) : (
          <>
            {/* Category title */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h2 style={{ margin: 0, color: "#fff", fontSize: 24 }}>
                {categories.find((c) => String(c.categoryID) === String(activeCategoryId))?.categoryName}
              </h2>
              <button
                className="btn btn-sm"
                onClick={() => navigate("/search")}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${colors.line}`,
                  background: "transparent",
                  color: colors.text,
                }}
              >
                Browse all
              </button>
            </div>

            {/* Products grid */}
            {visibleProducts.length === 0 ? (
              <div className="text-center" style={{ color: colors.sub }}>
                No products in this category.
              </div>
            ) : (
              <div className="row g-3">
                {visibleProducts.map((p) => {
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
                          <div
                            className="text-truncate"
                            title={p.productTitle}
                            style={{ fontSize: 14, color: colors.text }}
                          >
                            {p.productTitle}
                          </div>

                          <div className="d-flex align-items-baseline gap-2">
                            <span style={{ color: colors.price, fontWeight: 700 }}>
                              ${d}
                            </span>
                            <small
                              style={{
                                color: colors.sub,
                                textDecoration: "line-through",
                              }}
                            >
                              ${base.toFixed(2)}
                            </small>
                          </div>

                          <div className="mt-auto d-flex justify-content-end">
                            <button
                              className="btn btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdd(p);
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
            )}
          </>
        )}
      </div>
    </section>
  );
}
