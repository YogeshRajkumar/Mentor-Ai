import React from "react";

// ─── Global Error Boundary ────────────────────────────────────────────────────
// Catches any unhandled render/lifecycle error below it in the tree and
// shows a friendly fallback instead of a blank screen.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "An unexpected error occurred.",
    };
  }

  componentDidCatch(error, info) {
    // Log for debugging — safe to keep in production (no PII)
    console.error("[ErrorBoundary] Caught:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center text-zinc-100">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-zinc-400">
            {this.state.message}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 active:scale-95"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white active:scale-95"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
