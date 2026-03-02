import React, { Component, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Wraps feature modules so a crash in one area doesn't take down the
 * whole app.  Shows a friendly recovery UI with a retry button.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    handleRetry = () => this.setState({ hasError: false, error: null });

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "300px",
                        padding: "2rem",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: "#64748b", marginBottom: "1.5rem", maxWidth: "400px" }}>
                        An unexpected error occurred. Please try again or refresh the page.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        style={{
                            padding: "0.625rem 1.5rem",
                            borderRadius: "12px",
                            border: "none",
                            background: "linear-gradient(135deg, #1E40AF, #3B82F6)",
                            color: "white",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "0.875rem",
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
