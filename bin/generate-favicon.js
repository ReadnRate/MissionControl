const fs = require('fs');

const svgIcon = `<svg xmlns="http://www.svg.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="120" fill="#0f172a"/>
  <path d="M256 96L106 182.5V329.5L256 416L406 329.5V182.5L256 96ZM256 368L152 308V204L256 144L360 204V308L256 368Z" fill="#22d3ee"/>
  <circle cx="256" cy="256" r="48" fill="#e2e8f0"/>
</svg>`;

fs.writeFileSync('/data/.openclaw/workspace/mission-control-next/public/favicon.svg', svgIcon);
// Next.js 13+ supports icon.svg natively in the app directory, but public/favicon.svg works as a fallback.
// Let's also create an icon.svg in the app dir for modern App Router support.
fs.writeFileSync('/data/.openclaw/workspace/mission-control-next/src/app/icon.svg', svgIcon);

console.log("SVG favicon created!");
