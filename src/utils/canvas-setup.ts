import { registerFont } from "canvas";
import fs from "fs";
import path from "path";

// Register fonts once at server startup. We use font files placed under `public/fonts/`.
// If any font file is missing we log a clear error and continue so the server still starts.

function registerIfExists(fontPath: string, family: string, weight?: string) {
  if (!fs.existsSync(fontPath)) {
    return false;
  }

  try {
    registerFont(fontPath, {
      family,
      weight: weight || "normal",
    });
    return true;
  } catch (err) {
    console.error(`Failed to register font ${path.basename(fontPath)}:`, err);
    return false;
  }
}

// Public font locations (relative to project root)
const projectRoot = process.cwd();
const fontsDir = path.join(projectRoot, "public", "fonts");

// Expected font files (you should add these files to public/fonts):
// - PlayfairDisplay-Bold.ttf
// - Montserrat-Regular.ttf
// - Montserrat-Medium.ttf

// Expected font files (you should add these files to public/fonts):
// We support either the explicit filenames, or variable-font files (e.g. PlayfairDisplay-VariableFont_wght.ttf)
const registered: string[] = [];
const missing: string[] = [];

// Helper to find a font file in fontsDir by partial match (case-insensitive)
function findFontFile(keyword: string) {
  if (!fs.existsSync(fontsDir)) return null;
  const files = fs.readdirSync(fontsDir);
  const found = files.find((f) => f.toLowerCase().includes(keyword.toLowerCase()));
  return found ? path.join(fontsDir, found) : null;
}

// Try specific files first
const explicitMap = [
  { files: ["PlayfairDisplay-Bold.ttf"], family: "Playfair Display", weight: "bold" },
  { files: ["Montserrat-Regular.ttf"], family: "Montserrat", weight: "normal" },
  { files: ["Montserrat-Medium.ttf", "Montserrat-Medium.ttf"], family: "Montserrat", weight: "500" },
];

for (const e of explicitMap) {
  let ok = false;
  for (const fname of e.files) {
    const p = path.join(fontsDir, fname);
    if (fs.existsSync(p)) {
      ok = registerIfExists(p, e.family, e.weight) || ok;
      registered.push(path.basename(p));
      break;
    }
  }

  if (!ok) {
    // Try to find a variable font or other filename containing the family keyword
    const candidate = findFontFile(e.family.split(" ")[0]);
    if (candidate) {
      // For variable fonts we can register the same file under multiple weights
      const weights = ["normal", "500", "bold"];
      let any = false;
      for (const w of weights) {
        const okw = registerIfExists(candidate, e.family, w);
        any = any || okw;
      }
      if (any) {
        registered.push(path.basename(candidate));
        continue;
      }
    }

    missing.push(e.files[0]);
  }
}

if (registered.length) {
  // console.info(`Canvas fonts registered: ${registered.join(", ")}`);
}

if (missing.length) {
  console.warn(
    `Canvas fonts missing (expected names or compatible variable fonts): ${missing.join(", ")}.\n` +
      `Place matching font files under ${fontsDir}. The server will fall back to system fonts, but the visual output may differ.`
  );
  console.warn(
    "If you have variable-font files like PlayfairDisplay-VariableFont_wght.ttf or Montserrat-VariableFont_wght.ttf, they will be used automatically."
  );
}

// Export nothing — module side-effects are enough. Other modules import this file to ensure
// fonts are registered before any canvas work happens.

export default {};
