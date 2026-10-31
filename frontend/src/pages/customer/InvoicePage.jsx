import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
const money = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(v || 0),
  );
export default function InvoicePage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const orderEndpoint = /^\d+$/.test(id)
      ? `/orders/${id}`
      : `/orders/number/${encodeURIComponent(id)}`;
    api
      .get(orderEndpoint)
      .then((res) => {
        if (!res.success || !res.data) throw new Error("Receipt unavailable");
        if (active) setOrder(res.data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error)
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link to="/orders">Back to orders</Link>
      </div>
    );
  if (!order)
    return (
      <p className="container py-5" role="status">
        Loading receipt...
      </p>
    );
  return (
    <article className="container py-4" style={{ maxWidth: 880 }}>
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4 d-print-none">
        <Link to="/orders" className="btn btn-outline-secondary">
          Back to orders
        </Link>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Print receipt
        </button>
      </div>
      <div className="card p-4 p-md-5">
        <h1 className="h3 fw-bold">Order receipt</h1>
        <p>
          {order.orderNumber} ? Payment: {order.paymentStatus || "PENDING"}
        </p>
        <p>
          <strong>{order.restaurantName}</strong>
          <br />
          {order.customerName}
          <br />
          {order.deliveryAddressText || order.deliveryAddress || ""}
        </p>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th className="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, i) => (
                <tr key={item.id || i}>
                  <td>{item.itemName || item.name}</td>
                  <td>{item.quantity}</td>
                  <td className="text-end">
                    {money(
                      item.lineTotal ??
                        item.totalPrice ??
                        Number(item.unitPrice || 0) * item.quantity,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="row">
          {[
            ["Subtotal", order.subtotal],
            ["Packaging", order.packagingFee],
            ["Delivery", order.deliveryFee],
            ["Platform fee", order.platformFee],
            ["Tax", order.gstTax],
            ["Coupon discount", -Number(order.couponDiscount || 0)],
            ["Tip", order.tipAmount],
            ["Order total", order.totalAmount],
          ].map(([label, value]) => (
            <React.Fragment key={label}>
              <dt className="col-7 py-1">{label}</dt>
              <dd className="col-5 text-end py-1 mb-0">{money(value)}</dd>
            </React.Fragment>
          ))}
        </dl>
        <p className="small text-muted mb-0">
          Payment method: {order.paymentMode}. This receipt shows recorded order
          amounts. Request the restaurant's tax invoice when required.
        </p>
      </div>
    </article>
  );
}
