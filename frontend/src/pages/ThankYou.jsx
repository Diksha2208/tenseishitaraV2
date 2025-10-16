// in ThankYou.jsx
import { useLocation } from "react-router-dom";

export default function ThankYou() {
  const { state } = useLocation();
  const orderId = state?.orderId;
  const total = state?.total;
  return (
    <section className="container py-5">
      <h2>Order Confirmed. Thank you!</h2>
      {orderId && <p>Order ID: <strong>{orderId}</strong></p>}
      {total != null && <p>Total paid: ${total.toFixed(2)}</p>}
    </section>
  );
}
