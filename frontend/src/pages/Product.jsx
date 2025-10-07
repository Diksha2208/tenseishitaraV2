import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Backend URL
const API_BASE =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://ts-anime-backend.onrender.com");

function getFullUrl(path) {
  if (!path) return "/placeholder.png";
  if (typeof path === "string" && path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export default function Product({ addToCart, siteDiscount }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [options, setOptions] = useState({});
  const [selectedImage, setSelectedImage] = useState("");
  const [imageFade, setImageFade] = useState(false);
  const [thumbs, setThumbs] = useState([]); // image thumbnails
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedMessage, setAddedMessage] = useState("");
  const [related, setRelated] = useState([]);

  const [discount, setDiscount] = useState(() => {
    const stored = sessionStorage.getItem("siteDiscount");
    return siteDiscount ?? (stored ? parseInt(stored) : 0);
  });

  // Keep site discount synced
  useEffect(() => {
    if (siteDiscount && siteDiscount !== discount) {
      setDiscount(siteDiscount);
      sessionStorage.setItem("siteDiscount", siteDiscount);
    }
  }, [siteDiscount]); // eslint-disable-line

  // Fetch product + related
  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();

        const productData = data.product || data;
        const optionData = data.options || [];

        // Group options
        const grouped = optionData.reduce((acc, opt) => {
          if (!acc[opt.optionName]) acc[opt.optionName] = [];
          acc[opt.optionName].push({
            ...opt,
            preview: getFullUrl(opt.preview || "/placeholder.png"),
          });
          return acc;
        }, {});

        // Build thumbnails: productImage + any option previews (deduped)
        const tset = new Set();
        if (productData.productImage) tset.add(getFullUrl(productData.productImage));
        Object.values(grouped).forEach((arr) =>
          arr.forEach((o) => o.preview && tset.add(o.preview))
        );
        const thumbList = Array.from(tset);

        if (!isMounted) return;

        setProduct(productData);
        setOptions(grouped);
        setCategoryName(productData.categoryName || "Unknown Category");
        setSelectedImage(
          getFullUrl(productData.productImage || "/placeholder.png")
        );
        setThumbs(thumbList);

        // Fetch related (simple strategy: pull all and filter by category)
        const all = await fetch(`${API_BASE}/api/products`);
        const allData = await all.json();
        const pool = Array.isArray(allData) ? allData : [];
        const sameCategory = pool
          .filter(
            (p) =>
              (p.categoryName || "").toLowerCase() ===
                (productData.categoryName || "").toLowerCase() &&
              String(p.productID) !== String(productData.productID)
          )
          .slice(0, 12);
        setRelated(sameCategory.length ? sameCategory : pool.slice(0, 12));

        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const originalPrice = useMemo(
    () => (product ? parseFloat(product.listPrice) || 0 : 0),
    [product]
  );
  const discountedPrice = useMemo(
    () => (originalPrice * (1 - discount / 100)).toFixed(2),
    [originalPrice, discount]
  );

  if (loading) {
    return (
      <section style={{ minHeight: "60vh" }} className="d-flex align-items-center justify-content-center bg-dark text-light">
        Loading…
      </section>
    );
  }
  if (!product) return <div className="error">Product not found</div>;

  // Handle option change
  const handleOptionChange = (
    optionName,
    optionValue,
    preview,
    isDefault = false
  ) => {
    if (isDefault) {
      setSelectedOptions((prev) => {
        const updated = { ...prev };
        delete updated[optionName];
        return updated;
      });
      setSelectedPreview(null);
      setImageFade(true);
      setTimeout(() => {
        setSelectedImage(getFullUrl(product.productImage));
        setImageFade(false);
      }, 180);
      return;
    }

    setSelectedOptions((prev) => ({ ...prev, [optionName]: optionValue }));
    setSelectedPreview(preview);

    if (preview) {
      setImageFade(true);
      setTimeout(() => {
        setSelectedImage(preview);
        setImageFade(false);
      }, 180);
    }
  };

  // Add to cart
  const handleAddToCart = () => {
    const hasOptions = Object.keys(selectedOptions).length > 0;
    const optionKey = hasOptions
      ? Object.entries(selectedOptions)
          .map(([k, v]) => `${k}:${v}`)
          .sort()
          .join("|")
      : "default";

    const cartItem = {
      id: product.productID,
      name: product.productTitle,
      price: parseFloat(product.listPrice) || 0,
      qty: parseInt(quantity) || 1,
      stock: product.stock,
      pic: selectedPreview
        ? selectedPreview.replace(API_BASE, "")
        : product.productImage,
      optionKey,
      ...(hasOptions && {
        optionName: Object.keys(selectedOptions).join(", "),
        optionValue: Object.values(selectedOptions).join(", "),
      }),
    };

    addToCart(cartItem);
    setAddedMessage("Added to cart ✓");
    setTimeout(() => setAddedMessage(""), 1500);
  };

  // Styles (dark design 2)
  const colors = {
    bg: "#0b0e14",
    panel: "#12161f",
    line: "rgba(255,255,255,0.08)",
    text: "#e5e7eb",
    sub: "rgba(229,231,235,.7)",
    accent: "#29C5F6",
    price: "#f87171",
    chip: "rgba(255,255,255,.06)",
  };

  return (
    <section style={{ background: colors.bg, color: colors.text, minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: 1200, padding: "32px 16px" }}>
        {/* Breadcrumb / Back */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-sm"
            style={{
              border: `1px solid ${colors.line}`,
              color: colors.text,
              borderRadius: 10,
              background: "transparent",
            }}
          >
            ← Back
          </button>

          <div style={{ fontSize: 12, color: colors.sub }}>
            {categoryName}  /  Product #{product.productID}
          </div>
        </div>

        {/* Card */}
        <div
          className="row g-4"
          style={{
            background: colors.panel,
            borderRadius: 16,
            border: `1px solid ${colors.line}`,
            padding: 16,
            boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
          }}
        >
          {/* Left: Image with thumbs */}
          <div className="col-12 col-lg-6">
            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                border: `1px solid ${colors.line}`,
                background: "#0f1420",
              }}
            >
              <img
                src={selectedImage}
                alt={product.productTitle}
                className={imageFade ? "fade" : ""}
                style={{
                  width: "100%",
                  height: 480,
                  objectFit: "cover",
                  transition: "opacity .18s ease",
                  opacity: imageFade ? 0.6 : 1,
                  display: "block",
                }}
                onError={(e) => (e.currentTarget.src = "/placeholder.png")}
              />
            </div>

            {/* Thumbnails */}
            {thumbs.length > 1 && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {thumbs.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedPreview(null);
                      setImageFade(true);
                      setTimeout(() => {
                        setSelectedImage(t);
                        setImageFade(false);
                      }, 120);
                    }}
                    className="p-0"
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 10,
                      overflow: "hidden",
                      border: `2px solid ${
                        selectedImage === t ? colors.accent : colors.line
                      }`,
                      background: "#0f1420",
                    }}
                  >
                    <img
                      src={t}
                      alt="thumb"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="col-12 col-lg-6">
            <div
              className="mb-2"
              style={{
                fontSize: 11,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: colors.sub,
              }}
            >
              {categoryName}
            </div>

            <h1
              style={{
                fontSize: 28,
                lineHeight: 1.2,
                marginBottom: 8,
                color: "#fff",
              }}
            >
              {product.productTitle}
            </h1>

            {/* Price block */}
            <div className="d-flex align-items-end gap-3 mb-2">
              <div style={{ fontSize: 28, fontWeight: 700, color: colors.price }}>
                ${discountedPrice}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: colors.sub,
                  textDecoration: "line-through",
                }}
              >
                ${originalPrice.toFixed(2)}
              </div>
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: colors.chip,
                  border: `1px solid ${colors.line}`,
                  color: colors.text,
                }}
              >
                −{discount}%
              </span>
            </div>

            {/* Short description */}
            <p style={{ color: colors.sub, fontSize: 14 }}>
              {product.productDescription || "No description available."}
            </p>

            {/* Options */}
            {Object.keys(options).length > 0 && (
              <div className="mt-3">
                {Object.keys(options).map((optionName) => (
                  <div key={optionName} className="mb-2">
                    <div style={{ fontSize: 12, color: colors.sub, marginBottom: 6 }}>
                      {optionName}
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {/* Default */}
                      <button
                        className="btn btn-sm"
                        onClick={() =>
                          handleOptionChange(optionName, null, null, true)
                        }
                        style={{
                          borderRadius: 999,
                          border: `1px solid ${
                            !selectedOptions[optionName] ? colors.accent : colors.line
                          }`,
                          background: "transparent",
                          color: !selectedOptions[optionName] ? "#fff" : colors.text,
                          padding: "6px 12px",
                        }}
                      >
                        Default
                      </button>
                      {options[optionName].map((opt, idx) => (
                        <button
                          key={`${optionName}-${idx}`}
                          className="btn btn-sm"
                          onClick={() =>
                            handleOptionChange(
                              optionName,
                              opt.optionValue,
                              opt.preview
                            )
                          }
                          style={{
                            borderRadius: 999,
                            border: `1px solid ${
                              selectedOptions[optionName] === opt.optionValue
                                ? colors.accent
                                : colors.line
                            }`,
                            background: "transparent",
                            color:
                              selectedOptions[optionName] === opt.optionValue
                                ? "#fff"
                                : colors.text,
                            padding: "6px 12px",
                          }}
                        >
                          {opt.optionValue}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity + stock */}
            <div className="d-flex align-items-center gap-3 mt-3">
              <div style={{ fontSize: 14 }}>Qty</div>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1))
                  )
                }
                className="form-control"
                style={{
                  width: 80,
                  background: "#0f1420",
                  color: colors.text,
                  border: `1px solid ${colors.line}`,
                  borderRadius: 10,
                  height: 36,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: product.stock > 0 ? "#34d399" : "#ef4444",
                }}
              >
                {product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}
              </span>
            </div>

            {/* CTA */}
            <div className="mt-4 d-flex gap-2">
              <button
                className="btn"
                disabled={product.stock === 0}
                onClick={handleAddToCart}
                style={{
                  borderRadius: 12,
                  background: colors.accent,
                  color: "#fff",
                  padding: "12px 20px",
                  fontWeight: 700,
                  minWidth: 180,
                }}
              >
                Add to Cart
              </button>
              <button
                className="btn"
                onClick={() => navigate("/cart")}
                style={{
                  borderRadius: 12,
                  background: "transparent",
                  color: colors.text,
                  border: `1px solid ${colors.line}`,
                  padding: "12px 18px",
                }}
              >
                Go to Cart
              </button>
            </div>

            {addedMessage && (
              <div className="mt-2" style={{ color: "#34d399", fontSize: 12 }}>
                {addedMessage}
              </div>
            )}
          </div>
        </div>

        {/* Related / Recommended */}
        <div className="mt-5">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h3 style={{ color: "#fff", margin: 0 }}>You may also like</h3>
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

          {related.length === 0 ? (
            <div style={{ color: colors.sub }}>No recommendations available.</div>
          ) : (
            <div className="row g-3">
              {related.slice(0, 12).map((p) => {
                const pOriginal = parseFloat(p.listPrice) || 0;
                const pDisc = (pOriginal * (1 - discount / 100)).toFixed(2);
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
                      <div style={{ height: 180, overflow: "hidden", background: "#0f1420" }}>
                        <img
                          src={getFullUrl(p.productImage)}
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
                            ${pDisc}
                          </span>
                          <small style={{ color: colors.sub, textDecoration: "line-through" }}>
                            ${pOriginal.toFixed(2)}
                          </small>
                        </div>
                        <div className="mt-auto d-flex justify-content-end">
                          <button
                            className="btn btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart({
                                id: p.productID,
                                name: p.productTitle,
                                price: pOriginal,
                                qty: 1,
                                stock: p.stock || 10,
                                pic: p.productImage,
                                optionKey: "default",
                              });
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
        </div>
      </div>
    </section>
  );
}
