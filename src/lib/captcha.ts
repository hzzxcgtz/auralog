// 轻量 SVG 验证码（不依赖 svg-captcha 包，避免打包路径问题）
function generateRandomText(length: number): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function generateSvg(text: string): string {
  const chars = text.split("");
  const width = 120;
  const height = 40;

  // 生成干扰线条
  const lines = Array.from({ length: 3 }, (_, i) => {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#D97706" stroke-width="${0.5 + Math.random()}" opacity="${0.3 + Math.random() * 0.3}"/>`;
  }).join("");

  // 生成字符
  const colorOptions = ["#78350F", "#D97706", "#84CC16"];
  const charElements = chars.map((char, i) => {
    const x = 15 + i * 25 + Math.random() * 5;
    const y = 28 + Math.random() * 8;
    const rotation = (Math.random() - 0.5) * 20;
    const color = colorOptions[i % colorOptions.length];
    return `<text x="${x}" y="${y}" transform="rotate(${rotation},${x},${y})" fill="${color}" font-size="${32 + Math.random() * 8}" font-family="serif" font-weight="bold">${char}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#FFF9F0">
    <rect width="${width}" height="${height}" fill="#FFF9F0" rx="4"/>
    ${lines}
    ${charElements}
  </svg>`;
}

// 内存存储验证码
const captchaStore = new Map<string, { text: string; expires: number }>();

export function generateCaptcha(sessionId: string) {
  const text = generateRandomText(4);
  const svg = generateSvg(text);

  captchaStore.set(sessionId, {
    text: text.toLowerCase(),
    expires: Date.now() + 5 * 60 * 1000,
  });

  return svg;
}

export function validateCaptcha(sessionId: string, input: string): boolean {
  const stored = captchaStore.get(sessionId);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    captchaStore.delete(sessionId);
    return false;
  }
  const isValid = stored.text === input.toLowerCase();
  if (isValid) captchaStore.delete(sessionId);
  return isValid;
}
