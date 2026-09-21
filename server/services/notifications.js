const NotificationService = require('./NotificationService');
module.exports = new NotificationService(require('../config/db'));
