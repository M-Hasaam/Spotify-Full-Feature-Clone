const fs = require("fs");
const path = require("path");

const songsDir = __dirname;
const output = [];

fs.readdirSync(songsDir, { withFileTypes: true }).forEach((dirent) => {
  if (dirent.isDirectory()) {
    const folderName = dirent.name;
    const folderPath = path.join(songsDir, folderName);
    const infoPath = path.join(folderPath, "info.json");
    const coverPath = path.join(folderPath, "cover.jpg");

    if (fs.existsSync(infoPath) && fs.existsSync(coverPath)) {
      const info = JSON.parse(fs.readFileSync(infoPath, "utf-8"));
      const files = fs.readdirSync(folderPath);

      const mp3Files = files
        .filter((f) => f.endsWith(".mp3"))
        .map((f) => encodeURIComponent(f)); // Encode to be URL-safe

      output.push({
        folder: folderName,
        title: info.title,
        description: info.description,
        cover: "cover.jpg",
        songs: mp3Files,
      });
    }
  }
});

fs.writeFileSync(path.join(songsDir, "index.json"), JSON.stringify(output, null, 2));
console.log("✅ index.json generated successfully.");
