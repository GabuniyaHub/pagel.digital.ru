const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || "guram";

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const tokenFromCookie = req.cookies?.jwt; 

  const token = authHeader?.split(' ')[1] || tokenFromCookie;

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    // req.user = decoded;

    req.user = {
            id: decoded.userId,
            email: decoded.email
        };
      // console.log('лог с сервера (!)', req.user);
    } catch (err) {
    // токен невалиден — ничего не делаем
  }

  next();
}


module.exports = optionalAuth;
