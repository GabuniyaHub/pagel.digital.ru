const fs = require("fs");
const path = require("path");

function serveStaticFile(req, res) { 
    const decodedUrl = decodeURIComponent(req.url);
    const filePath = path.join(__dirname, "../../client", decodedUrl);
    const extname = path.extname(filePath);
    let contentType = "text/plain";

    switch (extname) {
        case ".html": contentType = "text/html"; break;
        case ".js": contentType = "text/javascript"; break;
        case ".css": contentType = "text/css"; break;
        case ".png": contentType = "image/png"; break;
        case ".jpg":
        case ".jpeg": contentType = "image/jpeg"; break;
        case ".gif": contentType = "image/gif"; break;
        default: contentType = "application/octet-stream";
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, message: "Страница не найдена" }));
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(data);
        }
    });
}

module.exports = { serveStaticFile };
