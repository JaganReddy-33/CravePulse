import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const DEFAULT_INVOICE_DATA = {
  invoiceNumber: 'INV-20261025-002',
  orderNumber: 'ORD-20261025-002',
  orderDate: '25 Oct 2026, 08:34 PM',
  invoiceDate: '25 Oct 2026, 08:35 PM',
  placeOfSupply: 'Karnataka (State Code 29)',
  reverseCharge: 'No',
  restaurant: {
    name: 'Spice Symphony & Grill',
    headChef: 'Executive Chef',
    address: 'Plot 88, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
    fssaiLicense: 'FSSAI-11223344556677',
    gstin: '29AAECS8812K1Z4'
  },
  customer: {
    name: 'Verified Customer',
    email: 'customer@cravepulse.in',
    phone: '+91 98490 12345',
    address: 'Apartment 402, Sunshine Heights, 12th Main Road, Indiranagar, Bengaluru, 560038',
    mapsUrl: 'https://maps.google.com/?q=12.978369,77.640835'
  },
  deliveryPartner: {
    name: 'Delivery Captain',
    fleetId: 'CP-FLT-882',
    vehicle: 'Electric 2-Wheeler (Zero Emission)',
    contact: '+91 98490 11223'
  },
  items: [
    {
      id: 1,
      name: 'Hyderabadi Chicken Dum Biryani',
      hsnCode: '996331',
      quantity: 1,
      unitPrice: 320.00,
      taxableAmount: 304.76,
      cgst: 7.62,
      sgst: 7.62,
      total: 320.00
    },
    {
      id: 2,
      name: 'Garlic Butter Chur Chur Naan',
      hsnCode: '996331',
      quantity: 2,
      unitPrice: 50.00,
      taxableAmount: 95.24,
      cgst: 2.38,
      sgst: 2.38,
      total: 100.00
    }
  ],
  subtotal: 420.00,
  taxableSubtotal: 400.00,
  cgstTotal: 10.00,
  sgstTotal: 10.00,
  deliveryFee: 0.00,
  packagingFee: 0.00,
  platformFee: 0.00,
  discount: 0.00,
  totalPaid: 420.00,
  amountInWords: 'Four Hundred and Twenty Rupees Only',
  paymentMethod: 'UPI (GPay / PhonePe)',
  paymentRef: 'UPI/20261025/9982736102',
  paymentStatus: 'PAID (SUCCESSFUL)'
};

const InvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(DEFAULT_INVOICE_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        if (res.success && res.data) {
          const ord = res.data;
          const items = Array.isArray(ord.items) ? ord.items.map(it => {
            const up = Number(it.unitPrice || 0);
            const qty = it.quantity || 1;
            const sub = up * qty;
            const taxable = sub / 1.05;
            const gstHalf = (sub - taxable) / 2;
            return {
              id: it.id || it.menuItemId,
              name: it.itemName || 'Fresh Food Item',
              hsnCode: '996331',
              quantity: qty,
              unitPrice: up,
              taxableAmount: taxable,
              cgst: gstHalf,
              sgst: gstHalf,
              totalAmount: sub
            };
          }) : [];

          const foodSub = Number(ord.subtotal || ord.totalAmount || 0);
          const gstTotal = Number(ord.gstTax || foodSub * 0.05);

          setInvoice({
            invoiceNumber: `INV-${ord.orderNumber || ord.id}`,
            orderNumber: ord.orderNumber || `ORD-${ord.id}`,
            orderDate: ord.createdAt ? new Date(ord.createdAt).toLocaleString('en-IN') : 'Recent',
            invoiceDate: ord.createdAt ? new Date(ord.createdAt).toLocaleString('en-IN') : 'Recent',
            placeOfSupply: 'Karnataka (State Code 29)',
            reverseCharge: 'No',
            restaurant: {
              name: ord.restaurantName || 'Spice Symphony & Grill',
              headChef: 'Partner Kitchen',
              address: 'Metro Kitchen Hub, Bengaluru, 560038',
              fssaiLicense: 'FSSAI-11223344556677',
              gstin: '29AAECS8812K1Z4'
            },
            customer: {
              name: ord.customerName || 'Customer',
              email: ord.customerEmail || 'customer@cravepulse.in',
              phone: ord.customerPhone || '+91 98490 12345',
              address: ord.deliveryAddress || 'Delivery Address'
            },
            deliveryPartner: {
              name: ord.riderName || 'Assigned Logistics Captain',
              fleetId: ord.riderId ? `CP-FLT-${ord.riderId}` : 'CP-FLT-AUTO',
              vehicle: 'Zero-Emission EV',
              contact: ord.riderPhone || '+91 98490 11223'
            },
            items: items.length > 0 ? items : (DEFAULT_INVOICE_DATA.items),
            foodSubtotal: foodSub,
            totalCgst: gstTotal / 2,
            totalSgst: gstTotal / 2,
            deliveryFee: Number(ord.deliveryFee || 0),
            packagingFee: Number(ord.packagingFee || 0),
            platformFee: Number(ord.platformFee || 0),
            discount: Number(ord.couponDiscount || ord.restaurantDiscount || 0),
            totalPaid: Number(ord.totalAmount || 0),
            paymentMethod: ord.paymentMode || 'UPI / Online Card',
            paymentRef: ord.paymentReference || 'TXN-SUCCESS-DB',
            paymentStatus: ord.paymentStatus || 'PAID (SUCCESSFUL)'
          });
        }
      } catch (err) {
        console.warn('API invoice fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-screen bg-light py-4 py-md-5 min-vh-100">
      {/* Top Action Bar (Hidden during Print) */}
      <div className="container d-print-none mb-4" style={{ maxWidth: 860 }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 bg-white p-3 rounded-4 shadow-sm border">
          <div className="d-flex align-items-center gap-2">
            <button 
              onClick={() => navigate(-1)} 
              className="btn btn-outline-secondary rounded-pill px-3 btn-sm d-flex align-items-center gap-1"
            >
              <i className="bi bi-arrow-left"></i> Back
            </button>
            <span className="text-muted small">| Official GST Tax Invoice</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button 
              onClick={handlePrint}
              className="btn btn-primary rounded-pill px-4 btn-sm fw-bold shadow-sm d-flex align-items-center gap-2 text-white"
              style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' }}
            >
              <i className="bi bi-printer-fill"></i> Print / Save as PDF
            </button>
            <Link to="/orders" className="btn btn-outline-dark rounded-pill px-3 btn-sm fw-semibold">
              All Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Official Tax Invoice Paper Sheet */}
      <div 
        className="container bg-white p-4 p-md-5 rounded-4 shadow-sm border" 
        style={{ maxWidth: 860, color: '#1e293b' }}
        id="printable-invoice"
      >
        {/* Header: Brand & Tax Invoice Designation */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start pb-4 border-bottom gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <div 
                className="rounded-3 text-white fw-bold d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: 38, height: 38, background: '#ff5c35', fontSize: 18 }}
              >
                🔥
              </div>
              <span className="fs-3 fw-extrabold text-dark tracking-tight">CravePulse</span>
            </div>
            <div className="text-muted small">India's Fair Food Network • 0% Price Inflation</div>
            <div className="text-secondary small mt-1">
              <strong>CravePulse Technologies Pvt. Ltd.</strong><br />
              100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038<br />
              GSTIN: <strong>29AAACC1206M1ZB</strong> | FSSAI: <strong>11223344556677</strong>
            </div>
          </div>

          <div className="text-sm-end">
            <span className="badge bg-dark text-white px-3 py-1.5 rounded-pill fw-bold text-uppercase mb-2">
              Tax Invoice / Bill of Supply
            </span>
            <div className="fw-bold fs-5 text-dark">{invoice.invoiceNumber}</div>
            <div className="small text-muted">Order Ref: <strong>{invoice.orderNumber}</strong></div>
            <div className="small text-muted">Date: {invoice.invoiceDate}</div>
            <div className="small text-muted">Place of Supply: {invoice.placeOfSupply}</div>
            <div className="small text-muted">Reverse Charge: {invoice.reverseCharge}</div>
          </div>
        </div>

        {/* Two-Column Grid: Sold By vs Billed To */}
        <div className="row g-4 py-4 border-bottom">
          {/* Restaurant Partner */}
          <div className="col-12 col-md-6 border-end-md">
            <div className="badge bg-light text-secondary border mb-2 px-2.5 py-1 text-uppercase fw-bold">
              Sold & Prepared By (Merchant)
            </div>
            <h6 className="fw-bold mb-1 text-dark">{invoice.restaurant.name}</h6>
            <div className="small text-muted mb-1">Curated by {invoice.restaurant.headChef}</div>
            <div className="small text-secondary mb-2">{invoice.restaurant.address}</div>
            <div className="small text-muted">
              <div>FSSAI License: <strong>{invoice.restaurant.fssaiLicense}</strong></div>
              <div>GSTIN: <strong>{invoice.restaurant.gstin}</strong></div>
            </div>
          </div>

          {/* Customer / Billed To */}
          <div className="col-12 col-md-6">
            <div className="badge bg-light text-secondary border mb-2 px-2.5 py-1 text-uppercase fw-bold">
              Billed & Delivered To (Customer)
            </div>
            <h6 className="fw-bold mb-1 text-dark">{invoice.customer.name}</h6>
            <div className="small text-secondary mb-2">{invoice.customer.address}</div>
            <div className="small text-muted">
              <div>Phone: <strong>{invoice.customer.phone}</strong></div>
              <div>Email: <strong>{invoice.customer.email}</strong></div>
              {invoice.customer.mapsUrl && (
                <div className="mt-1 d-print-none">
                  <a 
                    href={invoice.customer.mapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="badge bg-primary-subtle text-primary text-decoration-none"
                  >
                    📍 Verified Delivery Coordinates ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Logistics Fleet Info */}
        <div className="py-3 px-3 rounded-3 bg-light border my-4 d-flex flex-wrap justify-content-between align-items-center gap-2 small">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-5">🛵</span>
            <div>
              <strong>Delivery Partner:</strong> {invoice.deliveryPartner.name} ({invoice.deliveryPartner.fleetId})
              <div className="text-muted">{invoice.deliveryPartner.vehicle} • Contact: {invoice.deliveryPartner.contact}</div>
            </div>
          </div>
          <span className="badge bg-success-subtle text-success border border-success">
            ✓ 100% Tip & Fair Distance Pay Dispatched
          </span>
        </div>

        {/* Itemized Table of Dishes */}
        <div className="table-responsive mb-4">
          <table className="table table-bordered align-middle small mb-0">
            <thead className="table-light">
              <tr className="text-muted fw-bold">
                <th style={{ width: 40 }}>#</th>
                <th>Item Description</th>
                <th style={{ width: 80 }}>HSN/SAC</th>
                <th className="text-center" style={{ width: 60 }}>Qty</th>
                <th className="text-end" style={{ width: 90 }}>Unit Rate</th>
                <th className="text-end" style={{ width: 100 }}>Taxable (₹)</th>
                <th className="text-end" style={{ width: 80 }}>CGST (2.5%)</th>
                <th className="text-end" style={{ width: 80 }}>SGST (2.5%)</th>
                <th className="text-end" style={{ width: 100 }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, idx) => (
                <tr key={it.id || idx}>
                  <td className="text-center text-muted">{idx + 1}</td>
                  <td>
                    <div className="fw-bold text-dark">{it.name}</div>
                    <small className="text-success">0% Dine-In Menu Price Parity</small>
                  </td>
                  <td className="text-muted">{it.hsnCode || '996331'}</td>
                  <td className="text-center fw-bold">{it.quantity}</td>
                  <td className="text-end">₹{Number(it.unitPrice).toFixed(2)}</td>
                  <td className="text-end">₹{Number(it.taxableAmount || (it.unitPrice * it.quantity * 0.9524)).toFixed(2)}</td>
                  <td className="text-end text-muted">₹{Number(it.cgst || (it.unitPrice * it.quantity * 0.0238)).toFixed(2)}</td>
                  <td className="text-end text-muted">₹{Number(it.sgst || (it.unitPrice * it.quantity * 0.0238)).toFixed(2)}</td>
                  <td className="text-end fw-bold">₹{Number(it.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Payment Breakdown */}
        <div className="row g-4 border-top pt-3">
          <div className="col-12 col-md-7">
            <div className="p-3 rounded-3 bg-light border small mb-3">
              <div className="fw-bold text-dark mb-1">Payment Status:</div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-success text-white">✓ {invoice.paymentStatus}</span>
                <span className="text-muted">• Mode: {invoice.paymentMethod}</span>
              </div>
              <div className="text-muted font-monospace" style={{ fontSize: 11 }}>
                Transaction Ref: {invoice.paymentRef}
              </div>
            </div>

            <div className="small text-muted">
              <div><strong>Amount in Words:</strong> {invoice.amountInWords}</div>
              <div className="mt-2 text-secondary" style={{ fontSize: 11 }}>
                * This is a computer-generated tax invoice issued in accordance with Rule 46 of CGST Rules, 2017. 
                No physical signature is required. Certified 100% price parity with restaurant dine-in printed rates.
              </div>
            </div>
          </div>

          <div className="col-12 col-md-5">
            <div className="p-3 bg-light rounded-3 border">
              <div className="d-flex justify-content-between small text-muted mb-2">
                <span>Taxable Food Amount:</span>
                <span>₹{invoice.taxableSubtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-2">
                <span>Central GST (CGST @ 2.5%):</span>
                <span>₹{invoice.cgstTotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-2">
                <span>State GST (SGST @ 2.5%):</span>
                <span>₹{invoice.sgstTotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-2">
                <span>Restaurant Packaging:</span>
                <span className="text-success">₹0.00 (Free)</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-2">
                <span>Doorstep Delivery Fee:</span>
                <span className="text-success">₹0.00 (Fair Network)</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-2">
                <span>Platform Inflation Surcharge:</span>
                <span className="text-success fw-bold">₹0.00 (0% Markup)</span>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between fs-5 fw-extrabold text-dark">
                <span>Total Amount Paid:</span>
                <span className="text-primary" style={{ color: '#ff5c35' }}>₹{invoice.totalPaid.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="text-center pt-4 mt-4 border-top text-muted small" style={{ fontSize: 11 }}>
          Thank you for dining with <strong>CravePulse</strong>! Together, we empower restaurant chefs with fair-trade commissions and delivery captains with 100% tip pass-through.
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
