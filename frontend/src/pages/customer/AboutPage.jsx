import React from "react";
import { Link } from "react-router-dom";
export default function AboutPage() {
  return (
    <section className="container py-5" style={{ maxWidth: 1100 }}>
      <div className="mb-5" style={{ maxWidth: 760 }}>
        <span className="badge bg-light text-dark border mb-3">CravePulse</span>
        <h1 className="display-5 fw-bold">Good food. Clear choices.</h1>
        <p className="lead text-muted">
          Discover restaurant menus, see your order breakdown and follow your
          delivery in one place.
        </p>
      </div>
      <div className="row g-4 mb-5">
        {[
          [
            "Menus from real kitchens",
            "Browse the dishes, availability and prices maintained by restaurant partners.",
          ],
          [
            "A clear bill",
            "Review food, packaging, delivery, taxes and optional tips before placing an order.",
          ],
          [
            "Follow your order",
            "See recorded kitchen updates and delivery information as your order progresses.",
          ],
        ].map(([title, text]) => (
          <div className="col-12 col-md-4" key={title}>
            <div className="card p-4 h-100">
              <h2 className="h5">{title}</h2>
              <p className="text-muted mb-0">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-4 p-4 p-md-5 bg-white border">
        <h2 className="h3">Find something you love</h2>
        <div className="d-flex flex-wrap gap-3 mt-3">
          <Link to="/" className="btn btn-primary">
            Explore restaurants
          </Link>
          <Link to="/partner/register" className="btn btn-outline-primary">
            Register a kitchen
          </Link>
        </div>
      </div>
    </section>
  );
}
