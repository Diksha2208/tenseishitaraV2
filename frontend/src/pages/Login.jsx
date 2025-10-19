import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

// If you already set axios.defaults.baseURL in App, you can remove API.
const API =  process.env.REACT_APP_API_URL ;

export default function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        `${API}/api/auth/login`,
        { username, password },
        { withCredentials: true }
      );

      if (res.data?.user) {
        const user = res.data.user;
        setUser(user);

        const sessionCart = JSON.parse(sessionStorage.getItem("cart")) || [];
        if (sessionCart.length > 0) {
          await Promise.all(
            sessionCart.map((item) =>
              axios.post(
                `${API}/api/cart`,
                {
                  productID: item.productID,
                  quantity: item.quantity,
                  price: item.price,
                },
                { withCredentials: true }
              )
            )
          );
          sessionStorage.removeItem("cart");
        }

        if (remember) localStorage.setItem("user", JSON.stringify(user));

        if (user.isAdmin) {
          const adminRedirect =
            from.startsWith("/admin/") && from !== "/login"
              ? from
              : "/admin/dashboard";
          navigate(adminRedirect, { replace: true });
        } else {
          navigate(from !== "/login" ? from : "/", { replace: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    }
  };

  // palette to echo your Home dark theme (inline, not CSS)
  const colors = {
    bg: "#0b0e14",
    panel: "#12161f",
    line: "rgba(255,255,255,0.12)",
    text: "#e5e7eb",
    sub: "rgba(229,231,235,.75)",
    accent: "#00c4ff",
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
        style={{ color: colors.sub }}
        onClick={() => navigate("/")}
        aria-label="Close"
      >
        &times;
      </button>

      <div
        className="container"
        style={{ maxWidth: 1100 }}
      >
        <div
          className="row g-0 rounded-4 shadow-lg overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
            border: `1px solid ${colors.line}`,
          }}
        >
          {/* Right visual (on md+), stacked on top for mobile */}
          <div
            className="col-12 col-md-5 order-0 order-md-1"
            style={{
              backgroundImage:
                'linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.5)), url("/images/auth-right.jpg")',
              backgroundSize: "cover",
              backgroundPosition: "center",
              minHeight: 260,
              position: "relative",
            }}
          >
            <div className="h-100 w-100 d-flex flex-column align-items-center justify-content-center text-center p-4"
              style={{ color: "#eef2ff" }}
            >
              <h2 className="fw-bold mb-2">Start your anime shop</h2>
              <p className="mb-3" style={{ opacity: 0.9 }}>
                If you don’t have an account yet, join us and start your journey.
              </p>
              <Link
                to="/register"
                className="btn btn-outline-light rounded-pill px-4"
              >
                Register
              </Link>
            </div>
          </div>

          {/* Left form */}
          <div
            className="col-12 col-md-7 order-1 order-md-0"
            style={{ background: colors.panel }}
          >
            <div className="p-4 p-md-5 h-100 d-flex flex-column justify-content-center">
              <h2 className="fw-bold text-white mb-3">Login</h2>

              {error && (
                <div className="alert alert-danger py-2" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="mb-3">
                <div className="mb-3">
                  <label className="form-label text-white-50">Username</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-white-50">Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <label className="form-check-label text-white-50" htmlFor="remember">
                      Remember me
                    </label>
                  </div>
                  <Link to="/forgot-password" className="link-light text-decoration-underline">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="btn w-100 fw-bold py-2 rounded-4"
                  style={{
                    background: "linear-gradient(180deg, #19d3ff, #00b3e0)",
                    color: "#051018",
                    border: "1px solid rgba(255,255,255,.12)",
                  }}
                >
                  Login
                </button>
              </form>

              <div className="text-center">
                <div className="text-white-50 small mb-2">or use your account</div>
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

