import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

// If you already set axios.defaults.baseURL in App, you can drop API.
const API =  process.env.REACT_APP_API_URL || window.location.origin;

export default function Register() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState(""); // email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        `${API}/api/auth/register`,
        { firstname, lastname, username, password },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.user) {
        navigate("/login");
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  const colors = {
    bg: "#0b0e14",
    panel: "#12161f",
    line: "rgba(255,255,255,0.12)",
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background:
          `radial-gradient(1200px 800px at 10% -10%, rgba(0,196,255,.08), transparent 40%),
           radial-gradient(900px 700px at 90% 110%, rgba(99,102,241,.08), transparent 45%),
           ${colors.bg}`,
      }}
    >
      {/* Close (X) */}
      <button
        type="button"
        className="btn btn-link position-fixed top-0 end-0 fs-1 text-decoration-none"
        style={{ color: "rgba(229,231,235,.75)" }}
        onClick={() => navigate("/")}
        aria-label="Close"
      >
        &times;
      </button>

      <div className="container" style={{ maxWidth: 1100 }}>
        <div
          className="row g-0 rounded-4 shadow-lg overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
            border: `1px solid ${colors.line}`,
          }}
        >
          {/* Left promo (image) */}
          <div
            className="col-12 col-md-5"
            style={{
              backgroundImage:
                'linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.5)), url("/images/auth-right.jpg")',
              backgroundSize: "cover",
              backgroundPosition: "center",
              minHeight: 260,
            }}
          >
            <div className="h-100 w-100 d-flex flex-column align-items-center justify-content-center text-center p-4" style={{ color: "#eef2ff" }}>
              <h2 className="fw-bold mb-2">Hello, Friend</h2>
              <p className="mb-3" style={{ opacity: 0.9 }}>
                Already have an account? Log in and keep shopping.
              </p>
              <Link to="/login" className="btn btn-outline-light rounded-pill px-4">
                Login
              </Link>
            </div>
          </div>

          {/* Right form */}
          <div className="col-12 col-md-7" style={{ background: colors.panel }}>
            <div className="p-4 p-md-5 h-100 d-flex flex-column justify-content-center">
              <h2 className="fw-bold text-white mb-3">Register</h2>

              {error && (
                <div className="alert alert-danger py-2" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="mb-3">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-white-50">First name</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-light border-secondary"
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label text-white-50">Last name</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-light border-secondary"
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="form-label text-white-50">Email</label>
                  <input
                    type="email"
                    className="form-control bg-dark text-light border-secondary"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="mt-3">
                  <label className="form-label text-white-50">Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  className="btn w-100 fw-bold py-2 rounded-4 mt-4"
                  style={{
                    background: "linear-gradient(180deg, #19d3ff, #00b3e0)",
                    color: "#051018",
                    border: "1px solid rgba(255,255,255,.12)",
                  }}
                >
                  Create account
                </button>
              </form>

              <div className="text-center">
                <div className="text-white-50 small mb-2">or sign up with</div>
                <div className="d-flex justify-content-center gap-2">
                  <button className="btn btn-outline-secondary rounded-circle" style={{ width: 40, height: 40 }}>
                    F
                  </button>
                  <button className="btn btn-outline-secondary rounded-circle" style={{ width: 40, height: 40 }}>
                    G
                  </button>
                  <button className="btn btn-outline-secondary rounded-circle" style={{ width: 40, height: 40 }}>
                    in
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
