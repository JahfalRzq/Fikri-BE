import { registerFont } from "canvas";
import fs from "fs";
import path from "path";

// Register fonts once at server startup. We use font files placed under `public/fonts/`.
// If any font file is missing we log a clear error and continue so the server still starts.

function registerIfExists(fontPath: string, family: string, weight?: string) {
  if (!fs.existsSync(fontPath)) {
    console.error(`Canvas font not found: ${fontPath} — ${family} ${weight || ""}`);
    return;
  }

  try {
    registerFont(fontPath, {
      family,
      weight: weight || "normal",
    });
    console.info(`Registered font: ${path.basename(fontPath)} as ${family} ${weight || ""}`);
  } catch (err) {
    console.error(`Failed to register font ${fontPath}:`, err);
  }
}

// Public font locations (relative to project root)
const projectRoot = process.cwd();
const fontsDir = path.join(projectRoot, "public", "fonts");

// Expected font files (you should add these files to public/fonts):
// - PlayfairDisplay-Bold.ttf
// - Montserrat-Regular.ttf
// - Montserrat-Medium.ttf

registerIfExists(path.join(fontsDir, "PlayfairDisplay-Bold.ttf"), "Playfair Display", "bold");
registerIfExists(path.join(fontsDir, "Montserrat-Regular.ttf"), "Montserrat", "normal");
registerIfExists(path.join(fontsDir, "Montserrat-Medium.ttf"), "Montserrat", "500");

// Export nothing — module side-effects are enough. Other modules import this file to ensure
// fonts are registered before any canvas work happens.

export default {};
