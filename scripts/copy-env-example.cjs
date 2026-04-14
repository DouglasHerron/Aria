const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dest = path.join(root, ".env.local");
const src = path.join(root, ".env.example");

if (fs.existsSync(dest)) {
  console.log(".env.local already exists — skipping.");
  process.exit(0);
}

fs.copyFileSync(src, dest);
console.log(
  "Created .env.local from .env.example — edit values or use http://localhost:3000/setup",
);
