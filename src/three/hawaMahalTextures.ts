import * as THREE from 'three';

export function createJaipurSandstoneTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const cColor = document.createElement('canvas');
  cColor.width = 512;
  cColor.height = 512;
  const ctx = cColor.getContext('2d')!;

  const cBump = document.createElement('canvas');
  cBump.width = 512;
  cBump.height = 512;
  const bCtx = cBump.getContext('2d')!;

  // Terracotta-pink Jaipur sandstone base
  ctx.fillStyle = '#D97C68';
  ctx.fillRect(0, 0, 512, 512);

  bCtx.fillStyle = '#8A8A8A';
  bCtx.fillRect(0, 0, 512, 512);

  // Masonry courses with subtle tone variation
  const rows = 8;
  const rowH = 512 / rows;
  for (let r = 0; r < rows; r++) {
    const cols = 4;
    const colW = 512 / cols;
    const offset = (r % 2) * (colW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + offset;
      const y = r * rowH;
      const toneShift = ((r * 7 + c * 13) % 5) - 2;
      const red = Math.min(240, 214 + toneShift * 5);
      const green = Math.min(180, 122 + toneShift * 4);
      const blue = Math.min(165, 102 + toneShift * 3);
      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);

      const bumpShade = 132 + toneShift * 8;
      bCtx.fillStyle = `rgb(${bumpShade}, ${bumpShade}, ${bumpShade})`;
      bCtx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
    }

    // Fine white chuna mortar seam
    ctx.strokeStyle = 'rgba(249, 237, 224, 0.34)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, r * rowH);
    ctx.lineTo(512, r * rowH);
    ctx.stroke();

    bCtx.strokeStyle = '#4A4A4A';
    bCtx.lineWidth = 2;
    bCtx.beginPath();
    bCtx.moveTo(0, r * rowH);
    bCtx.lineTo(512, r * rowH);
    bCtx.stroke();
  }

  // Natural quarry grain & warm sun flecks
  for (let i = 0; i < 1800; i++) {
    const px = (i * 73) % 512;
    const py = (i * 197) % 512;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 225, 200, 0.14)' : 'rgba(92, 42, 34, 0.12)';
    ctx.fillRect(px, py, 2, 2);
    bCtx.fillStyle = i % 2 === 0 ? 'rgba(200,200,200,0.18)' : 'rgba(80,80,80,0.18)';
    bCtx.fillRect(px, py, 2, 2);
  }

  const map = new THREE.CanvasTexture(cColor);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(cBump);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createJaaliLatticeTexture(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  alphaMap: THREE.CanvasTexture;
} {
  const cColor = document.createElement('canvas');
  cColor.width = 512;
  cColor.height = 512;
  const ctx = cColor.getContext('2d')!;

  const cAlpha = document.createElement('canvas');
  cAlpha.width = 512;
  cAlpha.height = 512;
  const aCtx = cAlpha.getContext('2d')!;

  // Solid sandstone screen frame + warm chuna lime border
  ctx.fillStyle = '#E08873';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#FAF0E2';
  ctx.lineWidth = 18;
  ctx.strokeRect(10, 10, 492, 492);

  aCtx.fillStyle = '#FFFFFF';
  aCtx.fillRect(0, 0, 512, 512);

  // Carved geometric diamond/octagonal jaali perforations
  const cols = 6;
  const rows = 6;
  const cellW = 420 / cols;
  const cellH = 420 / rows;
  const startX = 46;
  const startY = 46;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = startX + c * cellW + cellW / 2;
      const cy = startY + r * cellH + cellH / 2;

      // White chuna filigree outline
      ctx.strokeStyle = '#F7ECDD';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 22);
      ctx.lineTo(cx + 18, cy);
      ctx.lineTo(cx, cy + 22);
      ctx.lineTo(cx - 18, cy);
      ctx.closePath();
      ctx.stroke();

      // Perforation hole (black in alphaMap = transparent void)
      ctx.fillStyle = '#2B1510';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 17);
      ctx.lineTo(cx + 14, cy);
      ctx.lineTo(cx, cy + 17);
      ctx.lineTo(cx - 14, cy);
      ctx.closePath();
      ctx.fill();

      aCtx.fillStyle = '#000000';
      aCtx.beginPath();
      aCtx.moveTo(cx, cy - 17);
      aCtx.lineTo(cx + 14, cy);
      aCtx.lineTo(cx, cy + 17);
      aCtx.lineTo(cx - 14, cy);
      aCtx.closePath();
      aCtx.fill();
    }
  }

  const map = new THREE.CanvasTexture(cColor);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const alphaMap = new THREE.CanvasTexture(cAlpha);
  alphaMap.colorSpace = THREE.NoColorSpace;
  alphaMap.anisotropy = maxAnisotropy;

  return { map, alphaMap };
}

export function createStainedGlassTexture(
  jewelColors: [string, string, string, string],
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2B1914';
  ctx.fillRect(0, 0, 512, 512);

  // Arch field divided into jewel-toned Belgian glass mosaic panes
  const panes = 4;
  const w = 440 / panes;
  const h = 440 / panes;
  for (let r = 0; r < panes; r++) {
    for (let c = 0; c < panes; c++) {
      const color = jewelColors[(r + c) % jewelColors.length];
      const px = 36 + c * w;
      const py = 36 + r * h;
      const grad = ctx.createRadialGradient(
        px + w * 0.5,
        py + h * 0.5,
        6,
        px + w * 0.5,
        py + h * 0.5,
        w * 0.65
      );
      grad.addColorStop(0, '#FFF8E7');
      grad.addColorStop(0.35, color);
      grad.addColorStop(1, '#1E110E');
      ctx.fillStyle = grad;
      ctx.fillRect(px + 4, py + 4, w - 8, h - 8);
    }
  }

  // Central lotus medallion
  ctx.strokeStyle = '#C9A227';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 256, 92, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.fillStyle = jewelColors[i % jewelColors.length];
    ctx.beginPath();
    ctx.ellipse(
      256 + Math.cos(a) * 52,
      256 + Math.sin(a) * 52,
      28,
      14,
      a,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#DFBA44';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createCourtyardMosaicTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#EFE3CF';
  ctx.fillRect(0, 0, 1024, 1024);

  const tiles = 16;
  const size = 1024 / tiles;
  for (let r = 0; r < tiles; r++) {
    for (let c = 0; c < tiles; c++) {
      const isAlt = (r + c) % 2 === 0;
      ctx.fillStyle = isAlt ? '#F5EAD7' : '#D98E79';
      ctx.fillRect(c * size + 2, r * size + 2, size - 4, size - 4);

      // Diamond marble inlay center
      if ((r + c) % 4 === 0) {
        const cx = c * size + size / 2;
        const cy = r * size + size / 2;
        ctx.fillStyle = '#B3123F';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 11);
        ctx.lineTo(cx + 11, cy);
        ctx.lineTo(cx, cy + 11);
        ctx.lineTo(cx - 11, cy);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Subtle sandstone grout lines
  ctx.strokeStyle = 'rgba(72, 34, 24, 0.22)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= tiles; i++) {
    ctx.beginPath();
    ctx.moveTo(i * size, 0);
    ctx.lineTo(i * size, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * size);
    ctx.lineTo(1024, i * size);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createSunbeamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const vert = ctx.createLinearGradient(0, 0, 0, 512);
  vert.addColorStop(0, 'rgba(255, 232, 185, 0.52)');
  vert.addColorStop(0.55, 'rgba(255, 212, 148, 0.22)');
  vert.addColorStop(1, 'rgba(255, 200, 130, 0.0)');
  ctx.fillStyle = vert;
  ctx.fillRect(0, 0, 256, 512);

  // Feather horizontal edges with radial/linear mask
  ctx.globalCompositeOperation = 'destination-in';
  const horiz = ctx.createLinearGradient(0, 0, 256, 0);
  horiz.addColorStop(0, 'rgba(0,0,0,0)');
  horiz.addColorStop(0.28, 'rgba(0,0,0,1)');
  horiz.addColorStop(0.72, 'rgba(0,0,0,1)');
  horiz.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = horiz;
  ctx.fillRect(0, 0, 256, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSoftParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.45, 'rgba(255, 236, 195, 0.65)');
  grad.addColorStop(1, 'rgba(255, 220, 170, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
