class Notification {
    constructor(row) {
        this.id = row.id;
        this.title = row.title;
        this.message = row.message;
        this.url = row.url;
        this.createdAt = row.created_at;
        this.readAt = row.read_at;
    }
}
module.exports = Notification;
