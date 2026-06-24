import { Component, ReactNode } from "react";

interface State { hasError: boolean; message?: string }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: any): State {
    return { hasError: true, message: err?.message ? String(err.message) : "Terjadi kesalahan tak terduga" };
  }

  componentDidCatch(error: any, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full rounded-xl border bg-card p-6 shadow-elegant text-center space-y-4">
            <h2 className="text-xl font-bold text-foreground">Ups, terjadi kesalahan</h2>
            <p className="text-sm text-muted-foreground break-words">{this.state.message}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={this.reset} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Coba Lagi</button>
              <button onClick={() => (window.location.href = "/dashboard")} className="rounded-md border px-4 py-2 text-sm font-semibold">Kembali ke Dashboard</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
