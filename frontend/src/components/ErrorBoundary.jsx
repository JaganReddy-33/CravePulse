import React from "react";

/**
 * Production-grade ErrorBoundary catching render exceptions and unexpected runtime faults.
 * Renders an empathetic recovery screen without crashing the whole application.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error(
      "ErrorBoundary caught an unhandled application exception:",
      error,
      errorInfo,
    );
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
          <div
            className="card border-0 shadow-lg rounded-4 p-4 p-md-5 text-center bg-white"
            style={{ maxWidth: 580, width: "100%" }}
            role="alert"
            aria-live="assertive"
          >
            <div className="fs-1 mb-3" aria-hidden="true">
              🍲💥
            </div>
            <h3 className="fw-extrabold text-dark mb-2">
              Something went unexpected
            </h3>
            <p className="text-muted small mb-4">
              We encountered a glitch while loading this section of CravePulse.
              Don't worry, your orders and account data remain completely
              secure.
            </p>

            <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 mb-4">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center justify-content-center gap-2 touch-target"
                style={{
                  background: "var(--c-primary)",
                  borderColor: "var(--c-primary)",
                }}
              >
                <i className="bi bi-arrow-clockwise"></i>
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center justify-content-center gap-2 touch-target"
              >
                <i className="bi bi-house-door"></i>
                Return to Home
              </button>
            </div>

            {/* Diagnostic Details Toggle */}
            <div className="border-top pt-3 text-start">
              <button
                type="button"
                onClick={() =>
                  this.setState((prev) => ({ showDetails: !prev.showDetails }))
                }
                className="btn btn-link p-0 text-muted small text-decoration-none d-flex align-items-center justify-content-between w-100"
              >
                <span>Technical Diagnostics</span>
                <i
                  className={`bi bi-chevron-${this.state.showDetails ? "up" : "down"}`}
                ></i>
              </button>
              {this.state.showDetails && (
                <div
                  className="mt-2 p-3 bg-light rounded-3 font-monospace small text-danger overflow-auto"
                  style={{ maxHeight: 180, fontSize: 11 }}
                >
                  <strong>{this.state.error?.toString()}</strong>
                  <pre
                    className="mb-0 mt-1 text-muted"
                    style={{ fontSize: 10 }}
                  >
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
