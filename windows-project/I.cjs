const fs = require("fs");
const https = require("https");

// Saves in the current working directory (where you run `node file.js`)
const outputPath = "favicon.png";

const imageUrl = "https://cdn.discordapp.com/avatars/1370470578263298189/3e1919e23e8faa5a7be79f2e03a5abde.png?size=128";

https.get(imageUrl, (res) => {
  if (res.statusCode !== 200) {
    console.error("Failed to download image:", res.statusCode);
    return;
  }

  const fileStream = fs.createWriteStream(outputPath);

  res.pipe(fileStream);

  fileStream.on("finish", () => {
    fileStream.close();
    console.log("favicon.png saved in current directory!");
  });
}).on("error", (err) => {
  console.error("Error downloading image:", err);
});