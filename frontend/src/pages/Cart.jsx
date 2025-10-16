import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =  process.env.REACT_APP_API_URL || window.location.origin;

function getImageUrl(filename) {
  if (!filename) return "/placeholder.png";
  if (typeof filename === "string" && filename.startsWith("http")) return filename;
  return `${API_BASE}${filename.startsWith("/uploads/") ? filename : `/uploads/${filename}`}`;
}

function makeItemKey(item) {
  const pid = item.id ?? item.productID ?? item.productId ?? item.productid ?? item.productID;
  const optionName = item.optionName ?? "default";
  const optionValue = item.optionValue ?? "default";
  return `${pid}-${optionName}-${optionValue}`;
}

export default function Cart({
  initialCart = [],
  setCart = () => {},
  userLoggedIn = false,
  siteDiscount = 0,
}) {
  const navigate = useNavigate();
  const [cart, updateCart] = useState([]);
  const [error, setError] = useState("");
  const [totals, setTotals] = useState({
    original: 0,
    discounted: 0,
    discountAmount: 0,
    tax: 0,
    total: 0,
  });
  const [suggested, setSuggested] = useState([]);
  const TAX_RATE = 0.12;
  const SHIPPING = 0;

  useEffect(() => {
    const normalized = initialCart.map((it) => {
      const item = { ...it };
      item.price = typeof item.price === "string" ? parseFloat(item.price) || 0 : item.price ?? 0;
      item.qty = Number.isFinite(item.qty) ? item.qty : parseInt(item.qty) || 1;
      item.id = item.id ?? item.productID ?? item.productId;
      item.stock = item.stock ?? 9999;
      item.key = item.key ?? makeItemKey(item);
      return item;
    });
    updateCart(normalized);
  }, [initialCart]);

  useEffect(() => {
    fetch(`${API_BASE}/api/products`)
      .then((r) => r.json())
      .then((data) => setSuggested((data || []).slice(0, 10)))
      .catch(() => setSuggested([]));
  }, []);

  useEffect(() => {
    let original = 0;
    let discounted = 0;
    for (const item of cart) {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      const disc = price * (1 - (Number(siteDiscount) || 0) / 100);
      original += price * qty;
      discounted += disc * qty;
    }
    const discountAmount = original - discounted;
    const tax = (discounted + SHIPPING) * TAX_RATE;
    const total = discounted + SHIPPING + tax;
    setTotals({ original, discounted, discountAmount, tax, total });
  }, [cart, siteDiscount]);

  const handleRemove = (key) => {
    setCart((prev) => {
      const updated = prev.filter((it) => (it.key ?? makeItemKey(it)) !== key);
      updateCart(updated);
      return updated;
    });
  };

  const handleQty = (key, next) => {
    setCart((prev) => {
      const updated = prev.map((it) => {
        const itKey = it.key ?? makeItemKey(it);
        if (itKey === key) {
          const clamped = Math.max(1, Math.min(it.stock ?? 9999, next));
          return { ...it, qty: clamped, key: it.key ?? itKey };
        }
        return it;
      });
      updateCart(updated);
      return updated;
    });
  };

  const handleCheckout = () => {
    if (!userLoggedIn) {
      setError("You have to log in to process your transaction");
      return;
    }
    navigate("/checkout");
  };

  if (!cart || cart.length === 0) {
    return (
      <section
        className="cart-section text-center"
        style={{ background: "#0b0e14", color: "#e5e7eb", padding: "4rem 1rem" }}
      >
        <h2 style={{ fontSize: 40, fontWeight: 700, color: "#fff" }}>
          Your <span style={{ color: "#29C5F6" }}>Cart</span> is empty
        </h2>
        <button
          className="btn mt-4"
          onClick={() => navigate("/")}
          style={{
            borderRadius: 16,
            background: "#fff",
            color: "#0b0e14",
            fontWeight: 600,
            padding: "10px 18px",
          }}
        >
          Shop Now
        </button>
      </section>
    );
  }

  return (
    <section
      className="cart-section"
      style={{
        background: "#0b0e14",
        color: "#e5e7eb",
        minHeight: "100vh",
        padding: "3rem 1rem",
      }}
    >
      <div className="container" style={{ maxWidth: 1200 }}>
        {/* Title */}
        <h2
          style={{
            fontWeight: 700,
            fontSize: 48,
            color: "#fff",
            marginBottom: 30,
            textAlign: "center",
          }}
        >
          My Shopping Cart
        </h2>

        {error && (
          <div
            className="alert alert-danger text-center"
            style={{ background: "#dc2626", color: "#fff" }}
          >
            {error}
          </div>
        )}

        {/* Main layout */}
        <div className="d-flex flex-column flex-lg-row gap-4 justify-content-between">
          {/* Left: Items */}
          <div className="flex-grow-1">
            {cart.map((item, idx) => {
              const key = item.key ?? makeItemKey(item);
              const price = Number(item.price) || 0;
              const discPrice = price * (1 - (Number(siteDiscount) || 0) / 100);
              const totalPrice = discPrice * (Number(item.qty) || 0);

              return (
                <div
                  key={key}
                  className="d-flex align-items-center"
                  style={{
                    background: "#12161f",
                    borderRadius: 12,
                    padding: "1rem",
                    marginBottom: "1rem",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {/* Image */}
                  <img
                    src={getImageUrl(item.pic)}
                    alt={item.name}
                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                    style={{
                      width: 90,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 8,
                      marginRight: 16,
                    }}
                  />

                  {/* Product Info */}
                  <div className="flex-grow-1">
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{item.name}</div>
                    {item.optionName && (item.optionValue || item.optionValue === "") && (
                      <div style={{ fontSize: 13, color: "#9ca3af" }}>
                        {item.optionName}: {item.optionValue}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 14,
                        marginTop: 6,
                        color: "#9ca3af",
                      }}
                    >
                      <span style={{ color: "#fbbf24", fontWeight: 700 }}>
                        ${discPrice.toFixed(2)}
                      </span>{" "}
                      <del>${price.toFixed(2)}</del> | Total: $
                      {totalPrice.toFixed(2)}
                    </div>
                  </div>

                  {/* Qty stepper */}
                  <div
                    className="d-flex align-items-center"
                    style={{ gap: 8, marginRight: 12 }}
                  >
                    <button
                      className="btn btn-sm"
                      style={{
                        background: "#1f2937",
                        color: "#e5e7eb",
                        borderRadius: 8,
                      }}
                      onClick={() => handleQty(key, (item.qty || 1) - 1)}
                      disabled={(item.qty || 1) <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.qty}
                      min="1"
                      max={item.stock}
                      onChange={(e) =>
                        handleQty(key, parseInt(e.target.value, 10) || 1)
                      }
                      style={{
                        width: 55,
                        textAlign: "center",
                        background: "#0b0e14",
                        color: "#e5e7eb",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 8,
                        height: 36,
                      }}
                    />
                    <button
                      className="btn btn-sm"
                      style={{
                        background: "#1f2937",
                        color: "#e5e7eb",
                        borderRadius: 8,
                      }}
                      onClick={() => handleQty(key, (item.qty || 1) + 1)}
                    >
                      +
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                     class="btn btn-danger"
                    onClick={() => handleRemove(key)}
                    // style={{
                    //   background: "rgba(239,68,68,0.2)",
                    //   color: "#ef4444",
                    //   borderRadius: "50%",
                    //   width: 36,
                    //   height: 36,
                    //   fontSize: 18,
                    // }}
                  >
                    X
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Order Summary */}
          <div
            className="p-4"
            style={{
              background: "#12161f",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              minWidth: 320,
              height: "fit-content",
            }}
          >
            <h4
              style={{
                fontWeight: 700,
                color: "#29C5F6",
                textTransform: "uppercase",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              Order Summary
            </h4>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 15,
                marginBottom: 8,
              }}
            >
              <span>Subtotal:</span>
              <strong>${totals.discounted.toFixed(2)}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 15,
                marginBottom: 8,
              }}
            >
              <span>Shipping:</span>
              <strong>${SHIPPING.toFixed(2)}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 15,
                marginBottom: 8,
              }}
            >
              <span>Discount:</span>
              <strong style={{ color: "#ef4444" }}>
                -${totals.discountAmount.toFixed(2)}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 15,
                marginBottom: 8,
              }}
            >
              <span>Tax (12%):</span>
              <strong>${totals.tax.toFixed(2)}</strong>
            </div>
            <hr style={{ borderColor: "rgba(255,255,255,0.15)" }} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              <span>Total:</span>
              <strong>${totals.total.toFixed(2)}</strong>
            </div>

            <button
              className="btn w-100"
              style={{
                background: "#29C5F6",
                color: "#fff",
                fontWeight: 600,
                borderRadius: 12,
                padding: "10px 0",
              }}
              onClick={handleCheckout}
            >
              Checkout
            </button>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-5">
          <h3
            style={{
              color: "#fff",
              fontWeight: 700,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            You May Also Like
          </h3>
          <div
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            {suggested.map((p) => (
              <div
                key={p.productID}
                style={{
                  minWidth: 180,
                  background: "#12161f",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <img
                  src={getImageUrl(p.productImage)}
                  alt={p.productTitle}
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                  onClick={() => navigate(`/product/${p.productID}`)}
                />
                <div
                  className="small text-truncate"
                  style={{ color: "#e5e7eb", fontSize: 14 }}
                >
                  {p.productTitle}
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span style={{ color: "#fbbf24", fontWeight: 600 }}>
                    $
                    {(
                      p.listPrice *
                      (1 - (Number(siteDiscount) || 0) / 100)
                    ).toFixed(2)}
                  </span>
                  <button
                    className="btn btn-sm"
                    style={{
                      background: "#29C5F6",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "4px 10px",
                    }}
                    onClick={() => navigate(`/product/${p.productID}`)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
