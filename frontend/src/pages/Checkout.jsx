import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE =  process.env.REACT_APP_API_URL || window.location.origin;

export default function Checkout({ cart = [], user, setCart }) {
  const navigate = useNavigate();
  console.log(user);

  // ---- Addresses ----
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressID, setSelectedAddressID] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addrError, setAddrError] = useState("");

  // Add-address form (inline)
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({
    fullName: "",
    country: "",
    address: "",
    unit: "",
    city: "",
    state: "",
    zipCode: "",
    phoneNum: "",
    is_primary: 0,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // ---- Totals (display only; server recomputes) ----
  const TAX_RATE = 0.12;
  const subTotal = useMemo(
    () =>
      cart.reduce(
        (s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1),
        0
      ),
    [cart]
  );
  const tax = useMemo(() => subTotal * TAX_RATE, [subTotal]);
  const total = useMemo(() => subTotal + tax, [subTotal, tax]);

  // ---- Place order state ----
  const [placing, setPlacing] = useState(false);

  // Axios defaults
  useEffect(() => {
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = API_BASE;
  }, []);

  // Load saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) {
        setLoadingAddresses(false);
        return;
      }
      try {
        setLoadingAddresses(true);
        const { data } = await axios.get("/api/addresses");
        setAddresses(data || []);
        const primary = (data || []).find((a) => a.is_primary === 1);
        setSelectedAddressID(primary?.addressID ?? data?.[0]?.addressID ?? null);
      } catch (err) {
        setAddrError(
          err.response?.data?.message ||
            "Failed to load addresses. Please try again."
        );
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, [user]);

  const onAddrFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddrForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const addNewAddress = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to add an address.");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    try {
      setSavingAddress(true);
      setAddrError("");

      // POST /api/addresses (your routes expect exactly these fields)
      const { data } = await axios.post("/api/addresses", addrForm);
      const newId = data?.addressID;

      // refresh list
      const res2 = await axios.get("/api/addresses");
      setAddresses(res2.data || []);
      setSelectedAddressID(newId ?? res2.data?.[0]?.addressID ?? null);
      setShowAddAddress(false);

      // reset form
      setAddrForm({
        fullName: "",
        country: "",
        address: "",
        unit: "",
        city: "",
        state: "",
        zipCode: "",
        phoneNum: "",
        is_primary: 0,
      });
    } catch (err) {
      setAddrError(
        err.response?.data?.message || "Failed to save address. Please retry."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const imageUrl = (pic) => {
    if (!pic) return "/images/placeholder.png";
    if (typeof pic === "string" && pic.startsWith("http")) return pic;
    const path = pic.startsWith("/uploads/") ? pic : `/uploads/${pic}`;
    return `${API_BASE}${path}`;
  };

  const placeOrder = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Please login to continue checkout.");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    if (!selectedAddressID) {
      alert("Please select a shipping address.");
      return;
    }

    try {
      setPlacing(true);

      const payload = {
        userID: user.userID, // per your new order.js (no auth middleware)
        addressID: selectedAddressID,
        items: cart.map((it) => ({
          productID: it.id ?? it.productID ?? null,
          name: it.name,
          price: Number(it.price) || 0,
          quantity: Number(it.qty) || 1,
        })),
      };

      const res = await axios.post("/api/orders", payload);

      // success: clear cart and redirect to Thank You
      if (res.data?.orderID) {
        const orderId = res.data.orderID;

        // clear cart (local + state)
        localStorage.removeItem("cart");
        sessionStorage.removeItem("cart");
        setCart?.([]);

        // go to thank you page immediately
        navigate("/thankyou", {
          replace: true,
          state: { orderId, total: Number(total.toFixed(2)) },
        });
        return;
      }

      alert("Something went wrong placing the order.");
    } catch (err) {
      console.error("❌ Order error:", err);
      alert(err.response?.data?.message || "Failed to place order.");
    } finally {
      setPlacing(false);
    }
  };

  // Empty cart view
  if (!cart?.length) {
    return (
      <section
        className="min-vh-100 d-flex flex-column align-items-center justify-content-center text-center"
        style={{ background: "#0b0e14", color: "#e5e7eb" }}
      >
        <h3 className="fw-bold">Your cart is empty</h3>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
          Go Shopping
        </button>
      </section>
    );
  }

  const panel = "#12161f";
  const line = "rgba(255,255,255,0.12)";

  return (
    <div className="min-vh-100" style={{ background: "#0b0e14" }}>
      <div className="container py-5">
        {/* Header */}
        <div className="text-center mb-4" style={{ color: "#e5e7eb" }}>
          <h2 className="fw-bold mb-1">Checkout</h2>
          <p className="mb-0 text-white-50">
            Choose a shipping address and place your order.
          </p>
        </div>

        <div className="row g-4">
          {/* LEFT: Addresses + Add Address */}
          <div className="col-12 col-lg-7">
            <div
              className="rounded-4 shadow-lg mb-4"
              style={{ background: panel, border: `1px solid ${line}` }}
            >
              <div
                className="p-3 p-md-4 border-bottom d-flex justify-content-between align-items-center"
                style={{ borderColor: line }}
              >
                <h5 className="mb-0 text-white">Shipping Address</h5>
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={() => setShowAddAddress((s) => !s)}
                >
                  {showAddAddress ? "Cancel" : "Add Address"}
                </button>
              </div>

              <div className="p-3 p-md-4">
                {loadingAddresses ? (
                  <div className="text-white-50">Loading addresses…</div>
                ) : addresses.length === 0 ? (
                  <div className="text-white-50">
                    No saved addresses yet.
                    {!showAddAddress && (
                      <div className="mt-3">
                        <button
                          className="btn btn-outline-light btn-sm"
                          onClick={() => setShowAddAddress(true)}
                        >
                          Add your first address
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="list-group">
                    {addresses.map((a) => (
                      <label
                        key={a.addressID}
                        className="list-group-item list-group-item-action d-flex gap-3 align-items-start"
                        style={{
                          background: "transparent",
                          borderColor: line,
                          color: "#e5e7eb",
                        }}
                      >
                        <input
                          type="radio"
                          name="address"
                          className="form-check-input mt-1"
                          checked={selectedAddressID === a.addressID}
                          onChange={() => setSelectedAddressID(a.addressID)}
                        />
                        <div className="flex-grow-1">
                          <div className="fw-semibold">
                            {a.fullName}{" "}
                            {a.is_primary === 1 && (
                              <span className="badge text-bg-primary ms-2">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="small text-white-50">
                            {a.address}
                            {a.unit ? `, ${a.unit}` : ""}
                            <br />
                            {a.city}, {a.state} {a.zipCode}, {a.country}
                            <br />
                            {a.phoneNum}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {addrError && (
                  <div className="alert alert-danger mt-3">{addrError}</div>
                )}
              </div>
            </div>

            {/* Inline Add Address */}
            {showAddAddress && (
              <form
                className="rounded-4 shadow-lg"
                style={{ background: panel, border: `1px solid ${line}` }}
                onSubmit={addNewAddress}
              >
                <div
                  className="p-3 p-md-4 border-bottom"
                  style={{ borderColor: line }}
                >
                  <h5 className="mb-0 text-white">Add New Address</h5>
                </div>

                <div className="p-3 p-md-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-white-50">Full Name</label>
                      <input
                        name="fullName"
                        className="form-control bg-dark text-light border-secondary"
                        value={addrForm.fullName}
                        onChange={onAddrFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-white-50">Country</label>
                      <input
                        name="country"
                        className="form-control bg-dark text-light border-secondary"
                        value={addrForm.country}
                        onChange={onAddrFormChange}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label text-white-50">Address</label>
                      <input
                        name="address"
                        className="form-control bg-dark text-light border-secondary"
                        value={addrForm.address}
                        onChange={onAddrFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-white-50">Unit</label>
                      <input
                        name="unit"
                        className="form-control bg-dark text-light border-secondary"
                        value={addrForm.unit}
                        onChange={onAddrFormChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-white-50">City</label>
                      <input
                        name="city"
                        className="form-control bg-dark text-light border-secondary"
                        value={addrForm.city}
                        onChange={onAddrFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-white-50">State</label>
                      <input
                        name="state"
                        className="form-control bg-dark text-light border-secondary"
                        value={addrForm.state}
                        onChange={onAddrFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-white-50">Zip Code</label>
                      <input
                        name="zipCode"
                        className="form-control bg-dark text-light border-secondary"
                        value={addrForm.zipCode}
                        onChange={onAddrFormChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-white-50">Phone</label>
                      <input
                        name="phoneNum"
                        className="form-control bg-dark text-light border-secondary"
                        value={addrForm.phoneNum}
                        onChange={onAddrFormChange}
                        required
                      />
                    </div>
                    <div className="col-12 form-check mt-2">
                      <input
                        id="primary"
                        type="checkbox"
                        className="form-check-input"
                        name="is_primary"
                        checked={!!addrForm.is_primary}
                        onChange={onAddrFormChange}
                      />
                      <label htmlFor="primary" className="form-check-label text-white-50">
                        Set as primary
                      </label>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-light"
                      onClick={() => setShowAddAddress(false)}
                      disabled={savingAddress}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={savingAddress}
                    >
                      {savingAddress ? "Saving…" : "Save Address"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Place Order button (duplicate at bottom for mobile) */}
            <div className="d-lg-none mt-3">
              <button
                className="btn btn-success w-100"
                onClick={placeOrder}
                disabled={placing || !selectedAddressID}
              >
                {placing ? "Placing..." : "Place Order"}
              </button>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="col-12 col-lg-5">
            <div
              className="rounded-4 shadow-lg"
              style={{
                background: panel,
                border: `1px solid ${line}`,
                position: "sticky",
                top: 24,
              }}
            >
              <div
                className="p-3 p-md-4 border-bottom"
                style={{ borderColor: line }}
              >
                <h5 className="mb-0 text-white">Order Summary</h5>
              </div>

              <div className="p-3 p-md-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="d-flex align-items-center mb-3">
                    <img
                      src={imageUrl(item.pic)}
                      alt={item.name}
                      className="rounded me-3 border"
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderColor: line,
                      }}
                      onError={(e) =>
                        (e.currentTarget.src = "/images/placeholder.png")
                      }
                    />
                    <div className="flex-grow-1">
                      <div className="text-white fw-semibold small text-truncate">
                        {item.name}
                      </div>
                      <div className="text-white-50 small">Qty: {item.qty}</div>
                    </div>
                    <div className="text-white fw-semibold">
                      ${(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                ))}

                <hr className="border-secondary" />

                <div className="d-flex justify-content-between text-white-50">
                  <span>Subtotal</span>
                  <span>${subTotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-white-50">
                  <span>Tax (12%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <span className="text-white fw-bold">Total</span>
                  <span className="text-white fs-5 fw-bold">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <button
                  className="btn btn-success w-100 mt-3"
                  onClick={placeOrder}
                  disabled={placing || !selectedAddressID}
                >
                  {placing ? "Placing..." : "Place Order"}
                </button>
                <button
                  className="btn btn-outline-light w-100 mt-2"
                  onClick={() => navigate("/cart")}
                >
                  Back to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
