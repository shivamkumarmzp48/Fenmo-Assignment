import React, { useState } from "react";
import "../App.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:4000";
function apiUrl(path: string) {
  return `${API_BASE.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

interface AuthFormProps {
  onAuth: (token: string, username: string) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuth }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isSignup ? apiUrl("/auth/signup") : apiUrl("/auth/login");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSignup ? { username, email, password } : { email, password }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const errMsg =
          (data && (typeof data.error === "string" ? data.error : data.error?.message)) ||
          data?.message ||
          text ||
          `Request failed (${res.status})`;
        throw new Error(errMsg);
      }

      if (isSignup) {
        setIsSignup(false);
        setUsername("");
        setEmail("");
        setPassword("");
        setSuccess("Signup successful! Please login.");
        setError("");
      } else {
        // persist token
        try { localStorage.setItem('authToken', data.token); localStorage.setItem('username', data.username); } catch {}
        onAuth(data.token, data.username);
      }
    } catch (err: any) {
      const msg = err?.message ?? (typeof err === "string" ? err : JSON.stringify(err));
      setError(msg);
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{isSignup ? "Sign Up" : "Login"}</h2>
        {isSignup && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? (isSignup ? "Signing up..." : "Logging in...") : isSignup ? "Sign Up" : "Login"}
        </button>
        <p className="auth-toggle">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <button type="button" onClick={() => { setIsSignup(!isSignup); setError(""); }}>
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
      </form>
    </div>
  );
};
