// "Share my team" image: draws both pitches on an offscreen canvas and hands
// back a PNG blob. Initials avatars only — remote player photos would taint
// the canvas (CORS) and kill toBlob, and initials keep the card crisp anyway.

export interface ShareSpot {
  name: string;
  pts: number | null;
  captain?: boolean;
}

export interface ShareData {
  teamName: string;
  gw: number;
  myTotal: number;
  myRows: ShareSpot[][]; // GK row first
  toolTotal: number | null;
  toolFormation: string | null;
  toolRows: ShareSpot[][];
  upgrade: string | null;
}

const W = 1080;
const H = 1350;
const BG = '#0B0F1A';
const PANEL = '#111827';
const LINE = '#1F2937';
const TEXT = '#E5E7EB';
const MUTED = '#9CA3AF';
const ACCENT = '#00FF87';
const SANS = 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif';

function initials(name: string): string {
  const parts = name.replace(/[.·]/g, ' ').split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

function drawPitch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  total: string,
  rows: ShareSpot[][]
) {
  // panel
  ctx.fillStyle = PANEL;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.fill();
  ctx.stroke();

  // header
  ctx.fillStyle = TEXT;
  ctx.font = `bold 30px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.fillText(title, x + 28, y + 48);
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'right';
  ctx.fillText(total, x + w - 28, y + 48);

  // faint centre circle for the pitch feel
  ctx.strokeStyle = '#1a2436';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 80 + (h - 110) / 2, 70, 0, Math.PI * 2);
  ctx.stroke();

  const drawn = rows.filter((r) => r.length > 0);
  const rowH = (h - 110) / Math.max(drawn.length, 1);
  drawn.forEach((row, ri) => {
    const cy = y + 80 + rowH * ri + rowH / 2 - 20;
    const spotW = Math.min(w / row.length, 130);
    const start = x + w / 2 - (spotW * row.length) / 2 + spotW / 2;
    row.forEach((s, i) => {
      const cx = start + spotW * i;
      // avatar
      ctx.fillStyle = '#161E2E';
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = TEXT;
      ctx.font = `bold 22px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText(initials(s.name), cx, cy + 8);
      if (s.captain) {
        ctx.fillStyle = ACCENT;
        ctx.beginPath();
        ctx.arc(cx + 24, cy - 24, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#06281a';
        ctx.font = `bold 16px ${SANS}`;
        ctx.fillText('C', cx + 24, cy - 18);
      }
      // name + pts
      ctx.fillStyle = TEXT;
      ctx.font = `600 19px ${SANS}`;
      ctx.fillText(truncate(ctx, s.name, spotW - 10), cx, cy + 58);
      ctx.fillStyle = s.pts === null ? MUTED : ACCENT;
      ctx.font = `bold 18px ${SANS}`;
      ctx.fillText(s.pts === null ? '—' : s.pts.toFixed(1), cx, cy + 82);
    });
  });
}

export async function renderShareImage(d: ShareData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, BG);
  grad.addColorStop(1, '#0d1a15');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // brand
  ctx.fillStyle = '#161E2E';
  ctx.beginPath();
  ctx.roundRect(48, 44, 52, 52, 12);
  ctx.fill();
  const bars: Array<[number, string]> = [
    [14, '#6B7280'],
    [24, '#9CA3AF'],
    [34, ACCENT],
  ];
  bars.forEach(([bh, color], i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(58 + i * 12, 88 - bh, 8, bh, 3);
    ctx.fill();
  });
  ctx.textAlign = 'left';
  ctx.font = `bold 40px ${SANS}`;
  ctx.fillStyle = TEXT;
  ctx.fillText('fpl', 116, 82);
  ctx.fillStyle = ACCENT;
  ctx.fillText('analytic', 116 + ctx.measureText('fpl').width, 82);
  ctx.fillStyle = MUTED;
  ctx.font = `bold 28px ${SANS}`;
  ctx.textAlign = 'right';
  ctx.fillText(`GW${d.gw} · My Team`, W - 48, 78);

  // team name
  ctx.fillStyle = TEXT;
  ctx.font = `900 54px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.fillText(truncate(ctx, d.teamName, W - 96), 48, 170);

  // two pitches
  const pitchY = 210;
  const pitchH = 940;
  drawPitch(ctx, 48, pitchY, 480, pitchH, 'Your XI', `${d.myTotal.toFixed(1)} pts`, d.myRows);
  drawPitch(
    ctx,
    552,
    pitchY,
    480,
    pitchH,
    d.toolFormation ? `Predicted XI · ${d.toolFormation}` : 'Predicted XI',
    d.toolTotal === null ? '' : `${d.toolTotal.toFixed(1)} pts`,
    d.toolRows
  );

  // footer
  if (d.upgrade) {
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 26px ${SANS}`;
    ctx.textAlign = 'left';
    ctx.fillText(truncate(ctx, `Biggest upgrade: ${d.upgrade}`, W - 400), 48, H - 72);
  }
  ctx.fillStyle = MUTED;
  ctx.font = `600 26px ${SANS}`;
  ctx.textAlign = 'right';
  ctx.fillText('fplanalytic.com/my-team', W - 48, H - 72);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}
