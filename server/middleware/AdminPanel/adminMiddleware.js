const jwt = require("jsonwebtoken");
const { requireJwtSecret } = require("../../config/auth");
const client = require("../../config/db");

const checkAdminInDB = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.writeHead(401, { "Content-Type": "application/json" })
      .end(JSON.stringify({ message: "Нет токена" }));
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, requireJwtSecret(), async (err, decoded) => {
    if (err || !decoded?.email) {
      return res.writeHead(403, { "Content-Type": "application/json" })
        .end(JSON.stringify({ message: "Неверный токен" }));
    }

    try {
      const check = await client.query("SELECT * FROM admins WHERE email = $1", [decoded.email]);
      if (check.rows.length === 0) {
        return res.writeHead(403, { "Content-Type": "application/json" })
          .end(JSON.stringify({ message: "Вы не админ" }));
      }

      req.user = decoded;
      next();
    } catch (dbErr) {
      console.error("Ошибка при проверке администратора:", dbErr);
      res.writeHead(500, { "Content-Type": "application/json" })
        .end(JSON.stringify({ message: "Ошибка сервера" }));
    }
  });
};

module.exports = { checkAdminInDB };
