import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "canvas";
// eslint-disable-next-line no-restricted-imports
import "../src/utils/canvas-setup";

// Random data constant
const RANDOM = {
  firstNames: ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn"],
  lastNames: ["Smith", "Johnson", "Lee", "Garcia", "Brown", "Davis", "Martinez", "Clark"],
  trainings: [
    "Advanced Node.js",
    "TypeScript Best Practices",
    "Full-Stack Web Development",
    "Introduction to Canvas Graphics",
    "Certificate Design Workshop",
  ],
  issuers: ["Oemah Academy", "Digital Certs Inc.", "Training Dept."],
  templates: ["1.png"],
  logos: ["logo-1.png"],
};

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const makeShort = (s: any) =>
  String(s)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();

async function generateOne() {
  const template = 2
  const participantId = Math.floor(Math.random() * 99999) + 1;
  const name = `${pick(RANDOM.firstNames)} ${pick(RANDOM.lastNames)}`;
  const trainingId = Math.floor(Math.random() * 9999) + 1;
  const trainingName = pick(RANDOM.trainings);

  const canvasWidth = 1200;
  const canvasHeight = 800;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  // Fill background first
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Choose a single logo name to use for both overlay and top logo.
  // If the template indicates a numeric id (e.g. "1" or "1.png"), prefer logo-<id>.png
  let chosenLogo: string;
  try {
    const tpl = String(template || "").trim();
    const tplNumStr = tpl.replace(/\.png$/i, "");
    const tplNum = parseInt(tplNumStr, 10);
    if (!isNaN(tplNum) && tplNum > 0) {
      chosenLogo = `logo-${tplNum}.png`;
      console.info(`Inferred logo from template (${tpl}):`, chosenLogo);
    } else {
      chosenLogo = pick(RANDOM.logos);
      console.info("No numeric template id found — picked random logo:", chosenLogo);
    }
  } catch (e) {
    chosenLogo = pick(RANDOM.logos);
    console.info("Failed to infer logo from template, using random:", chosenLogo, e);
  }

  // Try overlay (background watermark) first — centered, 80% width, low opacity
  const ovyPath = path.join(process.cwd(), "public", "logos", chosenLogo)
  console.info("Trying overlay logo candidates:", ovyPath);
  try {
    if (fs.existsSync(ovyPath)) {
      console.info("Overlay logo found, attempting to load:", ovyPath);
      try {
        const imgO = await loadImage(ovyPath);
        if (imgO) {
          ctx.save();
          ctx.globalAlpha = 0.1;
          const targetW = Math.round(canvasWidth * 0.9);
          const scale = targetW / imgO.width || 1;
          const w = Math.round(imgO.width * scale);
          const h = Math.round(imgO.height * scale);
          const x = Math.round((canvasWidth - w) / 2);
          const y = Math.round((canvasHeight - h) / 2);
          ctx.drawImage(imgO, x, y, w, h);
          ctx.restore();
          console.info("Overlay logo drawn from:", ovyPath, "size:", w, h);
        } else {
          console.warn("loadImage returned falsy for overlay:", ovyPath);
        }
      } catch (imgErr) {
        console.warn("Failed to load overlay image:", ovyPath, imgErr);
      }
    } else {
      console.info("Overlay candidate missing:", ovyPath);
    }
  } catch (existsErr) {
    console.warn("Error checking overlay candidate:", ovyPath, existsErr);
  }

  // Draw logo at top (flexible names: logo-1.png, logo-2.png, logo-3.png)
  const logoFile = chosenLogo;
  const logoPath = path.join(process.cwd(), "public", "logos", logoFile);
  console.info("Trying logo candidates:", logoPath);
  try {
    if (fs.existsSync(logoPath)) {
      console.info("Logo file exists, attempting to load:", logoPath);
      try {
        const imgLogo = await loadImage(logoPath);
        if (imgLogo) {
          const maxWidth = 200;
          const scale = Math.min(1, maxWidth / imgLogo.width || 1);
          const w = Math.round(imgLogo.width * scale);
          const h = Math.round(imgLogo.height * scale);
          const x = Math.round((canvasWidth - w) / 2);
          const y = 40; // top margin
          ctx.drawImage(imgLogo, x, y, w, h);
          console.info("Logo drawn from:", logoPath, "size:", w, h);
        } else {
          console.warn("loadImage returned falsy for logo:", logoPath);
        }
      } catch (logoErr) {
        console.warn("Failed to load logo image:", logoPath, logoErr);
      }
    } else {
      console.info("Logo candidate missing:", logoPath);
    }
  } catch (existsErr) {
    console.warn("Error checking logo candidate:", logoPath, existsErr);
  }

  // Certificate layout content
  const now = new Date();
  // configurable top margin (pixels) to shift the whole certificate content downward
  const topMargin = 40;

  // Title: CERTIFICATE (biggest)
  ctx.fillStyle = "#1b263b";
  ctx.textAlign = "center";
  ctx.font = 'bold 72px "Playfair Display", serif';
  ctx.fillText("CERTIFICATE", canvasWidth / 2, 210);

  // If template is NOT 1, show company line under the title
  const tplCheck = String(template || "").trim();
  if (tplCheck !== "1" && tplCheck.toLowerCase() !== "1.png") {
    ctx.font = '18px "Montserrat", sans-serif';
    ctx.fillStyle = "#333";
    ctx.fillText("PT ELTASA PRIMA KONSULTA", canvasWidth / 2, 250);
  }

  // Small license text
  ctx.font = '20px "Montserrat", sans-serif';
  ctx.fillStyle = "#000";
  ctx.fillText("1687/EXP/14/XI/2025", canvasWidth / 2, 235 + topMargin);

  // This is to certify that
  ctx.font = '24px "Montserrat", sans-serif';
  ctx.fillText("This is to certify that", canvasWidth / 2, 300 + topMargin);

  // Recipient name (bigger, bold italic)
  ctx.font = 'italic bold 44px "Playfair Display", serif';
  ctx.fillStyle = "#000";
  const recipient = name; // use generated name
  ctx.fillText(recipient, canvasWidth / 2, 360 + topMargin);

  // Department (xsmall)
  ctx.font = '20px "Montserrat", sans-serif';
  ctx.fillStyle = "#000";
  ctx.fillText("Departemen Teknologi Industri Pertanian, Universitas Gadjah Mada", canvasWidth / 2, 390 + topMargin);

  // Has Successfully Completed Training Course on:
  ctx.font = '24px "Montserrat", sans-serif';
  ctx.fillStyle = "#000";
  ctx.fillText("Has Successfully Completed Training Course on:", canvasWidth / 2, 460 + topMargin);

  // Course name (bold)
  ctx.font = 'bold 36px "Montserrat", sans-serif';
  ctx.fillStyle = "#000";
  const course = trainingName || "Data Analyst";
  ctx.fillText(course, canvasWidth / 2, 510 + topMargin);

  // Held on and location
  ctx.font = '20px "Montserrat", sans-serif';
  ctx.fillStyle = "#000";
  ctx.fillText("Held on November 27th until November 28th, 2025 in Yogyakarta", canvasWidth / 2, 550 + topMargin);

  // Signatory name and signature area (centered)
  const signY = 600 + topMargin;
  ctx.font = '20px "Montserrat", sans-serif';
  ctx.fillStyle = "#000";
  const signatory = "Prof. Dr. Ir. Elisa Kusrini, MT, CPIM, CSCP";
  ctx.textAlign = "center";
  const signX = canvasWidth / 2;
  ctx.fillText(signatory, signX, signY);

  // Try to draw signature image (ttd). Prefer ttd-<templateId>.png, fallback to ttd-1.png
  let ttdFile = "ttd-1.png";
  try {
    const tpl = String(template || "").trim();
    const tplNumStr = tpl.replace(/\.png$/i, "");
    const tplNum = parseInt(tplNumStr, 10);
    if (!isNaN(tplNum) && tplNum > 0) {
      ttdFile = `ttd-${tplNum}.png`;
      console.info("Inferred ttd from template:", ttdFile);
    }
  } catch (e) {
    // ignore, use default
  }

  const ttdCandidates = [
    path.join(process.cwd(), "public", "ttds", ttdFile),
    path.join(process.cwd(), "public", "ttd", ttdFile),
    path.join(process.cwd(), "public", "signatures", ttdFile),
  ];
  let ttdDrawn = false;
  for (const cand of ttdCandidates) {
    try {
      if (fs.existsSync(cand)) {
        console.info("Found ttd image, loading:", cand);
        try {
          const imgT = await loadImage(cand);
          if (imgT) {
            const maxW = 180;
            const scale = Math.min(1, maxW / imgT.width || 1);
            const w = Math.round(imgT.width * scale);
            const h = Math.round(imgT.height * scale);
            const x = signX - Math.round(w / 2);
            const y = signY - Math.round(h / 2)+70;
            ctx.drawImage(imgT, x, y, w, h);
            console.info("TTD drawn from:", cand, "size:", w, h);
            ttdDrawn = true;
            break;
          }
        } catch (imgErr) {
          console.warn("Failed to load ttd image:", cand, imgErr);
        }
      } else {
        console.info("TTD candidate missing:", cand);
      }
    } catch (existsErr) {
      console.warn("Error checking ttd candidate:", cand, existsErr);
    }
  }

  // Director label (centered)
  ctx.font = '20px "Montserrat", sans-serif';
  ctx.fillText("Director", canvasWidth / 2, signY + 140);

  // Output
  const outDir = path.join(process.cwd(), "scrips", "generated");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const pad = (n: number) => n.toString().padStart(2, "0");
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const noLicense = `EXP-${makeShort(trainingId)}-${makeShort(participantId)}-${ts}-${rand}`;
  const filename = `${noLicense}.png`;
  const outPath = path.join(outDir, filename);

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outPath, buffer);
  console.log("Generated certificate:", outPath);
}

generateOne().catch((err) => {
  console.error(err);
  process.exit(1);
});
