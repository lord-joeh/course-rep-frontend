const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcInput);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const bgR = 15, bgG = 23, bgB = 42; // #0f172a
  const accentR = 59, accentG = 130, accentB = 246; // #3b82f6
  const textR = 255, textG = 255, textB = 255; // #ffffff

  const radius = isMaskable ? 0 : Math.floor(width * 0.22);
  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      let r = bgR, g = bgG, b = bgB, a = 255;

      // Rounded rectangle for standard icons
      if (!isMaskable) {
        let dx = Math.max(0, Math.abs(x - cx) - (cx - radius));
        let dy = Math.max(0, Math.abs(y - cy) - (cy - radius));
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) {
          a = 0; // transparent
        }
      }

      // Center decorative badge / square (accent color)
      const badgeW = width * 0.55;
      const badgeH = height * 0.55;
      if (
        x >= cx - badgeW / 2 &&
        x <= cx + badgeW / 2 &&
        y >= cy - badgeH / 2 &&
        y <= cy + badgeH / 2 &&
        a > 0
      ) {
        let bdx = Math.max(0, Math.abs(x - cx) - (badgeW / 2 - radius * 0.5));
        let bdy = Math.max(0, Math.abs(y - cy) - (badgeH / 2 - radius * 0.5));
        if (Math.sqrt(bdx * bdx + bdy * bdy) <= radius * 0.5) {
          r = accentR;
          g = accentG;
          b = accentB;
        }
      }

      // Stylized 'CR' monogram
      const relX = (x - cx) / (width * 0.35);
      const relY = (y - cy) / (height * 0.35);

      const inC = (
        relX >= -0.7 && relX <= -0.1 &&
        relY >= -0.6 && relY <= 0.6 &&
        (
          relX <= -0.45 ||
          relY <= -0.35 ||
          relY >= 0.35
        )
      );

      const inR = (
        relX >= 0.1 && relX <= 0.7 &&
        relY >= -0.6 && relY <= 0.6 &&
        (
          relX <= 0.32 ||
          (relY <= -0.38 && relX <= 0.62) ||
          (relY >= -0.08 && relY <= 0.12 && relX <= 0.62) ||
          (relX >= 0.45 && relY <= 0.05 && relY >= -0.5) ||
          (relX >= 0.32 && relY >= 0.05 && Math.abs((relX - 0.32)/(0.38) - (relY - 0.05)/(0.55)) < 0.28)
        )
      );

      if ((inC || inR) && a > 0) {
        r = textR;
        g = textG;
        b = textB;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(__dirname, '../public');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));
console.log('PWA icons created successfully in public directory');
