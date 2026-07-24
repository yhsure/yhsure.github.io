import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";
import jsQR from "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/+esm";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const defaults = { payload: "https://yhsure.github.io/qr-art/", preset: "nocturne", strength: 78, mark: "tile", correction: "H", dither: true, size: 1024, format: "png" };
const state = { ...defaults, image: null, output: null };
const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
const mix = (a, b, t) => a.map((v, i) => clamp(v + (b[i] - v) * t));
const hash = (x, y) => {
  const n = Math.sin(x * 91.7 + y * 173.3) * 43758.5453;
  return n - Math.floor(n);
};

function scenePixel(scene, x, y, w) {
  const u = x / w;
  const v = y / w;
  const grain = (hash(x, y) - 0.5) * 12;
  let c = [236, 224, 190];
  if (scene === "nocturne") {
    c = mix([19, 36, 58], [75, 104, 125], v);
    if (v > .62) c = mix([35, 65, 73], [16, 43, 53], (v - .62) / .38);
    if (Math.hypot(u - .72, v - .23) < .11) c = [235, 192, 105];
    if (v > .48 + Math.sin(u * 13) * .04) c = [38, 65, 69];
    if (v > .67 && Math.abs(u - .72) < (1 - v) * .13 && y % 4 < 2) c = [166, 143, 89];
    if (hash(x * 3, y * 2) > .988 && v < .55) c = [232, 220, 177];
  }
  if (scene === "pond") {
    c = mix([25, 91, 94], [119, 151, 125], v);
    if ((y + Math.floor(Math.sin(x / 4) * 2)) % 12 < 2) c = mix(c, [205, 219, 181], .28);
    const koi = ((u - .61) / .23) ** 2 + ((v - .46 - Math.sin(u * 8) * .05) / .075) ** 2;
    if (koi < 1) c = koi < .35 ? [243, 193, 121] : [211, 80, 55];
    if (Math.hypot(u - .23, v - .25) < .14 && !(u > .23 && v < .25)) c = [102, 135, 76];
    if (Math.hypot(u - .32, v - .77) < .09) c = [130, 155, 90];
  }
  if (scene === "orchard") {
    c = v < .52 ? mix([232, 214, 166], [193, 202, 151], v * 2) : [118, 135, 76];
    if (Math.abs(u - .5) < .07 && v > .32) c = [100, 69, 47];
    if ([[.34, .31], [.5, .22], [.64, .32], [.48, .39]].some(([a, b]) => Math.hypot(u - a, v - b) < .2)) c = [86, 117 + ((x + y) % 3) * 8, 66];
    if (hash(x * 4, y * 5) > .975 && v < .52 && v > .12 && u > .22 && u < .77) c = [174, 56, 42];
    if (v > .76 && (x + y) % 13 < 2) c = [204, 174, 101];
  }
  if (scene === "dusk") {
    c = mix([75, 39, 79], [235, 129, 86], v);
    if (Math.hypot(u - .31, v - .43) < .13) c = [244, 194, 105];
    if (v > .64 - Math.sin(u * 8) * .08) c = [49, 45, 66];
    if (v > .78) c = [34, 45, 58];
    if (v > .79 && y % 6 < 2) c = mix(c, [212, 113, 78], .32);
  }
  if (scene === "lattice") {
    c = (Math.floor(u * 6) + Math.floor(v * 6)) % 2 ? [224, 205, 159] : [201, 184, 141];
    if (Math.hypot(u - .28, v - .27) < .18) c = [185, 73, 54];
    if (u > .53 && u < .79 && v > .12 && v < .58) c = [24, 65, 79];
    if (u > .18 && u < .48 && v > .59 && v < .84) c = [211, 162, 74];
    if ((x + y) % 19 < 2) c = mix(c, [248, 238, 211], .28);
  }
  if (scene === "wildflower") {
    c = v < .58 ? mix([239, 224, 190], [218, 207, 163], v) : [127, 139, 78];
    [.18, .33, .53, .71, .84].forEach((s, i) => {
      if (Math.abs(u - s - Math.sin(v * 10 + i) * .018) < .012 && v > .31) c = [72, 103, 59];
      if (Math.hypot(u - s, v - (.34 + (i % 3) * .08)) < .055) c = i % 2 ? [214, 91, 67] : [222, 163, 66];
    });
    if (v > .72 && hash(x * 2, y * 3) > .91) c = [224, 202, 125];
  }
  return c.map((n) => clamp(n + grain));
}

function alignments(version, size) {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + count * 2 + 1) / (count * 2 - 2)) * 2;
  const result = [6];
  for (let p = size - 7; result.length < count; p -= step) result.splice(1, 0, p);
  return result;
}

function fixed(row, col, size, version) {
  if ((row < 9 && col < 9) || (row < 9 && col > size - 9) || (row > size - 9 && col < 9)) return true;
  if ((row === 6 && col >= 8 && col < size - 8) || (col === 6 && row >= 8 && row < size - 8)) return true;
  if ((row === 8 && (col <= 8 || col >= size - 8)) || (col === 8 && (row <= 8 || row >= size - 7))) return true;
  if (version >= 7 && ((row < 6 && col > size - 12) || (col < 6 && row > size - 12))) return true;
  return alignments(version, size).some((a) => alignments(version, size).some((b) =>
    Math.abs(row - a) <= 2 && Math.abs(col - b) <= 2 &&
    !((a === 6 && b === 6) || (a === 6 && b === size - 7) || (a === size - 7 && b === 6))
  ));
}

function artLayer(side) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (state.image) {
    const ratio = Math.max(side / state.image.width, side / state.image.height);
    const w = state.image.width * ratio;
    const h = state.image.height * ratio;
    ctx.drawImage(state.image, (side - w) / 2, (side - h) / 2, w, h);
  } else {
    const data = ctx.createImageData(side, side);
    for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
      const c = scenePixel(state.preset, x, y, side);
      data.data.set([...c, 255], (y * side + x) * 4);
    }
    ctx.putImageData(data, 0, 0);
  }
  return canvas;
}

function status(kind, text) {
  const node = $("#scan-state");
  node.className = `scan-state ${kind}`;
  node.querySelector("b").textContent = text;
}

function render() {
  const payload = state.payload.trim();
  if (!payload) return;
  status("checking", "Checking with an independent decoder…");
  try {
    const qr = QRCode.create(payload, { errorCorrectionLevel: state.correction });
    const modules = qr.modules.data;
    const count = qr.modules.size;
    const version = qr.version;
    const cell = 12;
    const quiet = cell * 4;
    const side = count * cell + quiet * 2;
    const canvas = $("#canvas");
    canvas.width = canvas.height = side;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#f3efe4";
    ctx.fillRect(0, 0, side, side);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(artLayer(count * 3), quiet, quiet, count * cell, count * cell);
    const pixels = ctx.getImageData(0, 0, side, side).data;
    const t = state.strength / 100;
    const alpha = .42 + t * .52;
    const weight = state.mark === "pinpoint" ? 4 + Math.round(t * 2) : state.mark === "cross" ? 7 : 4 + Math.round(t * 5);
    for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) {
      const dark = Boolean(modules[row * count + col]);
      const x = quiet + col * cell;
      const y = quiet + row * cell;
      const stable = fixed(row, col, count, version);
      const sample = ((y + 6) * side + x + 6) * 4;
      const base = [pixels[sample], pixels[sample + 1], pixels[sample + 2]];
      const target = dark ? [18, 20, 17] : [247, 243, 233];
      const color = stable ? target : mix(base, target, alpha);
      ctx.fillStyle = `rgb(${color.join(",")})`;
      if (stable) ctx.fillRect(x, y, cell, cell);
      else if (state.mark === "cross") {
        const a = Math.floor((cell - weight) / 2);
        ctx.fillRect(x + a, y + 4, weight, 4);
        ctx.fillRect(x + 4, y + a, 4, weight);
      } else {
        const a = Math.floor((cell - weight) / 2);
        ctx.fillRect(x + a, y + a, weight, weight);
      }
      if (state.dither && !stable && (row * 5 + col * 3) % 7 === 0) {
        const dx = (row + col) % 2 ? 1 : 9;
        const dy = row % 2 ? 9 : 1;
        ctx.globalAlpha = .56;
        ctx.fillRect(x + dx, y + dy, 2, 2);
        ctx.globalAlpha = 1;
      }
    }
    const output = document.createElement("canvas");
    output.width = output.height = state.size;
    const out = output.getContext("2d", { willReadFrequently: true });
    out.imageSmoothingEnabled = false;
    out.drawImage(canvas, 0, 0, state.size, state.size);
    state.output = output;
    $("#matrix").textContent = `${count} × ${count}`;
    $("#version").textContent = version;
    setTimeout(() => {
      const result = jsQR(out.getImageData(0, 0, state.size, state.size).data, state.size, state.size, { inversionAttempts: "dontInvert" });
      status(result?.data === payload ? "verified" : "weak", result?.data === payload ? "Scan verified · payload matches" : "Not verified · raise scannability");
    }, 50);
  } catch {
    status("error", "Payload is too long for this correction level");
  }
}

function download() {
  if (!state.output) return;
  const name = `gridproof-${$("#matrix").textContent.split(" ")[0]}`;
  if (state.format === "svg") {
    const png = state.output.toDataURL("image/png");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${state.size}" height="${state.size}"><image width="${state.size}" height="${state.size}" href="${png}"/></svg>`;
    save(new Blob([svg], { type: "image/svg+xml" }), `${name}.svg`);
  } else state.output.toBlob((blob) => blob && save(blob, `${name}.${state.format}`), `image/${state.format}`, .96);
}

function save(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function load(file) {
  if (!file?.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      state.image = image;
      $("#dropzone").classList.add("loaded");
      $("#upload-label").textContent = "Custom art";
      $("#upload-name").textContent = file.name;
      $$(".preset").forEach((b) => b.classList.remove("active"));
      render();
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

$("#payload").addEventListener("input", (e) => {
  state.payload = e.target.value;
  $("#count").textContent = `${state.payload.length} characters`;
  render();
});
$$(".preset").forEach((button) => button.addEventListener("click", () => {
  state.preset = button.dataset.preset;
  state.image = null;
  $$(".preset").forEach((b) => b.classList.toggle("active", b === button));
  $("#dropzone").classList.remove("loaded");
  $("#upload-label").textContent = "Custom artwork";
  $("#upload-name").textContent = "Upload artwork";
  render();
}));
$("#strength").addEventListener("input", (e) => {
  state.strength = Number(e.target.value);
  $("#strength-label").textContent = state.strength;
  render();
});
$("#marks").addEventListener("click", (e) => {
  const button = e.target.closest("button");
  if (!button) return;
  state.mark = button.dataset.mark;
  $$("#marks button").forEach((b) => b.classList.toggle("active", b === button));
  render();
});
$("#correction").addEventListener("change", (e) => {
  state.correction = e.target.value;
  $("#correction-label").textContent = state.correction === "H" ? "High · 30%" : state.correction === "Q" ? "Quartile · 25%" : "Medium · 15%";
  render();
});
$("#dither").addEventListener("change", (e) => { state.dither = e.target.checked; render(); });
$("#format").addEventListener("change", (e) => {
  state.format = e.target.value;
  $("#download").innerHTML = `Download ${state.format.toUpperCase()} <span>↓</span>`;
});
$("#size").addEventListener("change", (e) => { state.size = Number(e.target.value); render(); });
$("#upload").addEventListener("change", (e) => load(e.target.files[0]));
$("#dropzone").addEventListener("dragover", (e) => e.preventDefault());
$("#dropzone").addEventListener("drop", (e) => { e.preventDefault(); load(e.dataTransfer.files[0]); });
$("#download").addEventListener("click", download);
$("#copy").addEventListener("click", () => state.output?.toBlob(async (blob) => {
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    status("verified", "PNG copied to clipboard");
  } catch {
    status("weak", "Clipboard blocked · use download");
  }
}));
$("#reset").addEventListener("click", () => {
  Object.assign(state, defaults, { image: null });
  $("#payload").value = defaults.payload;
  $("#count").textContent = "32 characters";
  $("#strength").value = defaults.strength;
  $("#strength-label").textContent = defaults.strength;
  $("#correction").value = defaults.correction;
  $("#correction-label").textContent = "High · 30%";
  $("#dither").checked = true;
  $("#format").value = defaults.format;
  $("#size").value = defaults.size;
  $("#download").innerHTML = "Download PNG <span>↓</span>";
  $$(".preset").forEach((b) => b.classList.toggle("active", b.dataset.preset === defaults.preset));
  $$("#marks button").forEach((b) => b.classList.toggle("active", b.dataset.mark === defaults.mark));
  $("#dropzone").classList.remove("loaded");
  $("#upload-label").textContent = "Custom artwork";
  $("#upload-name").textContent = "Upload artwork";
  render();
});

render();
