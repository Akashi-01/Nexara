export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

let onUnauthorized = () => {};

// App.jsx registers what should happen when the session expires
export const setUnauthorizedHandler = (fn) => {
    onUnauthorized = fn;
};

// path example: "/api/thread"
export async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
    });
    if (res.status === 401) onUnauthorized();
    return res;
}