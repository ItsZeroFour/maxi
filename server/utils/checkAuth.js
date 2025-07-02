import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export default (req, res, next) => {
  const token = (req.headers.authorization || "").replace(/Bearer\s?/, "");

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.user_token;

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