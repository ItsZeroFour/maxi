import jwt from "jsonwebtoken";

/**
 * Middleware для проверки серверного секретного токена в заголовках Authorization.
 * Ожидается заголовок: Authorization: Bearer <JWT-с токеном, содержащим поле `secret`>
 */
export default function serverAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({ message: "Access denied: Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.secret !== process.env.SERVER_SECRET) {
      return res
        .status(403)
        .json({ message: "Access denied: Invalid server secret" });
    }

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Access denied: Invalid or expired token" });
  }
}
