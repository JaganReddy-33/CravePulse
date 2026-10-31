import ChangePassword from "../../components/ChangePassword";
import React, { useState, useEffect } from "react";
import api from "../../services/api";

const AdminSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [editValues, setEditValues] = useState({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/settings");
      if (res.success && Array.isArray(res.data)) {
        setSettings(res.data);
        const map = {};
        res.data.forEach((s) => {
          map[s.configKey] = s.configValue;
        });
        setEditValues(map);
      }
    } catch (e) {
      console.error("Error fetching settings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSetting = async (key, description) => {
    setSavingKey(key);
    try {
      const res = await api.post("/admin/settings", {
        key,
        value: editValues[key],
        description,
      });
      if (res.success) {
        setSettings((prev) =>
          prev.map((s) =>
            s.configKey === key ? { ...s, configValue: editValues[key] } : s,
          ),
        );
      }
    } catch (e) {
      alert(e.message || "Error updating setting");
    } finally {
      setSavingKey(null);
    }
  };

  const getSettingLabel = (key) => {
    switch (key) {
      case "platform_commission_percent":
        return "Restaurant Commission Rate (%)";
      case "platform_convenience_fee":
        return "Platform Convenience Fee (₹)";
      case "base_delivery_fee":
        return "Base Delivery Fee (₹)";
      case "per_km_delivery_fee":
        return "Per Kilometer Delivery Fee (₹/km)";
      case "gst_percent":
        return "GST Tax Rate (%)";
      case "max_delivery_radius_km":
        return "Max Delivery Radius (km)";
      case "surge_multiplier":
        return "Dynamic Pricing Surge Multiplier";
      case "cod_order_limit":
        return "Maximum Cash on Delivery Order Limit (₹)";
      case "dispute_auto_refund_cap":
        return "Instant Dispute Auto-Refund Cap (₹)";
      case "dispute_window_hours":
        return "Dispute Auto-Approval Window (hours post-delivery)";
      case "goodwill_delay_minutes":
        return "Goodwill Delay Threshold (minutes)";
      case "goodwill_credit_amount":
        return "Goodwill Compensation Credit (₹)";
      case "rider_wait_fee_per_min":
        return "Rider Kitchen Wait Pay (₹/min)";
      default:
        return key.replace(/_/g, " ").toUpperCase();
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-extrabold mb-1 text-white">
            Platform Operational Configuration
          </h4>
          <p className="text-muted small mb-0">
            Fine-tune dynamic fee structures, delivery zones, GST taxes, surge
            pricing, and refund safety bounds.
          </p>
        </div>
        <button
          className="btn btn-outline-info rounded-pill px-3 btn-sm"
          onClick={fetchSettings}
        >
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Settings
        </button>
      </div>

      <div
        className="card border-0 rounded-4 shadow-sm p-4 text-white"
        style={{ background: "#162032", border: "1px solid #1f293d" }}
      >
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info" role="status"></div>
            <p className="text-muted small mt-2">
              Loading platform settings...
            </p>
          </div>
        ) : (
          <div className="row g-4">
            {settings.map((s) => (
              <div key={s.configKey} className="col-12 col-md-6 col-xl-4">
                <div
                  className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between"
                  style={{ background: "#0b0f19", border: "1px solid #1f293d" }}
                >
                  <div>
                    <label className="form-label small fw-bold text-white mb-1">
                      {getSettingLabel(s.configKey)}
                    </label>
                    <p
                      className="text-muted small mb-3"
                      style={{ minHeight: 38 }}
                    >
                      {s.description ||
                        "Configurable operational threshold parameter."}
                    </p>
                  </div>

                  <div className="d-flex gap-2 align-items-center">
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-white fw-bold"
                      value={editValues[s.configKey] ?? s.configValue}
                      onChange={(e) =>
                        setEditValues({
                          ...editValues,
                          [s.configKey]: e.target.value,
                        })
                      }
                    />
                    <button
                      className="btn btn-sm btn-info text-dark fw-bold rounded-pill px-3 text-nowrap"
                      disabled={
                        savingKey === s.configKey ||
                        editValues[s.configKey] === s.configValue
                      }
                      onClick={() =>
                        handleSaveSetting(s.configKey, s.description)
                      }
                    >
                      {savingKey === s.configKey ? (
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                        ></span>
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ChangePassword />
    </div>
  );
};

export default AdminSettings;
