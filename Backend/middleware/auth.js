import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.user = { id: payload.id };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}