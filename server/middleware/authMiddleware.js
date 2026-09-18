const jwt = require("jsonwebtoken");
const { requireJwtSecret } = require("../config/auth");

function getCookieToken(req) {
    const cookieHeader = req.headers.cookie || "";
    const cookie = cookieHeader.split(";").map(value => value.trim()).find(value => value.startsWith("jwt="));
    return cookie ? decodeURIComponent(cookie.slice(4)) : req.cookies?.jwt;
}

const verifyToken = (req, res, next) => {
    // 1. Проверяем заголовок
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : getCookieToken(req);
    if (!token) {
        return res.status(401).json({ message: "Токен отсутствует" });
    }

    try {
        const decoded = jwt.verify(token, requireJwtSecret());

        req.user = {
            id: decoded.userId,
            email: decoded.email
        };

        return next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Токен истёк, войдите снова" });
        }
        return res.status(401).json({ message: "Неверный токен" });
    }
};


module.exports = { verifyToken };
