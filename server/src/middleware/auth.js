import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Please sign in to continue." });
  }

  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Your session is invalid or has expired. Sign in again." });
  }

  const user = await User.findById(claims.sub).select("role club");
  if (!user) {
    return res.status(401).json({ message: "This account is no longer available." });
  }
  req.user = { sub: user.id, role: user.role, clubId: user.club ? String(user.club) : null };
  if (!req.user.clubId && user.role !== "athlete") {
    return res.status(403).json({ message: "This account is not assigned to a club." });
  }
  next();
}
