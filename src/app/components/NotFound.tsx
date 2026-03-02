import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#1E40AF] mb-4">404</h1>
        <p className="text-xl text-[#64748B] mb-8">Page not found</p>
        <Link
          to="/"
          className="inline-block px-8 py-4 bg-[#1E40AF] text-white rounded-[32px] hover:bg-[#1e3a8a] transition-colors"
        >
          Return to Bridge
        </Link>
      </div>
    </div>
  );
}
