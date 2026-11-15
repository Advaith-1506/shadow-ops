/*
 * LEVEL ART
 * Procedural, original artwork for the roofless top-down safehouse. Static
 * layers are painted once per scale into offscreen canvases:
 *   floor  – exterior, room floors, non-blocking decor, soft drop shadows
 *   solids – walls (top face + south face for depth) and furniture
 * Geometry always comes from the simulation's wall list, so what is drawn as
 * solid is exactly what collides and blocks sight.
 */

const OUTLINE_HOUSE = '#4a3728';
const OUTLINE_OFFICE = '#2a3544';

const PAL = {
  grass: '#8dbd66',
  grassStripe: '#95c46e',
  grassTuft: '#76a853',
  hedge: '#5b8c43',
  hedgeLight: '#6fa452',
  wallTopInner: '#f1e4c7',
  wallSideInner: '#b9966c',
  wallTopOuter: '#e8d3aa',
  wallSideOuter: '#a8825a',
  wallCap: '#f7ebd0',
  // Corporate (Meridian Office)
  asphalt: '#3a424c',
  asphaltStripe: '#444d58',
  sidewalk: '#8a939e',
  curb: '#f0d45a',
  officeWallTop: '#c5ced8',
  officeWallSide: '#5c6b7a',
  officeWallOuterTop: '#d2dae3',
  officeWallOuterSide: '#4a5866',
  officeWallCap: '#e8eef4',
};

function isCorporate(level) {
  return level?.theme === 'corporate';
}

function outlineColor(level) {
  return isCorporate(level) ? OUTLINE_OFFICE : OUTLINE_HOUSE;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

function clipRect(ctx, r, fn) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  fn();
  ctx.restore();
}

// ─── Floors ───────────────────────────────────────────────────────────────────
const FLOORS = {
  wood(ctx, r, rand) {
    ctx.fillStyle = '#c4874f';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    const tones = ['#c98b52', '#c08048', '#cf955c', '#ba7c45', '#c68a54'];
    const plankH = 14;
    for (let y = r.y; y < r.y + r.h; y += plankH) {
      let x = r.x - rand() * 90;
      while (x < r.x + r.w) {
        const len = 70 + rand() * 70;
        ctx.fillStyle = tones[Math.floor(rand() * tones.length)];
        ctx.fillRect(x, y, len - 1, plankH - 1);
        ctx.fillStyle = 'rgba(120,70,30,0.10)';
        ctx.fillRect(x + 6, y + 4 + rand() * 5, len * (0.3 + rand() * 0.5), 1);
        x += len;
      }
    }
  },
  kitchenTile(ctx, r) {
    const s = 32;
    for (let y = r.y, j = 0; y < r.y + r.h; y += s, j += 1) {
      for (let x = r.x, i = 0; x < r.x + r.w; x += s, i += 1) {
        ctx.fillStyle = (i + j) % 2 ? '#e2c8a2' : '#f4e9d3';
        ctx.fillRect(x, y, s, s);
      }
    }
    ctx.strokeStyle = 'rgba(140,105,70,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = r.x; x <= r.x + r.w; x += s) { ctx.moveTo(x + 0.5, r.y); ctx.lineTo(x + 0.5, r.y + r.h); }
    for (let y = r.y; y <= r.y + r.h; y += s) { ctx.moveTo(r.x, y + 0.5); ctx.lineTo(r.x + r.w, y + 0.5); }
    ctx.stroke();
  },
  concrete(ctx, r, rand) {
    ctx.fillStyle = '#bdb6a8';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    for (let i = 0; i < (r.w * r.h) / 260; i += 1) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(90,80,65,0.10)' : 'rgba(255,255,255,0.12)';
      ctx.fillRect(r.x + rand() * r.w, r.y + rand() * r.h, 2, 2);
    }
    ctx.strokeStyle = 'rgba(90,80,65,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let y = r.y + 104; y < r.y + r.h; y += 104) { ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); }
    ctx.moveTo(r.x + r.w / 2, r.y);
    ctx.lineTo(r.x + r.w / 2, r.y + r.h);
    ctx.stroke();
  },
  carpet(ctx, r) {
    ctx.fillStyle = '#d6c4a0';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(120,95,60,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let d = -r.h; d < r.w; d += 6) {
      ctx.moveTo(r.x + d, r.y);
      ctx.lineTo(r.x + d + r.h, r.y + r.h);
    }
    ctx.stroke();
  },
  steel(ctx, r) {
    const s = 40;
    for (let y = r.y; y < r.y + r.h; y += s) {
      for (let x = r.x; x < r.x + r.w; x += s) {
        ctx.fillStyle = '#9ea8b2';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(x, y, s, 2);
        ctx.fillRect(x, y, 2, s);
        ctx.fillStyle = 'rgba(30,40,55,0.25)';
        ctx.fillRect(x, y + s - 2, s, 2);
        ctx.fillRect(x + s - 2, y, 2, s);
        ctx.fillStyle = 'rgba(40,50,60,0.45)';
        for (const [dx, dy] of [[6, 6], [s - 7, 6], [6, s - 7], [s - 7, s - 7]]) ctx.fillRect(x + dx, y + dy, 2, 2);
      }
    }
  },
  runner(ctx, r) {
    ctx.fillStyle = '#8f5d37';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = 'rgba(60,35,15,0.25)';
    for (let x = r.x; x < r.x + r.w; x += 14) ctx.fillRect(x, r.y, 1, r.h);
    const cx = r.x + r.w / 2;
    ctx.fillStyle = '#d6ad63';
    ctx.fillRect(cx - 22, r.y, 44, r.h);
    ctx.fillStyle = '#a24a3b';
    ctx.fillRect(cx - 19, r.y, 38, r.h);
    ctx.fillStyle = 'rgba(255,220,160,0.18)';
    for (let y = r.y + 10; y < r.y + r.h; y += 22) ctx.fillRect(cx - 8, y, 16, 3);
  },
  securityTile(ctx, r) {
    const s = 24;
    for (let y = r.y, j = 0; y < r.y + r.h; y += s, j += 1) {
      for (let x = r.x, i = 0; x < r.x + r.w; x += s, i += 1) {
        ctx.fillStyle = (i + j) % 2 ? '#b2c2cf' : '#bccbd7';
        ctx.fillRect(x, y, s, s);
      }
    }
    ctx.strokeStyle = 'rgba(80,100,120,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = r.x; x <= r.x + r.w; x += s) { ctx.moveTo(x + 0.5, r.y); ctx.lineTo(x + 0.5, r.y + r.h); }
    for (let y = r.y; y <= r.y + r.h; y += s) { ctx.moveTo(r.x, y + 0.5); ctx.lineTo(r.x + r.w, y + 0.5); }
    ctx.stroke();
  },
  officeCarpet(ctx, r) {
    ctx.fillStyle = '#6b7f96';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = 'rgba(40,55,75,0.08)';
    for (let y = r.y; y < r.y + r.h; y += 18) ctx.fillRect(r.x, y, r.w, 1);
    for (let x = r.x; x < r.x + r.w; x += 18) ctx.fillRect(x, r.y, 1, r.h);
  },
  terrazzo(ctx, r, rand) {
    ctx.fillStyle = '#c5ccd4';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    for (let i = 0; i < (r.w * r.h) / 180; i += 1) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(90,105,120,0.18)' : 'rgba(255,255,255,0.22)';
      ctx.fillRect(r.x + rand() * r.w, r.y + rand() * r.h, 2 + rand() * 3, 2);
    }
  },
  breakTile(ctx, r) {
    const s = 28;
    for (let y = r.y, j = 0; y < r.y + r.h; y += s, j += 1) {
      for (let x = r.x, i = 0; x < r.x + r.w; x += s, i += 1) {
        ctx.fillStyle = (i + j) % 2 ? '#9aa3ad' : '#b0b8c1';
        ctx.fillRect(x, y, s, s);
      }
    }
    ctx.strokeStyle = 'rgba(60,70,80,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = r.x; x <= r.x + r.w; x += s) { ctx.moveTo(x + 0.5, r.y); ctx.lineTo(x + 0.5, r.y + r.h); }
    for (let y = r.y; y <= r.y + r.h; y += s) { ctx.moveTo(r.x, y + 0.5); ctx.lineTo(r.x + r.w, y + 0.5); }
    ctx.stroke();
  },
  serverFloor(ctx, r) {
    ctx.fillStyle = '#2a313a';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(80,200,220,0.12)';
    ctx.lineWidth = 1;
    const s = 24;
    ctx.beginPath();
    for (let x = r.x; x <= r.x + r.w; x += s) { ctx.moveTo(x + 0.5, r.y); ctx.lineTo(x + 0.5, r.y + r.h); }
    for (let y = r.y; y <= r.y + r.h; y += s) { ctx.moveTo(r.x, y + 0.5); ctx.lineTo(r.x + r.w, y + 0.5); }
    ctx.stroke();
  },
};

// ─── Exterior ─────────────────────────────────────────────────────────────────
function drawExterior(ctx, level, rand) {
  const b = level.bounds;
  if (isCorporate(level)) {
    ctx.fillStyle = PAL.asphalt;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = PAL.asphaltStripe;
    for (let y = b.y; y < b.y + b.h; y += 64) ctx.fillRect(b.x, y, b.w, 2);
    for (let i = 0; i < 200; i += 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(b.x + rand() * b.w, b.y + rand() * b.h, 3, 2);
    }
    return;
  }
  ctx.fillStyle = PAL.grass;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = PAL.grassStripe;
  for (let x = b.x; x < b.x + b.w; x += 96) ctx.fillRect(x, b.y, 48, b.h);
  for (let i = 0; i < 420; i += 1) {
    const x = b.x + rand() * b.w;
    const y = b.y + rand() * b.h;
    ctx.strokeStyle = PAL.grassTuft;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 2, y);
    ctx.lineTo(x, y - 4);
    ctx.lineTo(x + 2, y);
    ctx.stroke();
  }
  for (let i = 0; i < 60; i += 1) {
    ctx.fillStyle = rand() < 0.5 ? '#fff6d8' : '#f5d35b';
    ctx.beginPath();
    ctx.arc(b.x + rand() * b.w, b.y + rand() * b.h, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHedgeBorder(ctx, b) {
  const t = 7;
  ctx.fillStyle = PAL.hedge;
  ctx.fillRect(b.x, b.y, b.w, t);
  ctx.fillRect(b.x, b.y + b.h - t, b.w, t);
  ctx.fillRect(b.x, b.y, t, b.h);
  ctx.fillRect(b.x + b.w - t, b.y, t, b.h);
  ctx.fillStyle = PAL.hedgeLight;
  for (let x = b.x + 6; x < b.x + b.w; x += 12) {
    ctx.beginPath(); ctx.arc(x, b.y + 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, b.y + b.h - 4, 3, 0, Math.PI * 2); ctx.fill();
  }
  for (let y = b.y + 6; y < b.y + b.h; y += 12) {
    ctx.beginPath(); ctx.arc(b.x + 3, y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + b.w - 4, y, 3, 0, Math.PI * 2); ctx.fill();
  }
}

// ─── Decor (non-blocking) ─────────────────────────────────────────────────────
const DECOR = {
  driveway(ctx, d) {
    ctx.fillStyle = '#cfc7b6';
    rr(ctx, d.x, d.y, d.w, d.h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,105,85,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = d.y + 28; y < d.y + d.h; y += 28) { ctx.moveTo(d.x + 4, y); ctx.lineTo(d.x + d.w - 4, y); }
    for (let y = d.y, k = 0; y < d.y + d.h; y += 28, k += 1) {
      for (let x = d.x + (k % 2 ? 28 : 0); x < d.x + d.w; x += 56) { ctx.moveTo(x, y); ctx.lineTo(x, y + 28); }
    }
    ctx.stroke();
  },
  path(ctx, d) {
    ctx.fillStyle = '#e2d9c6';
    for (let x = d.x + 4; x < d.x + d.w; x += 30) {
      rr(ctx, x, d.y + 8, 24, d.h - 16, 6);
      ctx.fill();
    }
  },
  flowerbed(ctx, d, rand) {
    ctx.fillStyle = '#7a5134';
    rr(ctx, d.x, d.y, d.w, d.h, 8);
    ctx.fill();
    const cols = ['#f26b6b', '#f7d154', '#ffffff', '#c77dff'];
    for (let i = 0; i < d.w / 6; i += 1) {
      ctx.fillStyle = '#5f9a48';
      const x = d.x + 6 + rand() * (d.w - 12);
      const y = d.y + 5 + rand() * (d.h - 10);
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = cols[Math.floor(rand() * cols.length)];
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  },
  rug(ctx, d) {
    ctx.fillStyle = 'rgba(60,35,20,0.18)';
    rr(ctx, d.x + 2, d.y + 3, d.w, d.h, 6);
    ctx.fill();
    ctx.fillStyle = d.trim;
    rr(ctx, d.x, d.y, d.w, d.h, 6);
    ctx.fill();
    ctx.fillStyle = d.color;
    rr(ctx, d.x + 6, d.y + 6, d.w - 12, d.h - 12, 4);
    ctx.fill();
    ctx.strokeStyle = d.trim;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    rr(ctx, d.x + 14, d.y + 14, d.w - 28, d.h - 28, 3);
    ctx.stroke();
    ctx.globalAlpha = 1;
  },
  mat(ctx, d) {
    ctx.fillStyle = '#8c4a3a';
    rr(ctx, d.x, d.y, d.w, d.h, 3);
    ctx.fill();
    ctx.strokeStyle = '#d9a76a';
    ctx.lineWidth = 1.5;
    rr(ctx, d.x + 3, d.y + 3, d.w - 6, d.h - 6, 2);
    ctx.stroke();
  },
  parking(ctx, d) {
    ctx.strokeStyle = 'rgba(245,205,70,0.75)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    rr(ctx, d.x, d.y, d.w, d.h, 4);
    ctx.stroke();
    ctx.setLineDash([]);
  },
  oil(ctx, d) {
    ctx.fillStyle = 'rgba(40,35,30,0.22)';
    ctx.beginPath();
    ctx.ellipse(d.x + d.w / 2, d.y + d.h / 2, d.w / 2, d.h / 2, 0.3, 0, Math.PI * 2);
    ctx.fill();
  },
  hazard(ctx, d) {
    clipRect(ctx, d, () => {
      ctx.fillStyle = '#f1c232';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = '#3b3b3b';
      for (let k = -d.h; k < d.w + d.h; k += 14) {
        ctx.beginPath();
        ctx.moveTo(d.x + k, d.y);
        ctx.lineTo(d.x + k + 7, d.y);
        ctx.lineTo(d.x + k + 7 - d.h, d.y + d.h);
        ctx.lineTo(d.x + k - d.h, d.y + d.h);
        ctx.fill();
      }
    });
    ctx.fillStyle = '#9ea8b2';
    ctx.fillRect(d.x + 6, d.y + 6, d.w - 12, d.h - 12);
  },
  asphalt() {},
  sidewalk(ctx, d) {
    ctx.fillStyle = PAL.sidewalk;
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = 'rgba(50,60,70,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = d.x; x < d.x + d.w; x += 48) {
      ctx.moveTo(x + 0.5, d.y); ctx.lineTo(x + 0.5, d.y + d.h);
    }
    ctx.stroke();
  },
  loadingBay(ctx, d) {
    ctx.fillStyle = '#2f3640';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(d.x + 0.5, d.y + 0.5, d.w - 1, d.h - 1);
  },
  extractMark(ctx, d) {
    ctx.strokeStyle = 'rgba(90,230,200,0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    rr(ctx, d.x, d.y, d.w, d.h, 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(90,230,200,0.12)';
    rr(ctx, d.x, d.y, d.w, d.h, 4);
    ctx.fill();
  },
  parkingStripe(ctx, d) {
    ctx.strokeStyle = 'rgba(230,230,240,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x + 0.5, d.y + 0.5, d.w - 1, d.h - 1);
    ctx.beginPath();
    ctx.moveTo(d.x + d.w / 2, d.y + 6);
    ctx.lineTo(d.x + d.w / 2, d.y + d.h - 6);
    ctx.stroke();
  },
  curbYellow(ctx, d) {
    ctx.fillStyle = PAL.curb;
    ctx.fillRect(d.x, d.y, d.w, d.h);
  },
  entryLabel() {},
};

function drawPlinth(ctx, a) {
  ctx.fillStyle = 'rgba(20,30,45,0.25)';
  ctx.beginPath();
  ctx.ellipse(a.x + 2, a.y + 4, 22, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5d6772';
  ctx.beginPath(); ctx.arc(a.x, a.y, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d7b46a';
  ctx.beginPath(); ctx.arc(a.x, a.y, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#26303b';
  ctx.beginPath(); ctx.arc(a.x, a.y, 13, 0, Math.PI * 2); ctx.fill();
}

function drawRoomLabels(ctx, level) {
  ctx.save();
  ctx.font = '700 13px "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  const corporate = isCorporate(level);
  for (const room of level.rooms) {
    if (!room.label) continue;
    ctx.fillStyle = corporate
      ? (room.floor === 'steel' || room.floor === 'serverFloor' ? 'rgba(160,200,220,0.35)' : 'rgba(30,45,60,0.40)')
      : (room.floor === 'steel' || room.floor === 'securityTile' ? 'rgba(30,45,60,0.35)' : 'rgba(70,40,20,0.30)');
    ctx.fillText(room.name.toUpperCase(), room.label.x, room.label.y);
  }
  if (corporate) {
    ctx.fillStyle = 'rgba(200,220,240,0.55)';
    ctx.fillText('ENTRY', 1200, 1008);
    ctx.fillStyle = 'rgba(90,230,200,0.7)';
    ctx.fillText('EXTRACTION', 1590, 130);
  }
  ctx.restore();
}

// ─── Shadows ──────────────────────────────────────────────────────────────────
const PROP_RADIUS = { car: 20, van: 14, sofa: 8, diningTable: 10 };

// Shapes are filled far off-canvas and only their offset shadow lands on the
// floor, so no opaque fill is left behind at rounded furniture corners.
function drawShadows(ctx, walls, footprint, scale, level) {
  const off = level.bounds.w + 400;
  const cast = (color, blur, dx, dy, shapes) => {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur * scale;
    ctx.shadowOffsetX = (dx + off) * scale;
    ctx.shadowOffsetY = dy * scale;
    ctx.fillStyle = '#000';
    shapes();
    ctx.restore();
  };
  // One path per pass so overlapping shapes don't double-darken.
  cast('rgba(25,40,15,0.5)', 18, 0, 8, () => {
    ctx.beginPath();
    for (const f of footprint) ctx.rect(f.x - off, f.y, f.w, f.h);
    ctx.fill();
  });
  cast('rgba(55,32,14,0.4)', 9, 4, 7, () => {
    ctx.beginPath();
    for (const w of walls) {
      if (w.kind === 'prop' && w.prop === 'shrub') {
        const r = Math.min(w.w, w.h) / 2;
        ctx.moveTo(w.x - off + w.w / 2 + r, w.y + w.h / 2);
        ctx.arc(w.x - off + w.w / 2, w.y + w.h / 2, r, 0, Math.PI * 2);
      } else if (w.kind === 'prop') {
        ctx.roundRect(w.x - off, w.y, w.w, w.h, PROP_RADIUS[w.prop] ?? 4);
      } else {
        ctx.rect(w.x - off, w.y, w.w, w.h);
      }
    }
    ctx.fill();
  });
}

// ─── Walls ────────────────────────────────────────────────────────────────────
function drawWalls(ctx, walls, level) {
  const corporate = isCorporate(level);
  const structural = walls.filter((w) => w.kind !== 'prop');
  ctx.fillStyle = outlineColor(level);
  for (const w of structural) ctx.fillRect(w.x - 2, w.y - 2, w.w + 4, w.h + 4);

  const depth = (w) => (w.kind === 'outer' ? 9 : 7);
  const sideOuter = corporate ? PAL.officeWallOuterSide : PAL.wallSideOuter;
  const sideInner = corporate ? PAL.officeWallSide : PAL.wallSideInner;
  const topOuter = corporate ? PAL.officeWallOuterTop : PAL.wallTopOuter;
  const topInner = corporate ? PAL.officeWallTop : PAL.wallTopInner;
  const cap = corporate ? PAL.officeWallCap : PAL.wallCap;
  for (const w of structural) {
    const d = Math.min(depth(w), w.h * 0.5);
    ctx.fillStyle = w.kind === 'outer' ? sideOuter : sideInner;
    ctx.fillRect(w.x, w.y + w.h - d, w.w, d);
    ctx.fillStyle = corporate ? 'rgba(20,30,40,0.22)' : 'rgba(60,35,15,0.18)';
    ctx.fillRect(w.x, w.y + w.h - 2, w.w, 2);
  }
  for (const w of structural) {
    const d = Math.min(depth(w), w.h * 0.5);
    const joinAbove = structural.some(
      (o) => o !== w && Math.abs(o.y + o.h - w.y) < 1 && o.x < w.x + w.w && o.x + o.w > w.x,
    );
    const ext = joinAbove ? 9 : 0;
    ctx.fillStyle = w.kind === 'outer' ? topOuter : topInner;
    ctx.fillRect(w.x, w.y - ext, w.w, w.h - d + ext);
  }
  ctx.fillStyle = cap;
  for (const w of structural) {
    if (w.kind !== 'outer') continue;
    const d = Math.min(depth(w), w.h * 0.5);
    if (w.w >= w.h) ctx.fillRect(w.x + 3, w.y + (w.h - d) / 2 - 1, w.w - 6, 2);
    else ctx.fillRect(w.x + w.w / 2 - 1, w.y + 3, 2, w.h - d - 6);
  }
}

// ─── Furniture ────────────────────────────────────────────────────────────────
function box(ctx, p, top, side, { d = Math.min(9, p.h * 0.3), radius = 3, outline = OUTLINE_HOUSE } = {}) {
  ctx.fillStyle = outline;
  rr(ctx, p.x - 1.5, p.y - 1.5, p.w + 3, p.h + 3, radius + 1.5);
  ctx.fill();
  ctx.fillStyle = side;
  rr(ctx, p.x, p.y, p.w, p.h, radius);
  ctx.fill();
  ctx.fillStyle = top;
  rr(ctx, p.x, p.y, p.w, p.h - d, radius);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(p.x + radius, p.y + 1, p.w - radius * 2, 1.5);
  return { x: p.x, y: p.y, w: p.w, h: p.h - d, d };
}

function wheel(ctx, x, y, w, h) {
  ctx.fillStyle = '#1f1f22';
  rr(ctx, x, y, w, h, 2);
  ctx.fill();
}

const PROPS = {
  counter(ctx, p) {
    const t = box(ctx, p, '#e6dfd2', '#a8733f');
    ctx.strokeStyle = 'rgba(70,40,15,0.35)';
    ctx.lineWidth = 1;
    for (let x = p.x + 28; x < p.x + p.w; x += 28) {
      ctx.beginPath(); ctx.moveTo(x, t.y + t.h); ctx.lineTo(x, p.y + p.h); ctx.stroke();
    }
    ctx.fillStyle = '#8fa5b3';
    rr(ctx, p.x + 30, t.y + 5, 36, t.h - 10, 4); ctx.fill();
    ctx.fillStyle = '#6f8796';
    rr(ctx, p.x + 34, t.y + 8, 28, t.h - 16, 3); ctx.fill();
    ctx.fillStyle = '#33343a';
    rr(ctx, p.x + 118, t.y + 3, 50, t.h - 6, 3); ctx.fill();
    ctx.strokeStyle = '#7a7c86';
    ctx.lineWidth = 2;
    for (const [dx, dy] of [[12, 7], [36, 7], [12, 17], [36, 17]]) {
      ctx.beginPath(); ctx.arc(p.x + 118 + dx, t.y + 3 + dy * ((t.h - 6) / 24), 4, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#c99a62';
    rr(ctx, p.x + 182, t.y + 6, 26, t.h - 12, 2); ctx.fill();
  },
  fridge(ctx, p) {
    const t = box(ctx, p, '#f5f7f8', '#c5ced3', { radius: 4 });
    ctx.fillStyle = '#9aa6ad';
    ctx.fillRect(p.x + p.w - 10, t.y + t.h + 2, 6, 3);
    ctx.fillStyle = '#e46a5a';
    ctx.beginPath(); ctx.arc(p.x + 12, t.y + 10, 3, 0, Math.PI * 2); ctx.fill();
  },
  island(ctx, p) {
    const t = box(ctx, p, '#d7a465', '#93602f', { radius: 4 });
    ctx.strokeStyle = 'rgba(120,70,25,0.25)';
    ctx.lineWidth = 1;
    for (let x = p.x + 10; x < p.x + p.w; x += 12) {
      ctx.beginPath(); ctx.moveTo(x, t.y + 3); ctx.lineTo(x, t.y + t.h - 3); ctx.stroke();
    }
    const cx = p.x + p.w * 0.65;
    const cy = t.y + t.h / 2;
    ctx.fillStyle = '#efe7d6';
    ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
    for (const [dx, dy, c] of [[-4, -3, '#e0533f'], [4, -2, '#f2a53a'], [0, 4, '#8cc04b']]) {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 4, 0, Math.PI * 2); ctx.fill();
    }
  },
  car(ctx, p) {
    ctx.fillStyle = OUTLINE_HOUSE;
    rr(ctx, p.x - 2, p.y - 2, p.w + 4, p.h + 4, 20); ctx.fill();
    wheel(ctx, p.x - 1, p.y + 24, 8, 26);
    wheel(ctx, p.x + p.w - 7, p.y + 24, 8, 26);
    wheel(ctx, p.x - 1, p.y + p.h - 50, 8, 26);
    wheel(ctx, p.x + p.w - 7, p.y + p.h - 50, 8, 26);
    ctx.fillStyle = '#8e3628';
    rr(ctx, p.x + 4, p.y, p.w - 8, p.h, 18); ctx.fill();
    ctx.fillStyle = '#cf5a40';
    rr(ctx, p.x + 4, p.y, p.w - 8, p.h - 8, 18); ctx.fill();
    ctx.fillStyle = '#2f3d4a';
    ctx.beginPath();
    ctx.moveTo(p.x + 14, p.y + 46); ctx.lineTo(p.x + p.w - 14, p.y + 46);
    ctx.lineTo(p.x + p.w - 20, p.y + 30); ctx.lineTo(p.x + 20, p.y + 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e46e52';
    rr(ctx, p.x + 16, p.y + 50, p.w - 32, 54, 6); ctx.fill();
    ctx.fillStyle = '#2f3d4a';
    rr(ctx, p.x + 18, p.y + 110, p.w - 36, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe9a0';
    ctx.fillRect(p.x + 12, p.y + 4, 12, 5);
    ctx.fillRect(p.x + p.w - 24, p.y + 4, 12, 5);
    ctx.fillStyle = '#ff5a4a';
    ctx.fillRect(p.x + 12, p.y + p.h - 15, 12, 4);
    ctx.fillRect(p.x + p.w - 24, p.y + p.h - 15, 12, 4);
  },
  workbench(ctx, p) {
    const t = box(ctx, p, '#c99c64', '#8a5e33', { d: 7 });
    ctx.fillStyle = '#c0392b';
    rr(ctx, p.x + 6, t.y + 10, p.w - 12, 18, 2); ctx.fill();
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(p.x + 10, t.y + 44, p.w - 20, 4);
    ctx.beginPath(); ctx.arc(p.x + p.w / 2, t.y + 62, 6, 0, Math.PI * 2); ctx.fill();
  },
  crates(ctx, p) {
    const half = p.w / 2;
    for (const [ox, oy, w, h] of [[0, 0, half - 2, p.h], [half + 2, 10, half - 2, p.h - 10]]) {
      const c = { x: p.x + ox, y: p.y + oy, w, h };
      const t = box(ctx, c, '#d49b56', '#9a6431');
      ctx.strokeStyle = '#9a6431';
      ctx.lineWidth = 2;
      ctx.strokeRect(t.x + 3, t.y + 3, t.w - 6, t.h - 6);
      ctx.beginPath();
      ctx.moveTo(t.x + 4, t.y + 4); ctx.lineTo(t.x + t.w - 4, t.y + t.h - 4);
      ctx.moveTo(t.x + t.w - 4, t.y + 4); ctx.lineTo(t.x + 4, t.y + t.h - 4);
      ctx.stroke();
    }
  },
  fireplace(ctx, p) {
    const t = box(ctx, p, '#b65c3d', '#7c3a25', { d: 6, radius: 2 });
    ctx.fillStyle = '#2b1a14';
    rr(ctx, p.x + 22, t.y + 3, p.w - 44, t.h - 2, 3); ctx.fill();
    const g = ctx.createRadialGradient(p.x + p.w / 2, t.y + t.h, 1, p.x + p.w / 2, t.y + t.h, 22);
    g.addColorStop(0, 'rgba(255,190,80,0.95)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(p.x + 22, t.y + 2, p.w - 44, t.h);
  },
  sofa(ctx, p) {
    ctx.fillStyle = OUTLINE_HOUSE;
    rr(ctx, p.x - 1.5, p.y - 1.5, p.w + 3, p.h + 3, 8); ctx.fill();
    ctx.fillStyle = '#356b60';
    rr(ctx, p.x, p.y, p.w, p.h, 7); ctx.fill();
    ctx.fillStyle = '#4f8a7e';
    rr(ctx, p.x, p.y, p.w, p.h - 7, 7); ctx.fill();
    ctx.fillStyle = '#427a6e';
    rr(ctx, p.x + 2, p.y + p.h - 20, p.w - 4, 12, 4); ctx.fill();
    ctx.fillStyle = '#5c9a8c';
    rr(ctx, p.x, p.y, 16, p.h - 7, 6); ctx.fill();
    rr(ctx, p.x + p.w - 16, p.y, 16, p.h - 7, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(30,60,52,0.45)';
    ctx.lineWidth = 1.5;
    const seat = (p.w - 32) / 3;
    for (let i = 1; i < 3; i += 1) {
      ctx.beginPath(); ctx.moveTo(p.x + 16 + seat * i, p.y + 3); ctx.lineTo(p.x + 16 + seat * i, p.y + p.h - 20); ctx.stroke();
    }
    ctx.fillStyle = '#e3b04b';
    rr(ctx, p.x + 22, p.y + 5, 16, 12, 3); ctx.fill();
  },
  bookshelf(ctx, p) {
    const t = box(ctx, p, '#8b5b35', '#5e3b21', { d: 8 });
    const cols = ['#c0504d', '#4f81bd', '#9bbb59', '#f2c14e', '#8064a2', '#e8e2d0', '#4bacc6'];
    let x = p.x + 30;
    let i = 0;
    while (x < p.x + p.w - 30) {
      const w = 4 + ((i * 7) % 5);
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(x, t.y + 3, w, t.h - 6);
      x += w + 1 + (i % 6 === 5 ? 6 : 0);
      i += 1;
    }
    ctx.fillStyle = '#4f8a3a';
    ctx.beginPath(); ctx.arc(p.x + 15, t.y + t.h / 2, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe4a0';
    ctx.beginPath(); ctx.arc(p.x + p.w - 15, t.y + t.h / 2, 6, 0, Math.PI * 2); ctx.fill();
  },
  diningTable(ctx, p) {
    const chair = (x, y, w, h) => {
      ctx.fillStyle = OUTLINE_HOUSE;
      rr(ctx, x - 1, y - 1, w + 2, h + 2, 3); ctx.fill();
      ctx.fillStyle = '#7c4f2e';
      rr(ctx, x, y, w, h, 3); ctx.fill();
      ctx.fillStyle = '#9b6a42';
      rr(ctx, x, y, w, h - 4, 3); ctx.fill();
    };
    for (const fx of [0.2, 0.5, 0.8]) {
      chair(p.x + p.w * fx - 11, p.y, 22, 14);
      chair(p.x + p.w * fx - 11, p.y + p.h - 14, 22, 14);
    }
    chair(p.x, p.y + p.h / 2 - 11, 14, 22);
    chair(p.x + p.w - 14, p.y + p.h / 2 - 11, 14, 22);
    const tbl = { x: p.x + 10, y: p.y + 10, w: p.w - 20, h: p.h - 18 };
    const t = box(ctx, tbl, '#ba7a4b', '#7f4f2c', { d: 6, radius: 8 });
    ctx.fillStyle = '#f4efe6';
    for (const fx of [0.2, 0.5, 0.8]) {
      ctx.beginPath(); ctx.arc(p.x + p.w * fx, t.y + 7, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x + p.w * fx, t.y + t.h - 7, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#5a9bd5';
    ctx.beginPath(); ctx.arc(p.x + p.w / 2, t.y + t.h / 2, 5, 0, Math.PI * 2); ctx.fill();
  },
  cabinet(ctx, p) {
    const t = box(ctx, p, '#a96f43', '#6f4526');
    ctx.strokeStyle = 'rgba(40,20,5,0.45)';
    ctx.lineWidth = 1;
    for (let x = p.x + p.w / 3; x < p.x + p.w - 2; x += p.w / 3) {
      ctx.beginPath(); ctx.moveTo(x, t.y + t.h); ctx.lineTo(x, p.y + p.h); ctx.stroke();
    }
    ctx.fillStyle = '#4f8a3a';
    ctx.beginPath(); ctx.arc(p.x + 16, t.y + t.h / 2, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8d9b5';
    rr(ctx, p.x + p.w - 36, t.y + 5, 22, t.h - 10, 3); ctx.fill();
  },
  desk(ctx, p) {
    const t = box(ctx, p, '#9d6b40', '#6a4426', { d: 8 });
    ctx.fillStyle = '#5b6470';
    rr(ctx, p.x + 30, t.y + 6, 34, 22, 2); ctx.fill();
    ctx.fillStyle = '#9fd3f5';
    ctx.fillRect(p.x + 33, t.y + 8, 28, 14);
    ctx.fillStyle = '#f6f1e6';
    ctx.save();
    ctx.translate(p.x + 14, t.y + 18);
    ctx.rotate(-0.2);
    ctx.fillRect(-8, -10, 16, 20);
    ctx.restore();
    ctx.fillStyle = '#ffe28a';
    ctx.beginPath(); ctx.arc(p.x + p.w - 14, t.y + 12, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3e3e46';
    ctx.beginPath(); ctx.arc(p.x + p.w / 2, p.y + p.h - 5, 9, 0, Math.PI * 2); ctx.fill();
  },
  bed(ctx, p) {
    const t = box(ctx, p, '#7a5034', '#5a3824', { d: 8, radius: 4 });
    ctx.fillStyle = '#5a3824';
    ctx.fillRect(p.x, t.y, p.w, 12);
    ctx.fillStyle = '#f7f3ec';
    rr(ctx, p.x + 8, t.y + 15, p.w / 2 - 12, 20, 6); ctx.fill();
    rr(ctx, p.x + p.w / 2 + 4, t.y + 15, p.w / 2 - 12, 20, 6); ctx.fill();
    ctx.fillStyle = '#c8746c';
    rr(ctx, p.x + 4, t.y + 40, p.w - 8, t.h - 42, 4); ctx.fill();
    ctx.fillStyle = '#eab7a8';
    ctx.fillRect(p.x + 4, t.y + 40, p.w - 8, 8);
    ctx.strokeStyle = 'rgba(120,50,45,0.35)';
    ctx.lineWidth = 1;
    for (let y = t.y + 58; y < t.y + t.h - 4; y += 12) {
      ctx.beginPath(); ctx.moveTo(p.x + 8, y); ctx.lineTo(p.x + p.w - 8, y); ctx.stroke();
    }
  },
  lockers(ctx, p) {
    const t = box(ctx, p, '#bfc7cf', '#7c8790', { d: 8 });
    ctx.strokeStyle = 'rgba(60,70,80,0.5)';
    ctx.lineWidth = 1;
    for (let x = p.x + 20; x < p.x + p.w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, t.y + 2); ctx.lineTo(x, p.y + p.h); ctx.stroke();
    }
    ctx.fillStyle = '#e2b84f';
    for (let x = p.x + 10; x < p.x + p.w; x += 20) ctx.fillRect(x - 2, t.y + t.h + 2, 4, 3);
  },
  servers(ctx, p) {
    const t = box(ctx, p, '#3e4752', '#262c33', { d: 8 });
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let x = p.x + 6; x < p.x + p.w - 4; x += 8) ctx.fillRect(x, t.y + 4, 4, t.h - 8);
    const leds = ['#59f28f', '#59c3f2', '#59f28f', '#f2d059'];
    for (let x = p.x + 8, i = 0; x < p.x + p.w - 4; x += 12, i += 1) {
      ctx.fillStyle = leds[i % leds.length];
      ctx.fillRect(x, t.y + t.h + 3, 3, 2);
    }
  },
  console(ctx, p) {
    const t = box(ctx, p, '#4b5867', '#2d3641', { d: 8 });
    for (let i = 0; i < 3; i += 1) {
      const mx = p.x + 14 + i * ((p.w - 28) / 3);
      const mw = (p.w - 28) / 3 - 8;
      ctx.fillStyle = '#1c232b';
      rr(ctx, mx, t.y + t.h - 16, mw, 14, 2); ctx.fill();
      ctx.fillStyle = '#58c6ff';
      ctx.fillRect(mx + 2, t.y + t.h - 14, mw - 4, 9);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(mx + 4, t.y + t.h - 12, mw * 0.5, 1.5);
    }
    ctx.fillStyle = '#c9d2db';
    rr(ctx, p.x + p.w / 2 - 22, t.y + 4, 44, 8, 2); ctx.fill();
  },
  van(ctx, p) {
    ctx.fillStyle = OUTLINE_HOUSE;
    rr(ctx, p.x - 2, p.y - 2, p.w + 4, p.h + 4, 14); ctx.fill();
    wheel(ctx, p.x - 1, p.y + 20, 7, 22);
    wheel(ctx, p.x + p.w - 6, p.y + 20, 7, 22);
    wheel(ctx, p.x - 1, p.y + p.h - 40, 7, 22);
    wheel(ctx, p.x + p.w - 6, p.y + p.h - 40, 7, 22);
    ctx.fillStyle = '#a9b4bc';
    rr(ctx, p.x + 3, p.y, p.w - 6, p.h, 12); ctx.fill();
    ctx.fillStyle = '#eef2f4';
    rr(ctx, p.x + 3, p.y, p.w - 6, p.h - 8, 12); ctx.fill();
    ctx.fillStyle = '#2f3d4a';
    rr(ctx, p.x + 9, p.y + 12, p.w - 18, 16, 4); ctx.fill();
    ctx.fillStyle = '#2aa198';
    ctx.fillRect(p.x + p.w / 2 - 5, p.y + 34, 10, p.h - 50);
    ctx.strokeStyle = 'rgba(80,95,105,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.x + p.w / 2, p.y + p.h - 26); ctx.lineTo(p.x + p.w / 2, p.y + p.h - 10); ctx.stroke();
    ctx.fillStyle = '#ffe9a0';
    ctx.fillRect(p.x + 8, p.y + 3, 9, 4);
    ctx.fillRect(p.x + p.w - 17, p.y + 3, 9, 4);
  },
  shrub(ctx, p) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const r = Math.min(p.w, p.h) / 2;
    const blobs = [[0, 0, 1], [-0.45, -0.25, 0.6], [0.45, -0.2, 0.6], [-0.3, 0.4, 0.55], [0.35, 0.4, 0.55]];
    ctx.fillStyle = '#3d6b30';
    for (const [dx, dy, s] of blobs) { ctx.beginPath(); ctx.arc(cx + dx * r, cy + dy * r, r * s * 0.78 + 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5c9a46';
    for (const [dx, dy, s] of blobs) { ctx.beginPath(); ctx.arc(cx + dx * r, cy + dy * r, r * s * 0.78, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#7bb75e';
    ctx.beginPath(); ctx.arc(cx - r * 0.2, cy - r * 0.25, r * 0.3, 0, Math.PI * 2); ctx.fill();
  },
  conferenceTable(ctx, p) {
    const o = OUTLINE_OFFICE;
    for (const [fx, fy] of [[0.12, 0.15], [0.12, 0.85], [0.88, 0.15], [0.88, 0.85], [0.35, 0.08], [0.65, 0.08], [0.35, 0.92], [0.65, 0.92]]) {
      const cx = p.x + p.w * fx - 8;
      const cy = p.y + p.h * fy - 8;
      ctx.fillStyle = o;
      rr(ctx, cx - 1, cy - 1, 18, 18, 3); ctx.fill();
      ctx.fillStyle = '#e8eef4';
      rr(ctx, cx, cy, 16, 16, 3); ctx.fill();
    }
    box(ctx, { x: p.x + 16, y: p.y + 16, w: p.w - 32, h: p.h - 32 }, '#1e3a5f', '#152a45', { outline: o, radius: 6 });
  },
  filingCabinet(ctx, p) {
    const t = box(ctx, p, '#9aa7b5', '#6a7684', { outline: OUTLINE_OFFICE });
    ctx.strokeStyle = 'rgba(40,50,60,0.45)';
    ctx.lineWidth = 1;
    const vertical = p.h > p.w;
    if (vertical) {
      for (let y = p.y + 20; y < p.y + p.h - 4; y += 22) {
        ctx.beginPath(); ctx.moveTo(t.x + 3, y); ctx.lineTo(t.x + t.w - 3, y); ctx.stroke();
        ctx.fillStyle = '#c9d2db';
        ctx.fillRect(t.x + t.w / 2 - 4, y + 6, 8, 3);
      }
    } else {
      for (let x = p.x + 18; x < p.x + p.w - 4; x += 28) {
        ctx.beginPath(); ctx.moveTo(x, t.y + 2); ctx.lineTo(x, p.y + p.h); ctx.stroke();
      }
    }
  },
  planter(ctx, p) {
    box(ctx, p, '#6b7580', '#4a5460', { outline: OUTLINE_OFFICE, d: 5, radius: 2 });
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2 - 2;
    ctx.fillStyle = '#3d6b30';
    ctx.beginPath(); ctx.arc(cx, cy, Math.min(p.w, p.h) * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c9a46';
    ctx.beginPath(); ctx.arc(cx - 3, cy - 2, Math.min(p.w, p.h) * 0.18, 0, Math.PI * 2); ctx.fill();
  },
  execDesk(ctx, p) {
    const t = box(ctx, p, '#e8e0d4', '#b8a890', { outline: OUTLINE_OFFICE, d: 8 });
    ctx.fillStyle = '#1a2430';
    rr(ctx, p.x + p.w / 2 - 14, p.y + p.h - 10, 28, 10, 4); ctx.fill();
    ctx.fillStyle = '#2a3544';
    rr(ctx, p.x + 18, t.y + 8, 40, 24, 2); ctx.fill();
    ctx.fillStyle = '#5ad4ff';
    ctx.fillRect(p.x + 21, t.y + 11, 34, 16);
  },
  coffeeCounter(ctx, p) {
    const t = box(ctx, p, '#d8dde3', '#8a939e', { outline: OUTLINE_OFFICE });
    ctx.fillStyle = '#4a5560';
    rr(ctx, p.x + 16, t.y + 6, 36, t.h - 10, 3); ctx.fill();
    ctx.fillStyle = '#c45c3a';
    rr(ctx, p.x + 60, t.y + 8, 28, t.h - 12, 2); ctx.fill();
    ctx.fillStyle = '#eef2f5';
    ctx.beginPath(); ctx.arc(p.x + 120, t.y + t.h / 2, 8, 0, Math.PI * 2); ctx.fill();
  },
  roundTable(ctx, p) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const r = Math.min(p.w, p.h) / 2;
    ctx.fillStyle = OUTLINE_OFFICE;
    ctx.beginPath(); ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9b8a0';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8dcc8';
    ctx.beginPath(); ctx.arc(cx, cy, r - 5, 0, Math.PI * 2); ctx.fill();
  },
  workstation(ctx, p) {
    const t = box(ctx, p, '#eef1f4', '#b0bac4', { outline: OUTLINE_OFFICE, d: 6 });
    ctx.fillStyle = '#1e2a36';
    rr(ctx, p.x + 10, t.y + 6, 36, 22, 2); ctx.fill();
    ctx.fillStyle = '#5ad4ff';
    ctx.fillRect(p.x + 13, t.y + 8, 30, 16);
    ctx.fillStyle = '#243040';
    ctx.beginPath(); ctx.arc(p.x + p.w - 14, p.y + p.h - 6, 9, 0, Math.PI * 2); ctx.fill();
  },
  partition(ctx, p) {
    ctx.fillStyle = OUTLINE_OFFICE;
    ctx.fillRect(p.x - 1, p.y - 1, p.w + 2, p.h + 2);
    ctx.fillStyle = '#2a9d8f';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(180,230,240,0.35)';
    ctx.fillRect(p.x + 2, p.y + 4, Math.max(2, p.w - 4), p.h - 8);
  },
  receptionDesk(ctx, p) {
    const t = box(ctx, p, '#e8eef4', '#9aa7b5', { outline: OUTLINE_OFFICE, d: 8, radius: 4 });
    ctx.fillStyle = '#5ad4ff';
    ctx.fillRect(p.x + p.w / 2 - 20, t.y + 8, 40, 18);
    ctx.fillStyle = '#1e2a36';
    ctx.fillRect(p.x + p.w / 2 - 18, t.y + 10, 36, 14);
  },
  sofaBlue(ctx, p) {
    ctx.fillStyle = OUTLINE_OFFICE;
    rr(ctx, p.x - 1.5, p.y - 1.5, p.w + 3, p.h + 3, 6); ctx.fill();
    ctx.fillStyle = '#1e3a5f';
    rr(ctx, p.x, p.y, p.w, p.h, 5); ctx.fill();
    ctx.fillStyle = '#2c5282';
    rr(ctx, p.x, p.y, p.w, p.h - 6, 5); ctx.fill();
  },
  coffeeTable(ctx, p) {
    box(ctx, p, '#d4c4a8', '#9a8a70', { outline: OUTLINE_OFFICE, d: 5, radius: 3 });
  },
  hvac(ctx, p) {
    const t = box(ctx, p, '#8a939e', '#5c6670', { outline: OUTLINE_OFFICE, d: 6 });
    ctx.strokeStyle = 'rgba(30,40,50,0.35)';
    ctx.lineWidth = 2;
    for (let y = t.y + 6; y < t.y + t.h - 4; y += 8) {
      ctx.beginPath(); ctx.moveTo(t.x + 6, y); ctx.lineTo(t.x + t.w - 6, y); ctx.stroke();
    }
  },
  bollard(ctx, p) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    ctx.fillStyle = OUTLINE_OFFICE;
    ctx.beginPath(); ctx.arc(cx, cy, p.w / 2 + 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0d45a';
    ctx.beginPath(); ctx.arc(cx, cy, p.w / 2 - 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a3038';
    ctx.beginPath(); ctx.arc(cx, cy, p.w / 4, 0, Math.PI * 2); ctx.fill();
  },
  parkedCar(ctx, p) {
    ctx.fillStyle = OUTLINE_OFFICE;
    rr(ctx, p.x - 1, p.y - 1, p.w + 2, p.h + 2, 8); ctx.fill();
    ctx.fillStyle = '#5a6570';
    rr(ctx, p.x, p.y, p.w, p.h, 7); ctx.fill();
    ctx.fillStyle = '#7a8694';
    rr(ctx, p.x, p.y, p.w, p.h - 6, 7); ctx.fill();
    ctx.fillStyle = '#2a3544';
    rr(ctx, p.x + 16, p.y + 6, p.w - 40, p.h - 16, 3); ctx.fill();
  },
  whiteboard(ctx, p) {
    const t = box(ctx, p, '#eef3f7', '#8a96a2', { outline: OUTLINE_OFFICE, d: 5, radius: 2 });
    ctx.fillStyle = '#2a9d8f';
    ctx.fillRect(t.x + 8, t.y + 4, t.w - 16, 3);
    ctx.strokeStyle = 'rgba(40,60,80,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(t.x + 14, t.y + 14);
    ctx.lineTo(t.x + t.w * 0.45, t.y + t.h - 8);
    ctx.lineTo(t.x + t.w - 12, t.y + 12);
    ctx.stroke();
  },
};

function drawProp(ctx, w) {
  const fn = PROPS[w.prop];
  if (fn) fn(ctx, w);
  else box(ctx, w, '#cfa36b', '#8a5e33');
}

// ─── Layer builders ───────────────────────────────────────────────────────────
function makeCanvas(level, scale) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(level.bounds.w * scale));
  c.height = Math.max(1, Math.ceil(level.bounds.h * scale));
  const ctx = c.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, -level.bounds.x * scale, -level.bounds.y * scale);
  ctx.imageSmoothingEnabled = true;
  return { c, ctx };
}

export function buildStaticLayers(level, walls, scale) {
  const floor = makeCanvas(level, scale);
  const rand = rng(1337);
  const f = floor.ctx;
  const corporate = isCorporate(level);
  const earlyDecor = corporate
    ? ['asphalt', 'sidewalk', 'loadingBay', 'parkingStripe', 'curbYellow']
    : ['driveway', 'path', 'flowerbed'];
  drawExterior(f, level, rand);
  for (const d of level.decor) {
    if (earlyDecor.includes(d.type)) DECOR[d.type]?.(f, d, rand);
  }
  if (!corporate) drawHedgeBorder(f, level.bounds);
  for (const room of level.rooms) {
    const draw = FLOORS[room.floor] || FLOORS.wood;
    clipRect(f, room, () => draw(f, room, rand));
  }
  for (const d of level.decor) {
    if (!earlyDecor.includes(d.type)) DECOR[d.type]?.(f, d, rand);
  }
  drawPlinth(f, level.artifact);
  drawRoomLabels(f, level);
  drawShadows(f, walls, level.footprint, scale, level);

  const solids = makeCanvas(level, scale);
  drawWalls(solids.ctx, walls, level);
  for (const w of walls) if (w.kind === 'prop') drawProp(solids.ctx, w);

  return { floor: floor.c, solids: solids.c };
}
