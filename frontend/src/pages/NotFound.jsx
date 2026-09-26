import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
      <div className="text-center">
        <p className="text-sm text-slate-500">404</p>

        <h1 className="mt-2 text-3xl font-bold">Page not found</h1>

        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
