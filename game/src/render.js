// Gobblewood Escape — every pixel the player sees: the autumn farm, barn and
// kitchen, the turkey and the farmer, the hazards and pickups, the HUD, and
// the title, pause, caught and escaped screens. All art is drawn in code;
// the game loads no images.

import { FARMER, KNIFE, OVEN, PALETTE, TURKEY, VIEW, WORLD, ZONES } from './tuning.js';
import { FARMER_CHASE, FARMER_SEARCH } from './farmer.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function skyFor(zoneName) {
  if (zoneName === 'Barn') return PALETTE.skyBarn;
  if (zoneName === 'Kitchen') return PALETTE.skyKitchen;
  return PALETTE.skyFarm;
}

function groundFor(zoneName) {
  if (zoneName === 'Barn') return { top: PALETTE.groundTopBarn, fill: PALETTE.groundBarn };
  if (zoneName === 'Kitchen') return { top: PALETTE.groundTopKitchen, fill: PALETTE.groundKitchen };
  return { top: PALETTE.groundTopFarm, fill: PALETTE.groundFarm };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fitCanvas() {
    const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
    canvas.width = Math.floor(VIEW.width * scale);
    canvas.height = Math.floor(VIEW.height * scale);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    // Centre the letterboxed canvas in the window.
    canvas.style.left = `${Math.floor((window.innerWidth - canvas.width) / 2)}px`;
    canvas.style.top = `${Math.floor((window.innerHeight - canvas.height) / 2)}px`;
    return scale;
  }

  function drawSky(zoneName, camX) {
    const [top, bottom] = skyFor(zoneName);
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    gradient.addColorStop(0, top);
    gradient.addColorStop(0.62, bottom);
    gradient.addColorStop(0.62, '#3a2410');
    gradient.addColorStop(1, '#2a1a0c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // Low autumn sun and drifting clouds, parallaxed against the camera.
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(1080 - camX * 0.05, 110, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.cloud;
    for (let i = 0; i < 4; i += 1) {
      const cx = ((i * 430 - camX * 0.12) % 1500 + 1500) % 1500 - 110;
      const cy = 70 + i * 46;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 90, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 60, cy + 8, 60, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawScenery(zoneName, camX) {
    // Distant trees and farm buildings, one layer of parallax.
    ctx.fillStyle = 'rgba(58, 36, 16, 0.55)';
    for (let i = 0; i < 14; i += 1) {
      const tx = ((i * 397 - camX * 0.3) % 1600 + 1600) % 1600 - 160;
      const th = 120 + ((i * 53) % 70);
      ctx.beginPath();
      ctx.moveTo(tx, VIEW.groundY);
      ctx.lineTo(tx + 34, VIEW.groundY - th);
      ctx.lineTo(tx + 68, VIEW.groundY);
      ctx.closePath();
      ctx.fill();
    }
    if (zoneName === 'Farmyard') {
      // A red barn on the horizon.
      const bx = 900 - camX * 0.3;
      ctx.fillStyle = '#8a2f24';
      ctx.fillRect(bx, VIEW.groundY - 150, 190, 150);
      ctx.fillStyle = '#5d1f18';
      ctx.beginPath();
      ctx.moveTo(bx - 12, VIEW.groundY - 150);
      ctx.lineTo(bx + 95, VIEW.groundY - 210);
      ctx.lineTo(bx + 202, VIEW.groundY - 150);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5d1f18';
      ctx.fillRect(bx + 62, VIEW.groundY - 108, 66, 108);
      ctx.strokeStyle = '#f2e8d0';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(bx + 62, VIEW.groundY - 108);
      ctx.lineTo(bx + 128, VIEW.groundY);
      ctx.moveTo(bx + 128, VIEW.groundY - 108);
      ctx.lineTo(bx + 62, VIEW.groundY);
      ctx.stroke();
    }
    if (zoneName === 'Kitchen') {
      // Kitchen windows and a chimney, seen through the haze.
      const kx = 700 - camX * 0.3;
      ctx.fillStyle = 'rgba(30, 16, 10, 0.6)';
      ctx.fillRect(kx, VIEW.groundY - 220, 260, 220);
      ctx.fillStyle = '#ffcf7a';
      ctx.fillRect(kx + 30, VIEW.groundY - 180, 60, 70);
      ctx.fillRect(kx + 170, VIEW.groundY - 180, 60, 70);
    }
    // Ground.
    const ground = groundFor(zoneName);
    ctx.fillStyle = ground.fill;
    ctx.fillRect(0, VIEW.groundY, VIEW.width, VIEW.height - VIEW.groundY);
    ctx.fillStyle = ground.top;
    ctx.fillRect(0, VIEW.groundY, VIEW.width, 14);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let x = -((camX % 90) + 90); x < VIEW.width; x += 90) {
      ctx.fillRect(x, VIEW.groundY + 26, 46, 5);
    }
  }

  function drawFence(fence, camX) {
    const x = fence.x - camX;
    ctx.fillStyle = PALETTE.fenceDark;
    ctx.fillRect(x - 4, VIEW.groundY - fence.height, 8, fence.height);
    ctx.fillRect(x + fence.width - 4, VIEW.groundY - fence.height, 8, fence.height);
    ctx.fillStyle = PALETTE.fence;
    ctx.fillRect(x - 8, VIEW.groundY - fence.height + 8, fence.width + 16, 10);
    ctx.fillRect(x - 8, VIEW.groundY - fence.height + 34, fence.width + 16, 10);
    ctx.fillRect(x - 8, VIEW.groundY - fence.height + 58, fence.width + 16, 8);
  }

  function drawHaystack(hay, camX, time) {
    const x = hay.x - camX;
    const sway = Math.sin(time * 1.4 + hay.x) * 2;
    ctx.fillStyle = PALETTE.hayDark;
    ctx.beginPath();
    ctx.moveTo(x, VIEW.groundY);
    ctx.quadraticCurveTo(x + hay.width / 2 + sway, VIEW.groundY - hay.height - 18, x + hay.width, VIEW.groundY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.hay;
    ctx.beginPath();
    ctx.moveTo(x + 10, VIEW.groundY);
    ctx.quadraticCurveTo(x + hay.width / 2 + sway, VIEW.groundY - hay.height, x + hay.width - 10, VIEW.groundY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 80, 10, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 18 + i * 20, VIEW.groundY - 8);
      ctx.quadraticCurveTo(x + 22 + i * 20, VIEW.groundY - 48 - i * 4, x + 30 + i * 18, VIEW.groundY - 78);
      ctx.stroke();
    }
  }

  function drawOven(oven, camX, time) {
    const x = oven.x - camX;
    ctx.fillStyle = PALETTE.ovenTile;
    ctx.fillRect(x, VIEW.groundY - 8, oven.width, 26);
    ctx.fillStyle = PALETTE.ovenGlow;
    const flicker = 0.55 + Math.sin(time * 9 + oven.x) * 0.2 + Math.sin(time * 23) * 0.1;
    ctx.globalAlpha = flicker;
    for (let i = 0; i < 5; i += 1) {
      const fx = x + 14 + i * 24;
      ctx.beginPath();
      ctx.moveTo(fx, VIEW.groundY - 6);
      ctx.quadraticCurveTo(fx + 8, VIEW.groundY - 34, fx + 16, VIEW.groundY - 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffd27a';
    ctx.font = 'bold 17px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#3a1410';
    ctx.strokeText('HOT OVEN — JUMP IT!', x + oven.width / 2, VIEW.groundY - 44);
    ctx.fillText('HOT OVEN — JUMP IT!', x + oven.width / 2, VIEW.groundY - 44);
    ctx.textAlign = 'left';
  }

  function drawPuddle(puddle, camX) {
    const x = puddle.x - camX;
    ctx.fillStyle = PALETTE.puddle;
    ctx.beginPath();
    ctx.ellipse(x + puddle.width / 2, VIEW.groundY + 4, puddle.width / 2, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + puddle.width / 2 - 14, VIEW.groundY + 2, 18, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPickup(pickup, camX, time) {
    const x = pickup.x - camX;
    const bob = Math.sin(time * 3 + pickup.bob) * 5;
    const y = pickup.y + bob;
    if (pickup.kind === 'corn') {
      ctx.fillStyle = PALETTE.cornHusk;
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 8);
      ctx.lineTo(x, y - 16);
      ctx.lineTo(x + 12, y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.corn;
      ctx.beginPath();
      ctx.ellipse(x, y - 4, 11, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d8a92e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 16);
      ctx.lineTo(x - 6, y + 8);
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x, y + 10);
      ctx.moveTo(x + 6, y - 16);
      ctx.lineTo(x + 6, y + 8);
      ctx.stroke();
    } else if (pickup.kind === 'pie') {
      ctx.fillStyle = PALETTE.pie;
      ctx.beginPath();
      ctx.moveTo(x - 16, y + 10);
      ctx.lineTo(x + 16, y + 10);
      ctx.lineTo(x + 6, y - 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f7d9a0';
      ctx.beginPath();
      ctx.moveTo(x - 16, y + 10);
      ctx.lineTo(x + 16, y + 10);
      ctx.lineTo(x + 12, y + 2);
      ctx.lineTo(x - 12, y + 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#a04a1e';
      ctx.beginPath();
      ctx.arc(x, y - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fff8ea';
      ctx.beginPath();
      ctx.ellipse(x, y, 8, 18, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9b896';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 16);
      ctx.lineTo(x + 2, y + 14);
      ctx.stroke();
    }
  }

  function drawTurkey(turkey, camX, time) {
    const x = turkey.x - camX;
    const feetY = turkey.y;
    const runCycle = turkey.onGround && Math.abs(turkey.vx) > 20 ? Math.sin(time * 16) * 6 : 0;
    const blink = turkey.invulnerable > 0 && Math.floor(time * 14) % 2 === 0;
    ctx.save();
    if (blink) ctx.globalAlpha = 0.35;
    ctx.translate(x + TURKEY.width / 2, feetY);
    ctx.scale(turkey.facing, 1);
    // Fanned tail feathers.
    for (let i = 0; i < 5; i += 1) {
      const angle = -0.9 + i * 0.45;
      ctx.fillStyle = PALETTE.tailFeathers[i];
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(-26, -34, 10, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Legs.
    ctx.strokeStyle = '#e8a33c';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(-8 + runCycle, 0);
    ctx.moveTo(8, -8);
    ctx.lineTo(10 - runCycle, 0);
    ctx.stroke();
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(0, -30, 32, 24, -0.15, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = PALETTE.turkeyWing;
    ctx.beginPath();
    ctx.ellipse(-4, -30, 20, 13, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Neck and head.
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.ellipse(26, -58, 11, 16, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(30, -72, 10, 0, Math.PI * 2);
    ctx.fill();
    // Beak and wattle.
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(38, -74);
    ctx.lineTo(50, -70);
    ctx.lineTo(38, -66);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyWattle;
    ctx.beginPath();
    ctx.ellipse(34, -62, 4, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Eye.
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(32, -74, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (turkey.hidden) {
      ctx.fillStyle = 'rgba(255, 243, 224, 0.9)';
      ctx.font = 'bold 16px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDDEN', x + TURKEY.width / 2, feetY - 108);
      ctx.textAlign = 'left';
    }
  }

  function drawFarmer(farmer, camX, time) {
    const x = farmer.x - camX;
    const feetY = farmer.y;
    const walking = farmer.mode !== FARMER_SEARCH;
    const bob = walking ? Math.sin(time * 10) * 3 : 0;
    // Vision cone, drawn under the farmer.
    if (farmer.mode === FARMER_CHASE) {
      ctx.fillStyle = 'rgba(255, 83, 64, 0.22)';
    } else {
      ctx.fillStyle = 'rgba(255, 233, 168, 0.16)';
    }
    ctx.beginPath();
    const eyeX = x + 29 + farmer.facing * 20;
    const eyeY = feetY - 82;
    ctx.moveTo(eyeX, eyeY);
    ctx.lineTo(eyeX + farmer.facing * FARMER.visionRange, eyeY - 120);
    ctx.lineTo(eyeX + farmer.facing * FARMER.visionRange, eyeY + 60);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.translate(x + FARMER.width / 2, feetY);
    ctx.scale(farmer.facing, 1);
    // Legs.
    ctx.strokeStyle = PALETTE.farmerOveralls;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-8, -46 + bob);
    ctx.lineTo(-10 - bob, 0);
    ctx.moveTo(8, -46 - bob);
    ctx.lineTo(10 + bob, 0);
    ctx.stroke();
    // Overalls and shirt.
    ctx.fillStyle = PALETTE.farmerOveralls;
    ctx.fillRect(-16, -78, 32, 36);
    ctx.fillStyle = PALETTE.farmerShirt;
    ctx.fillRect(-18, -92, 36, 20);
    // Arms, one holding a pitchfork.
    ctx.strokeStyle = PALETTE.farmerShirt;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(12, -86);
    ctx.lineTo(26, -58);
    ctx.stroke();
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(28, -110);
    ctx.lineTo(28, -30);
    ctx.stroke();
    ctx.strokeStyle = '#c9ced6';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(28 + i * 6, -110);
      ctx.lineTo(28 + i * 6, -126);
      ctx.stroke();
    }
    // Head and straw hat.
    ctx.fillStyle = PALETTE.farmerSkin;
    ctx.beginPath();
    ctx.arc(0, -100, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerHat;
    ctx.beginPath();
    ctx.ellipse(0, -108, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -112, 12, 7, 0, Math.PI, 0);
    ctx.fill();
    // Moustache.
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(-8, -96, 16, 4);
    ctx.restore();

    if (farmer.mode === FARMER_CHASE) {
      ctx.fillStyle = PALETTE.alert;
      ctx.font = 'bold 22px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', x + FARMER.width / 2, feetY - 132);
      ctx.textAlign = 'left';
    } else if (farmer.mode === FARMER_SEARCH) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 22px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', x + FARMER.width / 2, feetY - 132);
      ctx.textAlign = 'left';
    }
  }

  function drawKnife(knife, camX) {
    const x = knife.x - camX;
    if (!knife.falling) {
      // Telegraph: a warning ring where the knife will land.
      ctx.strokeStyle = PALETTE.alert;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + KNIFE.width / 2, VIEW.groundY - 4, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.alert;
      ctx.font = 'bold 20px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', x + KNIFE.width / 2, VIEW.groundY - 28);
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(223, 230, 238, 0.9)';
      ctx.fillRect(x, -70, KNIFE.width, KNIFE.height);
      return;
    }
    ctx.save();
    ctx.translate(x + KNIFE.width / 2, knife.y + KNIFE.height / 2);
    ctx.rotate(0.12);
    ctx.fillStyle = PALETTE.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(0, -KNIFE.height / 2);
    ctx.lineTo(10, -8);
    ctx.lineTo(10, 6);
    ctx.lineTo(-10, 6);
    ctx.lineTo(-10, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.knifeHandle;
    ctx.fillRect(-8, 6, 16, 20);
    ctx.restore();
  }

  function drawGate(camX) {
    const x = WORLD.gateX - camX;
    ctx.fillStyle = '#3a5a2a';
    for (let i = 0; i < 4; i += 1) {
      const tx = x + 130 + i * 60;
      ctx.beginPath();
      ctx.moveTo(tx, VIEW.groundY);
      ctx.lineTo(tx + 22, VIEW.groundY - 150);
      ctx.lineTo(tx + 44, VIEW.groundY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#6e4a2f';
    ctx.fillRect(x - 8, VIEW.groundY - 190, 16, 190);
    ctx.fillRect(x + 96, VIEW.groundY - 190, 16, 190);
    ctx.fillRect(x - 16, VIEW.groundY - 200, 136, 18);
    ctx.fillStyle = '#2f6e2a';
    ctx.font = 'bold 20px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WOODS', x + 52, VIEW.groundY - 212);
    ctx.textAlign = 'left';
  }

  function drawHud(world, turkey, zone) {
    const t = turkey.state;
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(0, 0, VIEW.width, 64);
    ctx.strokeStyle = PALETTE.panelBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 64);
    ctx.lineTo(VIEW.width, 64);
    ctx.stroke();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 24px Trebuchet MS, sans-serif';
    ctx.fillText(`SCORE ${t.score}`, 20, 42);
    const distanceM = Math.floor(t.distance / 50);
    ctx.fillText(`DISTANCE ${distanceM}m`, 280, 42);
    ctx.fillText(`CORN ${t.corn}`, 560, 42);
    // Lives as hearts.
    for (let i = 0; i < TURKEY.maxLives; i += 1) {
      const hx = 720 + i * 36;
      ctx.fillStyle = i < t.lives ? '#ff5a6e' : 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(hx, 34, 10, 0, Math.PI * 2);
      ctx.arc(hx + 14, 34, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx - 8, 38);
      ctx.lineTo(hx + 22, 38);
      ctx.lineTo(hx + 7, 54);
      ctx.closePath();
      ctx.fill();
    }
    // Zone name and progress bar to the woods.
    ctx.fillStyle = PALETTE.muted;
    ctx.font = 'bold 20px Trebuchet MS, sans-serif';
    ctx.fillText(zone.name.toUpperCase(), 900, 42);
    const barX = 1050;
    const barW = 190;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(barX, 28, barW, 12);
    ctx.fillStyle = PALETTE.safe;
    ctx.fillRect(barX, 28, barW * clamp(t.distance / WORLD.gateX, 0, 1), 12);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 15px Trebuchet MS, sans-serif';
    ctx.fillText('FARM → WOODS', barX, 20);
    // Dash cooldown.
    if (t.dashCooldown > 0) {
      ctx.fillStyle = 'rgba(43, 24, 12, 0.75)';
      ctx.fillRect(14, 74, 76, 26);
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 15px Trebuchet MS, sans-serif';
      ctx.fillText('DASH…', 20, 92);
    }
    if (world.state.spottedFlash > 0) {
      ctx.fillStyle = PALETTE.alert;
      ctx.font = 'bold 44px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPOTTED! RUN!', VIEW.width / 2, 130);
      ctx.textAlign = 'left';
    }
    if (world.state.zoneBanner > 0) {
      ctx.fillStyle = 'rgba(255, 243, 224, 0.95)';
      ctx.font = 'bold 40px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(world.state.zoneBannerName.toUpperCase(), VIEW.width / 2, 200);
      ctx.textAlign = 'left';
    }
    if (world.state.hurtFlash > 0) {
      ctx.fillStyle = 'rgba(255, 40, 30, 0.18)';
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    }
  }

  function drawPanel(x, y, w, h) {
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = PALETTE.panelBorder;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
  }

  function drawTitle(world, best) {
    drawSky('Farmyard', 0);
    drawScenery('Farmyard', 0);
    // The hero turkey, big and centre-left.
    const hero = { x: 180, y: VIEW.groundY, vx: 0, vy: 0, facing: 1, onGround: true, invulnerable: 0, hidden: false };
    drawTurkey(hero, 0, world.state.time);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 84px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#3a2410';
    ctx.strokeText('GOBBLEWOOD', VIEW.width / 2 + 80, 180);
    ctx.strokeText('ESCAPE', VIEW.width / 2 + 80, 268);
    ctx.fillText('GOBBLEWOOD', VIEW.width / 2 + 80, 180);
    ctx.fillText('ESCAPE', VIEW.width / 2 + 80, 268);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3a2410';
    ctx.font = 'bold 26px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('One turkey. One farmer. One Thanksgiving to survive.', VIEW.width / 2 + 80, 316);
    ctx.textAlign = 'left';
    drawPanel(560, 350, 620, 210);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 24px Trebuchet MS, sans-serif';
    ctx.fillText('HOW TO ESCAPE', 590, 388);
    ctx.font = '22px Trebuchet MS, sans-serif';
    ctx.fillText('← → / A D — run    ↑ / SPACE — jump', 590, 424);
    ctx.fillText('SHIFT — dash    ↓ / S — hide in hay', 590, 456);
    ctx.fillText('Dodge knives and hot ovens. Outrun the farmer.', 590, 488);
    ctx.fillText('Reach the woods at the end of the Kitchen.', 590, 520);
    ctx.fillStyle = PALETTE.panelBorder;
    ctx.font = 'bold 30px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▶  PRESS ENTER OR CLICK TO START', VIEW.width / 2 + 80, 620);
    ctx.textAlign = 'left';
    if (best > 0) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = 'bold 22px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`BEST SCORE ${best}`, VIEW.width / 2 + 80, 664);
      ctx.textAlign = 'left';
    }
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20, 10, 5, 0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    drawPanel(440, 260, 400, 180);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 44px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW.width / 2, 330);
    ctx.font = '22px Trebuchet MS, sans-serif';
    ctx.fillText('Press P to keep running', VIEW.width / 2, 380);
    ctx.textAlign = 'left';
  }

  function drawCaught(world, best) {
    const t = world.turkey.state;
    ctx.fillStyle = 'rgba(40, 8, 4, 0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    drawPanel(340, 150, 600, 400);
    ctx.fillStyle = PALETTE.alert;
    ctx.font = 'bold 72px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAUGHT!', VIEW.width / 2, 250);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '26px Trebuchet MS, sans-serif';
    ctx.fillText('The farmer got you — Thanksgiving dinner it is.', VIEW.width / 2, 300);
    ctx.fillText(`Score ${t.score}   •   Distance ${Math.floor(t.distance / 50)}m`, VIEW.width / 2, 344);
    ctx.fillText(`Corn ${t.corn}   •   Pies ${t.pies}   •   Best ${best}`, VIEW.width / 2, 384);
    ctx.fillStyle = PALETTE.panelBorder;
    ctx.font = 'bold 30px Trebuchet MS, sans-serif';
    ctx.fillText('▶  PRESS R OR CLICK TO RUN AGAIN', VIEW.width / 2, 470);
    ctx.textAlign = 'left';
  }

  function drawEscaped(world, best) {
    const t = world.turkey.state;
    ctx.fillStyle = 'rgba(8, 40, 12, 0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    drawPanel(340, 130, 600, 430);
    ctx.fillStyle = PALETTE.safe;
    ctx.font = 'bold 72px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', VIEW.width / 2, 230);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '26px Trebuchet MS, sans-serif';
    ctx.fillText('You made it to the woods — no dinner today!', VIEW.width / 2, 280);
    ctx.fillText(`Score ${t.score}   •   Time ${t.runTime.toFixed(1)}s`, VIEW.width / 2, 324);
    ctx.fillText(`Corn ${t.corn}   •   Pies ${t.pies}   •   Distance ${Math.floor(t.distance / 50)}m`, VIEW.width / 2, 364);
    ctx.fillText(`Best ${best}`, VIEW.width / 2, 404);
    ctx.fillStyle = PALETTE.panelBorder;
    ctx.font = 'bold 30px Trebuchet MS, sans-serif';
    ctx.fillText('▶  PRESS R OR CLICK TO PLAY AGAIN', VIEW.width / 2, 490);
    ctx.textAlign = 'left';
  }

  return {
    fitCanvas,

    /** Draw the world for `screen`, with the camera on the turkey. */
    draw(world, screen, best) {
      const scale = fitCanvas();
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const turkey = world.turkey.state;
      const camX = clamp(turkey.x - 420, 0, WORLD.length - VIEW.width);
      const zone = world.zone();
      const time = world.state.time;

      if (screen === SCREEN_TITLE) {
        drawTitle(world, best);
        return;
      }

      drawSky(zone.name, camX);
      drawScenery(zone.name, camX);
      drawGate(camX);
      for (const fence of world.level.fences) drawFence(fence, camX);
      for (const hay of world.level.haystacks) drawHaystack(hay, camX, time);
      for (const oven of world.level.ovens) drawOven(oven, camX, time);
      for (const puddle of world.level.puddles) drawPuddle(puddle, camX);
      for (const pickup of world.level.pickups) {
        if (!pickup.taken) drawPickup(pickup, camX, time);
      }
      for (const knife of world.state.knives) drawKnife(knife, camX);
      drawFarmer(world.farmer.state, camX, time);
      drawTurkey(turkey, camX, time);

      if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
        drawHud(world, world.turkey, zone);
      }
      if (screen === SCREEN_PAUSED) drawPaused();
      if (screen === SCREEN_CAUGHT) drawCaught(world, best);
      if (screen === SCREEN_ESCAPED) drawEscaped(world, best);
    },
  };
}
