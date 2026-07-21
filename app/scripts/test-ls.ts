import fs from "fs";
import path from "path";

try {
  const dirPath = path.join(__dirname, "../../.data/users/00000000000/scrape-debug");
  const files = fs.readdirSync(dirPath);
  console.log(files);
} catch (e) {
  console.log(e);
}
