import * as THREE from 'three';
import { CoffeeOrigin, CoffeeWeight, GrindType, BagFinish } from '../types';
import { GRIND_OPTIONS } from '../constants/coffeeData';

export function createLabelTexture(
  origin: CoffeeOrigin,
  weight: CoffeeWeight,
  grind: GrindType,
  finish: BagFinish,
  renderer?: THREE.WebGLRenderer
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d')!;

  drawLabelOnContext(ctx, canvas.width, canvas.height, origin, weight, grind, finish);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (renderer) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function updateLabelTexture(
  texture: THREE.CanvasTexture,
  origin: CoffeeOrigin,
  weight: CoffeeWeight,
  grind: GrindType,
  finish: BagFinish
) {
  const canvas = texture.image as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  drawLabelOnContext(ctx, canvas.width, canvas.height, origin, weight, grind, finish);
  texture.needsUpdate = true;
}

function drawLabelOnContext(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  origin: CoffeeOrigin,
  weight: CoffeeWeight,
  grind: GrindType,
  finish: BagFinish
) {
  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // Background tone: paper/cream or kraft
  const isKraft = finish === 'kraft';
  ctx.fillStyle = isKraft ? '#D9B992' : origin.labelBg;
  ctx.fillRect(0, 0, w, h);

  // Subtle paper texture grain
  ctx.fillStyle = isKraft ? 'rgba(70, 45, 20, 0.04)' : 'rgba(0, 0, 0, 0.02)';
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * w;
    const ry = Math.random() * h;
    const rw = 2 + Math.random() * 4;
    const rh = 1 + Math.random() * 2;
    ctx.fillRect(rx, ry, rw, rh);
  }

  // Elegant double inner border
  const margin = 48;
  ctx.strokeStyle = isKraft ? 'rgba(60, 40, 25, 0.6)' : 'rgba(40, 30, 25, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

  ctx.lineWidth = 1;
  ctx.strokeRect(margin + 8, margin + 8, w - (margin + 8) * 2, h - (margin + 8) * 2);

  // Top header color accent bar
  ctx.fillStyle = origin.color;
  ctx.fillRect(margin + 16, margin + 16, w - (margin + 16) * 2, 16);

  // Roastery header
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isKraft ? '#2B1C10' : '#1F1714';

  ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('• Z I A R E N K O •', w / 2, 120);

  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = isKraft ? 'rgba(43, 28, 16, 0.75)' : '#7A6B63';
  ctx.fillText('RZEMIEŚLNICZA PALARNIA KAWY SPECIALITY', w / 2, 158);

  // Thin dividing line
  ctx.strokeStyle = isKraft ? 'rgba(60, 40, 25, 0.25)' : 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 180, 190);
  ctx.lineTo(w / 2 + 180, 190);
  ctx.stroke();

  // Origin Name Badge (Terracotta / Emerald / Amber)
  const badgeY = 245;
  const badgeH = 76;
  const badgeW = 440;
  ctx.fillStyle = origin.color;
  ctx.beginPath();
  ctx.roundRect(w / 2 - badgeW / 2, badgeY, badgeW, badgeH, 12);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 46px "Playfair Display", Georgia, serif';
  ctx.fillText(origin.name.toUpperCase(), w / 2, badgeY + badgeH / 2 + 2);

  // Region / Farm Subtitle
  ctx.fillStyle = isKraft ? '#311E13' : '#2A1F1A';
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(origin.region, w / 2, 360);

  ctx.fillStyle = isKraft ? 'rgba(49, 30, 19, 0.7)' : '#6D5D55';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(origin.country, w / 2, 395);

  // Tasting Notes Banner (Artisanal flavour tags)
  const notesY = 445;
  ctx.fillStyle = isKraft ? 'rgba(60, 40, 25, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  ctx.beginPath();
  ctx.roundRect(margin + 28, notesY, w - (margin + 28) * 2, 170, 16);
  ctx.fill();

  ctx.fillStyle = origin.color;
  ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('NUTY SMAKOWE / FLAVOUR PROFILE', w / 2, notesY + 36);

  // Render 4 tasting notes as individual pill badges inside the canvas
  const noteList = origin.tastingNotes;
  const pillsY1 = notesY + 76;
  const pillsY2 = notesY + 124;

  const drawNotePill = (text: string, cx: number, cy: number) => {
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(text).width;
    const pillW = textW + 36;
    const pillH = 36;

    ctx.fillStyle = isKraft ? 'rgba(255, 255, 255, 0.55)' : '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(cx - pillW / 2, cy - pillH / 2, pillW, pillH, 18);
    ctx.fill();

    ctx.strokeStyle = isKraft ? 'rgba(60, 40, 25, 0.2)' : 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isKraft ? '#2A180E' : '#2C221D';
    ctx.fillText(text, cx, cy + 2);
  };

  drawNotePill(noteList[0] || '', w / 2 - 160, pillsY1);
  drawNotePill(noteList[1] || '', w / 2 + 160, pillsY1);
  drawNotePill(noteList[2] || '', w / 2 - 160, pillsY2);
  drawNotePill(noteList[3] || '', w / 2 + 160, pillsY2);

  // Technical Specs Grid (Odmiana, Wysokość, Obróbka, Stopień palenia)
  const specY = 660;
  const col1X = margin + 44;
  const col2X = w / 2 + 20;

  const renderSpecRow = (label: string, val: string, x: number, y: number) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = isKraft ? 'rgba(40, 25, 15, 0.65)' : '#7C6C63';
    ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label.toUpperCase(), x, y);

    ctx.fillStyle = isKraft ? '#24150B' : '#1A1412';
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(val, x, y + 28);
  };

  renderSpecRow('Odmiana botaniczna', origin.varietal, col1X, specY);
  renderSpecRow('Wysokość upraw', origin.altitude, col2X, specY);

  renderSpecRow('Metoda obróbki', origin.process, col1X, specY + 80);
  renderSpecRow('Stopień wypału', `${origin.roastLevel} (${origin.roastScore}/5)`, col2X, specY + 80);

  // Roast dots indicator
  const dotsY = specY + 140;
  ctx.textAlign = 'left';
  ctx.fillStyle = isKraft ? 'rgba(40, 25, 15, 0.65)' : '#7C6C63';
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SKALA PALENIA:', col1X, dotsY);

  for (let i = 1; i <= 5; i++) {
    ctx.beginPath();
    ctx.arc(col1X + 130 + (i - 1) * 32, dotsY - 5, 8, 0, Math.PI * 2);
    if (i <= origin.roastScore) {
      ctx.fillStyle = origin.color;
      ctx.fill();
    } else {
      ctx.strokeStyle = isKraft ? 'rgba(40, 25, 15, 0.4)' : '#C4B8B0';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Grind type chosen
  const grindObj = GRIND_OPTIONS.find(g => g.id === grind);
  const grindText = grindObj ? grindObj.label.toUpperCase() : 'CAŁE ZIARNA';

  ctx.textAlign = 'left';
  ctx.fillStyle = isKraft ? 'rgba(40, 25, 15, 0.65)' : '#7C6C63';
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PRZEZNACZENIE / MIELENIE:', col1X, dotsY + 54);

  ctx.fillStyle = isKraft ? '#24150B' : '#1A1412';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(grindText, col1X, dotsY + 84);

  // Divider line above footer
  ctx.strokeStyle = isKraft ? 'rgba(60, 40, 25, 0.3)' : 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.moveTo(margin + 20, 1140);
  ctx.lineTo(w - margin - 20, 1140);
  ctx.stroke();

  // Bottom footer: Weight badge and Fresh Roast guarantee
  const footerY = 1240;

  // Weight Stamp
  const weightBadgeW = 240;
  const weightBadgeH = 92;
  const weightBadgeX = margin + 30;
  ctx.fillStyle = isKraft ? 'rgba(50, 30, 15, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  ctx.beginPath();
  ctx.roundRect(weightBadgeX, footerY - 50, weightBadgeW, weightBadgeH, 12);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = isKraft ? 'rgba(40, 25, 15, 0.6)' : '#75655D';
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('MASA NETTO', weightBadgeX + weightBadgeW / 2, footerY - 24);

  const displayWeight = weight === '1000g' ? '1000 g' : weight.replace('g', ' g');
  ctx.fillStyle = origin.color;
  ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(displayWeight, weightBadgeX + weightBadgeW / 2, footerY + 18);

  // Freshness & Artisan Seal
  ctx.textAlign = 'right';
  ctx.fillStyle = isKraft ? '#2A180E' : '#221915';
  ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('100% ARABICA SPECIALITY', w - margin - 30, footerY - 20);

  ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = isKraft ? 'rgba(42, 24, 14, 0.7)' : '#74645C';
  ctx.fillText('Świeżo palone w małych partiach', w - margin - 30, footerY + 6);
  ctx.fillText('Ziarenko Coffee Roastery • Polska', w - margin - 30, footerY + 30);

  // Degassing valve reminder mark
  ctx.textAlign = 'center';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = isKraft ? 'rgba(42, 24, 14, 0.5)' : '#9E8E84';
  ctx.fillText('Zawór jednostronny chroniący świeżość i aromat ziaren', w / 2, h - margin - 18);
}
