import { useContext } from "react";
import { Navigate } from "react-router";
import { LocationContext } from "./Root";

interface RouteGuardProps {
    children: React.ReactNode;
    /** Roles allowed to access this route. Empty = any authenticated user. */
    allowedRoles?: string[];
    /** If true, redirect unauthenticated users to /auth. Default: true */
    requireAuth?: boolean;
}

/**
 * Protects routes based on authentication status and user role.
 * Unauthenticated users are sent to /auth.
 * Users with wrong roles are sent to /marketplace.
 */
export default function RouteGuard({
    children,
    allowedRoles = [],
    requireAuth = true,
}: RouteGuardProps) {
    const { isAuthenticated, userRole } = useContext(LocationContext);

    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return <Navigate to="/marketplace" replace />;
    }

    return <>{children}</>;
}
