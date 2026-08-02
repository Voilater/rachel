import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/lib/auth";
import { siteConfig } from "@/lib/site-data";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: `Admin Login — ${siteConfig.name}` }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { loginAdmin, isAdminAuthenticated } = useAuth();
  const [email, setEmail] = useState("admin@vkstudio.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAdminAuthenticated) {
    navigate({ to: "/admin" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAdmin(email, password);
      navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blush-section px-4 py-8 sm:py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-burgundy/10">
            <Shield className="size-5 text-burgundy" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-burgundy">Admin Portal</h1>
            <p className="text-sm text-muted-foreground">{siteConfig.brandName} studio</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-burgundy py-3.5 text-sm font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In to Dashboard"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-burgundy hover:underline">Client login</Link>
          <span className="mx-2">·</span>
          <Link to="/" className="text-burgundy hover:underline">Store</Link>
        </p>
      </div>
    </div>
  );
}
