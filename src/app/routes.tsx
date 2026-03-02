import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";
import Root from "./components/Root.tsx";
import OnboardingScreen from "./components/onboarding/OnboardingScreen.tsx";
import AuthScreen from "./components/auth/AuthScreen.tsx";
import MarketplaceScreen from "./components/marketplace/MarketplaceScreen.tsx";
import NotFound from "./components/NotFound.tsx";
import PaymentReturn from "./components/marketplace/PaymentReturn.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import RouteGuard from "./components/RouteGuard.tsx";
import { DashboardSkeleton } from "./components/Skeleton.tsx";

// ─── Lazy-loaded feature modules (code-split) ────────────────────────────
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard.tsx"));
const AmbassadorPortal = lazy(() => import("./components/ambassador/AmbassadorPortal.tsx"));
const ShopOwnerDashboard = lazy(() => import("./components/shop-owner/ShopOwnerDashboard.tsx"));
const ProfilePage = lazy(() => import("./components/profile/ProfilePage.tsx"));
const OrderHistory = lazy(() => import("./components/orders/OrderHistory.tsx"));
const ProductDetailPage = lazy(() => import("./components/marketplace/ProductDetailPage.tsx"));

function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<DashboardSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: OnboardingScreen },
      { path: "auth", Component: AuthScreen },
      { path: "marketplace", Component: MarketplaceScreen },
      {
        path: "admin",
        element: (
          <RouteGuard allowedRoles={["system-admin"]}>
            <LazyRoute><AdminDashboard /></LazyRoute>
          </RouteGuard>
        ),
      },
      {
        path: "ambassador",
        element: (
          <RouteGuard allowedRoles={["ambassador", "system-admin"]}>
            <LazyRoute><AmbassadorPortal /></LazyRoute>
          </RouteGuard>
        ),
      },
      {
        path: "shop-owner",
        element: (
          <RouteGuard allowedRoles={["shop-owner", "system-admin"]}>
            <LazyRoute><ShopOwnerDashboard /></LazyRoute>
          </RouteGuard>
        ),
      },
      {
        path: "profile",
        element: (
          <RouteGuard>
            <LazyRoute><ProfilePage /></LazyRoute>
          </RouteGuard>
        ),
      },
      {
        path: "orders",
        element: (
          <RouteGuard>
            <LazyRoute><OrderHistory /></LazyRoute>
          </RouteGuard>
        ),
      },
      {
        path: "product/:productId",
        element: (
          <LazyRoute><ProductDetailPage /></LazyRoute>
        ),
      },
      { path: "payment-return", Component: PaymentReturn },
      { path: "*", Component: NotFound },
    ],
  },
]);