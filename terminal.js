const http = require("http");
// just make a request to port 1920 and kill the process
http.get("http://localhost:1920", () => {
    process.exit();
});