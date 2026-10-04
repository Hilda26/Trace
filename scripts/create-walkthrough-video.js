const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public", "trace-walkthrough.webm");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9337;

function requestJson(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(new Error(`Could not parse ${url}: ${body.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function waitForChrome() {
  const url = `http://127.0.0.1:${PORT}/json/version`;
  for (let i = 0; i < 80; i += 1) {
    try {
      return await requestJson(url);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error("Chrome did not expose a DevTools endpoint in time.");
}

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (!msg.id) return;
        const entry = this.pending.get(msg.id);
        if (!entry) return;
        this.pending.delete(msg.id);
        if (msg.error) entry.reject(new Error(JSON.stringify(msg.error)));
        else entry.resolve(msg.result);
      };
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId;
    this.nextId += 1;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
    });
  }

  close() {
    this.ws.close();
  }
}

const recordScript = String.raw`
(() => new Promise((resolve, reject) => {
  const W = 1280;
  const H = 720;
  const fps = 30;
  const secondsPerSlide = 4;
  const framesPerSlide = fps * secondsPerSlide;
  const bg = "#05080A";
  const panel = "#0F172A";
  const white = "#F8FAFC";
  const muted = "#94A3B8";
  const slides = [
    {
      kicker: "TRACE · FOOD SAFETY EVIDENCE PROTOCOL",
      title: "Turn scattered batch evidence into a source-bound verdict",
      body: "Trace lets operators submit food safety cases, attach public evidence URLs, and request GenLayer consensus over risk, required action, and product/batch provenance.",
      accent: "#38BDF8",
      chips: ["StudioNet", "GenLayer consensus", "Public source binding"],
      mock: "landing"
    },
    {
      kicker: "STEP 1 · SUBMIT SAFETY CASE",
      title: "Capture the product, lot, stage, and safety question",
      body: "The case form records product summary, batch or lot reference, chain stage, review focus, temperature notes, transport notes, and inspection notes.",
      accent: "#14B8A6",
      chips: ["Product summary", "Batch / lot", "Visibility"],
      mock: "form"
    },
    {
      kicker: "STEP 2 · EVIDENCE PROVENANCE",
      title: "Bind verdicts to verifiable issuer and date information",
      body: "Consensus uses retrieved public, PDF, and advisory sources. Verdicts record issuer, publication date, product mention, and batch mention for each accepted source.",
      accent: "#8B5CF6",
      chips: ["Issuer", "Publication date", "Product and batch binding"],
      mock: "sources"
    },
    {
      kicker: "STEP 3 · SAFETY VERDICT",
      title: "Receive bounded risk, evidence quality, and required action",
      body: "Trace returns canonical verdict fields such as safety status, risk tier, recall match, evidence quality, confidence, and a short source-grounded reason.",
      accent: "#F59E0B",
      chips: ["hold_required", "high risk", "quarantine batch"],
      mock: "verdict"
    },
    {
      kicker: "PRIVACY MODEL",
      title: "Private cases, notes, activity, and audit logs are sender-filtered",
      body: "Public users see public cases only. Owners see their private case room, notes, wallet activity, audit logs, and private verdict view through connected-wallet reads.",
      accent: "#22C55E",
      chips: ["Owner-only room", "Filtered indexes", "Private notes protected"],
      mock: "privacy"
    },
    {
      kicker: "ADMIN MODEL",
      title: "Admin monitor is observability only",
      body: "The deployer can read aggregate protocol stats, but cannot approve cases, edit verdicts, impersonate users, view private notes, or override GenLayer consensus.",
      accent: "#EF4444",
      chips: ["No override", "No private notes", "Monitor only"],
      mock: "admin"
    }
  ];

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  document.body.style.margin = "0";
  document.body.style.background = bg;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  function rounded(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function wrap(text, maxWidth, font) {
    ctx.font = font;
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = (line + " " + word).trim();
      if (ctx.measureText(test).width <= maxWidth) line = test;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function text(value, x, y, font, color) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }

  function shell() {
    rounded(700, 110, 480, 500, 16, "#080D12", "rgba(255,255,255,.12)");
    ctx.fillStyle = "#0A1220";
    ctx.fillRect(700, 110, 480, 45);
    ["#EF4444", "#F59E0B", "#22C55E"].forEach((c, i) => {
      ctx.beginPath();
      ctx.arc(731 + i * 24, 132, 6, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
    });
    text("trace.app", 790, 140, "17px Segoe UI", muted);
  }

  function mock(kind, accent) {
    shell();
    const x = 730;
    const y = 198;
    if (kind === "landing") {
      text("Food safety evidence", x, y + 24, "700 34px Segoe UI", white);
      text("with source-bound verdicts", x, y + 66, "700 34px Segoe UI", accent);
      rounded(x, y + 108, 170, 48, 8, accent);
      text("Submit Case", x + 22, y + 138, "17px Segoe UI", bg);
      rounded(x + 190, y + 108, 200, 48, 8, "#111827", accent);
      text("Explore Public", x + 214, y + 138, "17px Segoe UI", accent);
      ["Recall Radar", "Cold Chain", "Evidence Binding"].forEach((label, i) => {
        rounded(x + i * 135, y + 218, 120, 80, 8, "#111827", "rgba(255,255,255,.12)");
        text(label, x + 12 + i * 135, y + 260, "16px Segoe UI", muted);
      });
    }
    if (kind === "form") {
      text("Submit Safety Case", x, y + 24, "700 34px Segoe UI", white);
      ["Case title", "Food category", "Batch / lot", "Safety question"].forEach((label, i) => {
        const yy = y + 80 + i * 64;
        text(label, x, yy - 10, "16px Segoe UI", muted);
        rounded(x, yy, 390, 40, 7, panel, "rgba(255,255,255,.13)");
      });
      rounded(x + 230, y + 350, 160, 44, 8, accent);
      text("Next", x + 290, y + 378, "17px Segoe UI", bg);
    }
    if (kind === "sources") {
      text("Source Provenance", x, y + 24, "700 34px Segoe UI", white);
      [
        ["FDA Recall Notice", "2026-09-12 · product yes · batch yes", accent],
        ["Supplier COA", "2026-09-10 · product yes · batch partial", accent],
        ["Image URL", "excluded · recorded · not adjudicated", "#F59E0B"]
      ].forEach(([a, b, c], i) => {
        const yy = y + 80 + i * 86;
        rounded(x, yy, 405, 64, 8, panel, "rgba(255,255,255,.13)");
        text(a, x + 16, yy + 24, "17px Segoe UI", white);
        text(b, x + 16, yy + 48, "17px Consolas", c);
      });
    }
    if (kind === "verdict") {
      text("Safety Verdict", x, y + 24, "700 34px Segoe UI", white);
      [["hold_required", "#F59E0B"], ["high risk", "#EF4444"], ["82% confidence", "#38BDF8"]].forEach(([label, c], i) => {
        rounded(x + i * 132, y + 62, 120, 40, 20, "#141414", c);
        text(label, x + 12 + i * 132, y + 88, "16px Segoe UI", c);
      });
      ["Evidence quality: medium", "Recall match: possible", "Product binding: specific", "Batch binding: partial"].forEach((label, i) => {
        const yy = y + 145 + i * 52;
        rounded(x, yy, 390, 38, 7, panel, "rgba(255,255,255,.13)");
        text(label, x + 14, yy + 25, "16px Segoe UI", muted);
      });
    }
    if (kind === "privacy") {
      text("Private Case Room", x, y + 24, "700 34px Segoe UI", white);
      ["Private case index", "Owner notes", "Wallet activity", "Audit log"].forEach((label, i) => {
        const yy = y + 80 + i * 62;
        rounded(x, yy, 390, 42, 7, panel, "rgba(255,255,255,.13)");
        text("LOCKED  " + label, x + 16, yy + 27, "16px Segoe UI", "#22C55E");
      });
    }
    if (kind === "admin") {
      text("Admin Monitor", x, y + 24, "700 34px Segoe UI", white);
      [["Total cases", .78, "#38BDF8"], ["Pending verdicts", .42, "#8B5CF6"], ["High risk", .24, "#EF4444"], ["Archived", .16, muted]].forEach(([label, pct, c], i) => {
        const yy = y + 82 + i * 62;
        text(label, x, yy, "16px Segoe UI", muted);
        rounded(x, yy + 24, 390, 12, 6, "rgba(255,255,255,.12)");
        rounded(x, yy + 24, 390 * pct, 12, 6, c);
      });
      text("No verdict override", x, y + 380, "18px Consolas", "#EF4444");
    }
  }

  function drawSlide(index, frameInSlide) {
    const slide = slides[index];
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,.04)";
    for (let gx = 0; gx < W; gx += 48) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 48) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
    const pulse = 18 + 10 * Math.sin((frameInSlide / framesPerSlide) * Math.PI * 2);
    ctx.beginPath();
    ctx.arc(90, 110, pulse, 0, Math.PI * 2);
    ctx.fillStyle = slide.accent + "33";
    ctx.fill();
    rounded(70, 72, 520, 578, 18, "rgba(7,12,18,.95)", "rgba(255,255,255,.12)");
    text(slide.kicker, 105, 126, "18px Consolas", slide.accent);
    let y = 212;
    for (const line of wrap(slide.title, 430, "700 44px Segoe UI")) {
      text(line, 105, y, "700 44px Segoe UI", white);
      y += 52;
    }
    y += 20;
    for (const line of wrap(slide.body, 420, "21px Segoe UI")) {
      text(line, 105, y, "21px Segoe UI", muted);
      y += 29;
    }
    y += 28;
    let x = 105;
    for (const chip of slide.chips) {
      ctx.font = "17px Segoe UI";
      const width = ctx.measureText(chip).width + 30;
      if (x + width > 560) { x = 105; y += 42; }
      rounded(x, y, width, 34, 17, slide.accent + "22", slide.accent + "99");
      text(chip, x + 15, y + 23, "17px Segoe UI", slide.accent);
      x += width + 14;
    }
    mock(slide.mock, slide.accent);
    text(String(index + 1) + "/6", 1070, 680, "26px Consolas", slide.accent);
  }

  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3500000 });
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  recorder.onerror = (event) => reject(event.error || new Error("MediaRecorder failed."));
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Could not read video blob."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  };

  let frame = 0;
  const totalFrames = slides.length * framesPerSlide;
  drawSlide(0, 0);
  recorder.start();
  const timer = setInterval(() => {
    const slideIndex = Math.min(slides.length - 1, Math.floor(frame / framesPerSlide));
    const frameInSlide = frame % framesPerSlide;
    drawSlide(slideIndex, frameInSlide);
    frame += 1;
    if (frame >= totalFrames) {
      clearInterval(timer);
      setTimeout(() => recorder.stop(), 250);
    }
  }, 1000 / fps);
}))()`;

async function main() {
  if (!fs.existsSync(CHROME)) {
    throw new Error(`Chrome not found at ${CHROME}`);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  const userDataDir = path.join(ROOT, ".chrome-video-profile");
  fs.rmSync(userDataDir, { recursive: true, force: true });
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], { stdio: "ignore" });

  try {
    const version = await waitForChrome();
    const browser = new Cdp(version.webSocketDebuggerUrl);
    const target = await browser.send("Target.createTarget", { url: "about:blank" });
    browser.close();

    const targets = await requestJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageInfo = targets.find((item) => item.id === target.targetId) || targets.find((item) => item.type === "page");
    if (!pageInfo) throw new Error("Could not find a Chrome page target.");

    const page = new Cdp(pageInfo.webSocketDebuggerUrl);
    await page.send("Page.enable");
    await page.send("Runtime.enable");
    const result = await page.send("Runtime.evaluate", {
      expression: recordScript,
      awaitPromise: true,
      returnByValue: true,
      timeout: 45000,
    });
    page.close();

    if (result.exceptionDetails) {
      throw new Error(JSON.stringify(result.exceptionDetails));
    }
    const dataUrl = result.result.value;
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:video/webm;base64,")) {
      throw new Error(`Chrome did not return a WebM data URL. Result was: ${JSON.stringify(result.result).slice(0, 500)}`);
    }
    const encoded = dataUrl.replace("data:video/webm;base64,", "");
    fs.writeFileSync(OUT, Buffer.from(encoded, "base64"));
    console.log(OUT);
  } finally {
    chrome.kill();
    setTimeout(() => {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }, 500);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
