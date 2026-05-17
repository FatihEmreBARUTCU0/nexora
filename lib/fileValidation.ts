const SIGNATURES: { mime: string; check: (buf: Buffer) => boolean }[] = [
  {
    mime: "image/jpeg",
    check: (buf) => buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  {
    mime: "image/png",
    check: (buf) =>
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47,
  },
  {
    mime: "image/gif",
    check: (buf) =>
      buf.subarray(0, 6).toString("ascii") === "GIF87a" ||
      buf.subarray(0, 6).toString("ascii") === "GIF89a",
  },
  {
    mime: "image/webp",
    check: (buf) =>
      buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

export function detectImageMime(buffer: Buffer): string | null {
  for (const { mime, check } of SIGNATURES) {
    if (check(buffer)) return mime;
  }
  return null;
}
