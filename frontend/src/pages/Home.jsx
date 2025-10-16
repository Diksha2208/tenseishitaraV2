// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Dynamic API base (works locally and in prod)
const API_BASE =  process.env.REACT_APP_API_URL || window.location.origin;

// Safe image URL helper
function getImageUrl(filename) {
  if (!filename || typeof filename !== "string" || filename.trim() === "") {
    return "/images/placeholder.png";
  }
  if (filename.startsWith("http")) return filename;
  if (filename.startsWith("/api/uploads/")) {
    return `${API_BASE}${filename.replace("/api", "")}`;
  }
  if (filename.startsWith("/uploads/")) {
    return `${API_BASE}${filename}`;
  }
  return `${API_BASE}/uploads/${filename}`;
}

export default function Home({ user, cart, setCart, addToCart, siteDiscount }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Persist/randomize site-wide discount (unchanged)
  useEffect(() => {
    const discount = sessionStorage.getItem("siteDiscount")
      ? parseInt(sessionStorage.getItem("siteDiscount"))
      : Math.floor(Math.random() * 21) + 10;
    sessionStorage.setItem("siteDiscount", discount);
  }, []);

  // Fetch products + categories
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/products`)
      .then((res) => setProducts(res.data.sort(() => 0.5 - Math.random())))
      .catch((err) => console.error("❌ Error fetching products:", err));

    axios
      .get(`${API_BASE}/api/products/categories-with-image`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("❌ Error fetching categories:", err));
  }, []);

  // Helpers
  const goToProduct = (id) => navigate(`/product/${id}`);

  const handleAddToCart = (product) => {
    const cartItem = {
      id: product.productID,
      name: product.productTitle,
      price: parseFloat(product.listPrice) || 0,
      qty: 1,
      stock: product.stock || 10,
      pic: product.productImage,
      optionKey: "default",
    };
    addToCart(cartItem);
  };

  // NEW: send users to the new categories hub
  const handleShopNow = (categoryID) => navigate(`/categories/${categoryID}`);

  // Colors for dark theme
  const colors = {
    bg: "#0b0e14",
    panel: "#12161f",
    line: "rgba(255,255,255,0.08)",
    text: "#e5e7eb",
    sub: "rgba(229,231,235,.75)",
    accent: "#00c4ff",
    price: "#f59e0b",
  };

  return (
    <div style={{ background: colors.bg }}>
      {/* 1) DEALS — dark “screenshot” hero */}
      <section id="deals" className="py-5" style={{ color: colors.text }}>
        <div className="container">
          <div className="row g-4 align-items-center">
            {/* Left copy */}
            <div className="col-12 col-md-7 text-center text-md-start">
              <p
                className="mb-1 text-uppercase"
                style={{ letterSpacing: ".18em", color: "rgba(229,231,235,.6)", fontSize: 12 }}
              >
                This week
              </p>
              <h1 className="mb-3" style={{ fontWeight: 700, fontSize: 48, color: "#fff" }}>
                Deals
              </h1>
              <p
                className="mb-4"
                style={{ color: "rgba(229,231,235,.8)", fontSize: 18, maxWidth: 680, marginInline: "auto" }}
              >
                Products up to {siteDiscount}% off. Fresh picks and a faster, cleaner layout.
              </p>
              <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-md-start">
                <button
                  className="btn"
                  style={{
                    background: "#fff",
                    color: colors.bg,
                    borderRadius: 16,
                    padding: "10px 18px",
                    fontWeight: 700,
                  }}
                  onClick={() =>
                    products[0]
                      ? goToProduct(products[0].productID)
                      : categories[0]
                      ? handleShopNow(categories[0].categoryID)
                      :  navigate("/deals")
                  }
                >
                  Shop Deals
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
                      overflow: "hidden",
                    }}
                    >
                    <img
                      src="../images/discount.png"
                      alt="Discount"
                      style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 20,
                      }}
                    />
                    </div>
                  </div>
                  </div>
                </div>
                </section>
               {/* 3) CATEGORIES — minimal chip row (points to /categories hub) */}
      <section className="py-5" id="categories" style={{ background: colors.bg }}>
        <div className="container">
          {/* Centered, large white heading (matches “Deals”) */}
          <div className="text-center mb-3">
            <h2 className="mb-1" style={{ color: "#fff", fontWeight: 700, fontSize: 36 }}>
              Shop by <span style={{ color: colors.accent }}>Categories</span>
            </h2>

            {/* NEW: link to the new categories hub */}
            <a
              href="/categories"
              className="small text-decoration-underline"
              style={{ color: "rgba(229,231,235,.85)" }}
            >
              Shop More
            </a>
          </div>

          {/* Chip list */}
          {categories.length === 0 ? (
            <p className="text-center" style={{ color: colors.sub }}>
              No categories available.
            </p>
          ) : (
            <div
              className="d-flex flex-wrap gap-2 justify-content-center"
              style={{ alignItems: "center" }}
            >
              {categories.map((c) => (
                <button
                  key={c.categoryID}
                  type="button"
                  onClick={() => navigate(`/categories/${c.categoryID}`)} // NEW: deep link to hub
                  className="btn btn-sm"
                  style={{
                    borderRadius: 12,
                    background: "transparent",
                    color: colors.text,
                    border: `1px solid ${colors.line}`,
                    padding: "10px 16px",
                    textTransform: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,.35)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.line)}
                >
                  {c.categoryName}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* 2) NEW PRODUCTS — clickable cards */}
      <section className="py-5" id="new" style={{ background: colors.bg }}>
        <div className="container">
          {/* Centered, large white heading (matches “Deals”) */}
          <div className="text-center mb-4">
            <h2 className="mb-1" style={{ color: "#fff", fontWeight: 700, fontSize: 36 }}>
              New <span style={{ color: colors.accent }}>Products</span>
            </h2>
            <a
              href="/search"
              className="small text-decoration-underline"
              style={{ color: "rgba(229,231,235,.85)" }}
            >
              View all
            </a>
          </div>

          <div className="row g-3">
            {(products || []).slice(0, 12).map((p) => (
              <div key={p.productID} className="col-6 col-md-4 col-xl-3">
                <div
                  className="card h-100 shadow-sm"
                  style={{
                    background: colors.panel,
                    border: `1px solid ${colors.line}`,
                    borderRadius: 16,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform .2s ease",
                  }}
                  onClick={() => goToProduct(p.productID)}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  {/* Product Image */}
                  <div className="position-relative">
                    <img
                      src={getImageUrl(p.productImage)}
                      alt={p.productTitle}
                      className="w-100"
                      style={{
                        height: 220,
                        objectFit: "cover",
                        borderBottom: `1px solid ${colors.line}`,
                      }}
                      onError={(e) => (e.currentTarget.src = "/images/placeholder.png")}
                    />
                    <span
                      className="position-absolute top-0 start-0 m-2 px-2 py-1 rounded-pill"
                      style={{
                        background: "rgba(56,189,248,.18)",
                        color: "#60a5fa",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      New
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="card-body d-flex flex-column justify-content-between" style={{ color: colors.text }}>
                    {/* Product Title */}
                    <div className="small text-truncate mb-1" title={p.productTitle}>
                      {p.productTitle}
                    </div>

                    {/* Price + Add Button Row */}
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex flex-column">
                        <span className="fw-semibold" style={{ color: colors.price }}>
                          ${(p.listPrice * (1 - siteDiscount / 100)).toFixed(2)}
                        </span>
                        <small style={{ color: colors.sub }}>
                          <del>${Number(p.listPrice).toFixed(2)}</del>
                        </small>
                      </div>

                      {/* Add to Cart button (does not trigger navigation) */}
                      <button
                        className="btn btn-sm btn-light fw-semibold"
                        style={{ borderRadius: 12, padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={(e) => {
                          e.stopPropagation(); // prevent card click
                          handleAddToCart(p);
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {products.length === 0 && (
              <div className="col-12 text-center" style={{ color: colors.sub }}>
                No products available.
              </div>
            )}
          </div>
        </div>
      </section>

   
    </div>
  );
}
