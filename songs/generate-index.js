const fs = require("fs");
const path = require("path");

const basePath = __dirname; // current directory: /songs
const folders = fs.readdirSync(basePath, { withFileTypes: true });

const index = [];

folders.forEach((entry) => {
  if (entry.isDirectory()) {
    const folderPath = path.join(basePath, entry.name);
    const infoPath = path.join(folderPath, "info.json");
    const coverPath = path.join(folderPath, "cover.jpg");

    if (fs.existsSync(infoPath) && fs.existsSync(coverPath)) {
      const infoData = JSON.parse(fs.readFileSync(infoPath, "utf8"));

      index.push({
        folder: entry.name,
        title: infoData.title || entry.name,
        description: infoData.description || "",
        cover: "cover.jpg"
      });
    } else {
      console.warn(`Skipping ${entry.name}: Missing info.json or cover.jpg`);
    }
  }
});

const outputPath = path.join(basePath, "index.json");
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2), "utf8");

console.log("✅ songs/index.json generated successfully.");
