import jwt from "jsonwebtoken";

export default (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({ message: "Access denied: Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user_id = decoded.user_id;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Access denied: Invalid token" });
  }
};
