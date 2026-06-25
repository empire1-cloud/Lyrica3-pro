import React, { useState } from "react";
import { useNavigate } from "react-router";
import { register, login, getAuthToken } from "../lib/api";
import { Flame } from "lucide-react";

export function Auth() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (getAuthToken()) {
    navigate("/music/make", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(handle, email, password);
      } else {
        await login(handle, password);
      }
      navigate("/music/make");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Flame className="w-6 h-6 text-fuchsia-400" />
          <span className="font-['Sedgwick_Ave_Display'] text-3xl bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500">
            Lyrica 3
          </span>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-center">
            {mode === "register" ? "Create Account" : "Sign In"}
          </h2>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-zinc-400 block mb-1">Name</label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              required
              minLength={2}
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Email</label>
              <input
                type="email"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-sm text-zinc-400 block mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-medium rounded-xl px-4 py-2.5 transition-colors"
          >
            {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Sign In"}
          </button>

          <p className="text-center text-sm text-zinc-500">
            {mode === "register" ? "Already have an account?" : "No account yet?"}{" "}
            <button type="button" className="text-fuchsia-400 hover:underline" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}>
              {mode === "register" ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
