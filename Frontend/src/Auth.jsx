import { useState, useEffect, useMemo } from "react";
import "./Auth.css";
import { API_URL } from "./api.js";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Sparkles, Zap, BarChart3, Bot, MessageSquare, Eye, EyeOff } from "lucide-react";

/* ─── floating particles (memoised so they never re-render) ─── */
function Particles() {
    const dots = useMemo(
        () =>
            Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 3 + 1,
                duration: Math.random() * 20 + 15,
                delay: Math.random() * 10,
                opacity: Math.random() * 0.5 + 0.1,
            })),
        [],
    );

    return (
        <div className="auth-particles">
            {dots.map((d) => (
                <div
                    key={d.id}
                    className="auth-particle"
                    style={{
                        left: `${d.x}%`,
                        top: `${d.y}%`,
                        width: `${d.size}px`,
                        height: `${d.size}px`,
                        opacity: d.opacity,
                        animationDuration: `${d.duration}s`,
                        animationDelay: `${d.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}

/* ─── glow ring animation ─── */
function GlowRings() {
    return (
        <div className="auth-glow-rings">
            <div className="auth-glow-ring auth-glow-ring-1" />
            <div className="auth-glow-ring auth-glow-ring-2" />
            <div className="auth-glow-ring auth-glow-ring-3" />
        </div>
    );
}

/* ─── dashboard preview cards ─── */
const previewFeatures = [
    { icon: <Sparkles size={18} />, label: "Ask anything", desc: "Natural language AI" },
    { icon: <BarChart3 size={18} />, label: "Analytics", desc: "Real-time insights" },
    { icon: <Bot size={18} />, label: "AI Assistant", desc: "Always available" },
    { icon: <Zap size={18} />, label: "Fast Responses", desc: "Sub-second latency" },
];

/* ─── main component ─── */
function Auth({ onAuth }) {
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    /* ─── auth logic (unchanged) ─── */
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

    /* ─── animation variants ─── */
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.2 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
    };

    return (
        <div className="auth-page">
            {/* ── background layers ── */}
            <div className="auth-aurora" />
            <div className="auth-aurora-secondary" />
            <Particles />
            <GlowRings />
            <div className="auth-grid-pattern" />

            {/* ── main content ── */}
            <motion.div
                className="auth-content"
                initial="hidden"
                animate={mounted ? "visible" : "hidden"}
                variants={containerVariants}
            >
                {/* ── logo ── */}
                <motion.div className="auth-logo-section" variants={itemVariants}>
                    <div className="auth-logo-glow" />
                    <div className="auth-logo-icon">
                        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                            <defs>
                                <linearGradient id="logoGrad" x1="0" y1="0" x2="42" y2="42">
                                    <stop offset="0%" stopColor="#8B5CF6" />
                                    <stop offset="50%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#06B6D4" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M21 4L37 13v16L21 38 5 29V13L21 4z"
                                stroke="url(#logoGrad)"
                                strokeWidth="2.5"
                                fill="none"
                            />
                            <path
                                d="M21 12L29 17v10l-8 5-8-5V17l8-5z"
                                fill="url(#logoGrad)"
                                opacity="0.3"
                            />
                            <circle cx="21" cy="21" r="4" fill="url(#logoGrad)" />
                        </svg>
                    </div>
                    <h1 className="auth-brand">Nexara</h1>
                    <p className="auth-tagline">Next-generation AI platform</p>
                </motion.div>

                {/* ── glass card ── */}
                <motion.form
                    className="auth-card"
                    onSubmit={submit}
                    variants={itemVariants}
                    layout
                >
                    <div className="auth-card-inner">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={mode}
                                initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="auth-heading">
                                    {mode === "login" ? "Welcome back" : "Create account"}
                                </h2>
                                <p className="auth-sub">
                                    {mode === "login"
                                        ? "Sign in to continue to Nexara"
                                        : "Start your AI journey today"}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* email */}
                        <div className={`auth-input-group ${focusedField === "email" ? "focused" : ""}`}>
                            <div className="auth-input-icon">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setFocusedField("email")}
                                onBlur={() => setFocusedField(null)}
                                autoComplete="email"
                                required
                            />
                        </div>

                        {/* password */}
                        <div className={`auth-input-group ${focusedField === "password" ? "focused" : ""}`}>
                            <div className="auth-input-icon">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField("password")}
                                onBlur={() => setFocusedField(null)}
                                autoComplete={mode === "login" ? "current-password" : "new-password"}
                                required
                            />
                            <button
                                type="button"
                                className="auth-eye-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {/* error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    className="auth-error"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* CTA */}
                        <motion.button
                            type="submit"
                            className="auth-cta"
                            disabled={submitting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>
                                {submitting
                                    ? "Please wait..."
                                    : mode === "login"
                                      ? "Sign in"
                                      : "Create account"}
                            </span>
                            {!submitting && <ArrowRight size={18} />}
                            {submitting && <div className="auth-spinner" />}
                        </motion.button>

                        {/* switch */}
                        <p className="auth-switch">
                            {mode === "login"
                                ? "Don't have an account?"
                                : "Already have an account?"}{" "}
                            <span onClick={switchMode}>
                                {mode === "login" ? "Sign up" : "Sign in"}
                            </span>
                        </p>
                    </div>
                </motion.form>

                {/* ── dashboard preview ── */}
                <motion.div className="auth-preview" variants={itemVariants}>
                    <div className="auth-preview-label">
                        <MessageSquare size={14} />
                        <span>Powered by Nexara AI</span>
                    </div>
                    <div className="auth-preview-grid">
                        {previewFeatures.map((f, i) => (
                            <motion.div
                                key={f.label}
                                className="auth-preview-card"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                            >
                                <div className="auth-preview-card-icon">{f.icon}</div>
                                <div>
                                    <div className="auth-preview-card-title">{f.label}</div>
                                    <div className="auth-preview-card-desc">{f.desc}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default Auth;
