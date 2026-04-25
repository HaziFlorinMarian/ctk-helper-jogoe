// Tiny static server for local dev. Run: node .server.cjs
// Serves the repo root on http://127.0.0.1:8000/.
const http = require("http");
const fs   = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = 8000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".mjs":  "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3":  "audio/mpeg",
  ".png":  "image/png",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath.endsWith("/")) urlPath += "index.html";
  const filePath = path.join(ROOT, urlPath);

  // Reject path traversal.
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end("forbidden");
  }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { "content-type": "text/plain" });
      return res.end("404 " + urlPath);
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(PORT, "127.0.0.1", () => {
  console.log(`http://127.0.0.1:${PORT}/  (serves ${ROOT})`);
});
