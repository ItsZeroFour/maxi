import dotenv from "dotenv";

dotenv.config();

export default (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({ message: "Access denied: Token missing", token });
  }

  if (token !== process.env.TOKEN) {
    return res.status(403).json({ message: "Access denied: Invalid token" });
  }

  next();
};
