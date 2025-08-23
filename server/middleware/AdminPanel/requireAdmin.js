const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.writeHead(403, { "Content-Type": "application/json" })
        .end(JSON.stringify({ success: false, message: "Только для админов" }));
    }
    next();
  };
  
  module.exports = { requireAdmin };
  