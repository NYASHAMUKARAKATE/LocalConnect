/**
 * Skeleton loading components for perceived performance.
 * Used while data is being fetched to avoid blank states.
 */

interface SkeletonProps {
    width?: string;
    height?: string;
    borderRadius?: string;
    className?: string;
}

export function Skeleton({
    width = "100%",
    height = "1rem",
    borderRadius = "8px",
    className = "",
}: SkeletonProps) {
    return (
        <div
            className={className}
            style={{
                width,
                height,
                borderRadius,
                background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s ease-in-out infinite",
            }}
        />
    );
}

export function ProductCardSkeleton() {
    return (
        <div
            style={{
                background: "white",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
        >
            <Skeleton height="200px" borderRadius="0" />
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <Skeleton width="70%" height="1.25rem" />
                <Skeleton width="40%" height="1rem" />
                <Skeleton width="50%" height="0.875rem" />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <Skeleton width="60px" height="2rem" borderRadius="12px" />
                    <Skeleton width="100%" height="2rem" borderRadius="12px" />
                </div>
            </div>
        </div>
    );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem",
                padding: "1rem 0",
            }}
        >
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <Skeleton height="2rem" width="200px" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} height="120px" borderRadius="16px" />
                ))}
            </div>
            <Skeleton height="300px" borderRadius="16px" />
        </div>
    );
}

// Inject the shimmer animation
if (typeof document !== "undefined") {
    const styleId = "skeleton-shimmer-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
        document.head.appendChild(style);
    }
}
