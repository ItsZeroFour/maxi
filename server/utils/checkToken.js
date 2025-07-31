import dotenv from "dotenv";

dotenv.config();

export default (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (token) {
    try {
      req.user_token = token;

      next();
    } catch (error) {
      return res.status(500).send({
        message: "Access denied",
      });
    }
  } else {
    return res.status(500).send({
      message: "Access denied",
    });
  }
};
