const jwt = require('jsonwebtoken');
const { requireJwtSecret } = require('../../config/auth');

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const tokenFromCookie = req.cookies?.jwt; 

  const token = authHeader?.split(' ')[1] || tokenFromCookie;

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, requireJwtSecret());
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
