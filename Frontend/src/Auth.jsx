import { useState } from "react";
import "./Auth.css";
import { API_URL } from "./api.js";

function Auth({ onAuth }) {
    const [mode, setMode] = useState("login"); // "login" | "register"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setError("");

        if (mode === "register" && password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/${mode}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Something went wrong");
                return;
            }
            onAuth(data.user);
        } catch (err) {
            console.log(err);
            setError("Cannot reach the server. Is the backend running?");
        } finally {
            setSubmitting(false);
        }
    };

    const switchMode = () => {
        setMode(mode === "login" ? "register" : "login");
        setError("");
    };

    return (
        <div className="authPage">
            <form className="authCard" onSubmit={submit}>
                <h1>Nexara</h1>
                <p className="authSub">
                    {mode === "login" ? "Welcome back" : "Create your account"}
                </p>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                />

                {error && <div className="authError">{error}</div>}

                <button type="submit" disabled={submitting}>
                    {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
                </button>

                <p className="authSwitch">
                    {mode === "login" ? "New here?" : "Already have an account?"}{" "}
                    <span onClick={switchMode}>
                        {mode === "login" ? "Create an account" : "Log in"}
                    </span>
                </p>
            </form>
        </div>
    );
}

export default Auth;