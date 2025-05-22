const fs = require("fs");

const key = fs.readFileSync("./private-key.pem", "utf-8");
const escaped = key.replace(/\n/g, "\\n");
console.log(escaped);
