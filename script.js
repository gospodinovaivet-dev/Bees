/* ---------- Title intro: split the text into letters that float in ---------- */
let letterIndex = 0;
document.querySelectorAll("#title .line").forEach((line) => {
  const text = line.textContent;
  line.textContent = "";
  line.setAttribute("aria-hidden", "true");
  for (const char of text) {
    const span = document.createElement("span");
    span.className = "letter";
    span.textContent = char;
    span.style.setProperty("--i", letterIndex++);
    line.append(span);
  }
});

/* ---------- The bees ----------
   Each bee is a body image plus wing images cut from images/bees/bees-original.png.
   x / y is where the wing joins the body, as a percentage of the image.
   "right", "left" = side view facing that way. "up" = seen from above, head up. */
const BEE_TYPES = [
  { n: 1, facing: "right", w: 219, h: 211, wings: [{ src: "bee-1-wing.png", x: 38.9, y: 32.3 }] },
  { n: 2, facing: "left", w: 201, h: 186, wings: [{ src: "bee-2-wing.png", x: 44.2, y: 36.5 }] },
  { n: 3, facing: "right", w: 244, h: 183, wings: [{ src: "bee-3-wing.png", x: 43.2, y: 33.9 }] },
  { n: 4, facing: "right", w: 263, h: 199, wings: [{ src: "bee-4-wing.png", x: 42.0, y: 32.7 }] },
  { n: 5, facing: "up", w: 290, h: 224, wings: [
    { src: "bee-5-wing-1.png", x: 59.3, y: 37.5, side: "right" },
    { src: "bee-5-wing-2.png", x: 37.3, y: 38.5, side: "left" },
  ] },
  { n: 6, facing: "right", w: 214, h: 209, wings: [{ src: "bee-6-wing.png", x: 45.1, y: 39.1 }] },
  { n: 7, facing: "right", w: 208, h: 219, wings: [{ src: "bee-7-wing.png", x: 43.5, y: 35.7 }] },
  { n: 8, facing: "up", w: 305, h: 228, wings: [
    { src: "bee-8-wing-1.png", x: 36.8, y: 44.8, side: "left" },
    { src: "bee-8-wing-2.png", x: 64.6, y: 46.0, side: "right" },
  ] },
];

const CHATTER = [
  "Bzz", "Bzzz!", "Bzz bzz", "Honey?", "Busy day!", "So sweet!", "Bee happy!",
  "Hi, hive!", "Pollen time!", "Waggle waggle", "Flap flap", "Un-bee-lievable!",
];

const IMAGE_DIR = "images/bees/";
const SIZE = 0.34;           // on-screen size compared to the image files
const CLEARANCE = 14;        // gap kept between a bee and the things it avoids
const AVOID_BAND = 70;       // how far away a bee starts steering away
const MAX_BUBBLES = 2;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

const layer = document.getElementById("bee-layer");
const header = document.querySelector(".site-header");
// The card holds every button and field, so avoiding the card avoids them all.
const avoidElements = [document.getElementById("auth"), document.getElementById("logo-text")];

const random = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

let obstacles = [];
let bounds = { left: 0, top: 0, right: 0, bottom: 0 };

function measure() {
  obstacles = avoidElements.map((el) => el.getBoundingClientRect());
  // 44px is the honey drip that hangs below the header
  bounds = { left: 0, top: header.getBoundingClientRect().bottom + 44, right: innerWidth, bottom: innerHeight };
}

function distanceToRect(x, y, r) {
  const dx = Math.max(r.left - x, 0, x - r.right);
  const dy = Math.max(r.top - y, 0, y - r.bottom);
  return Math.hypot(dx, dy);
}

/* Does the straight line from a to b touch rectangle r grown by pad? */
function lineHitsRect(ax, ay, bx, by, r, pad) {
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / 12) || 1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (distanceToRect(ax + (bx - ax) * t, ay + (by - ay) * t, r) < pad) return true;
  }
  return false;
}

function pathIsClear(bee, x, y) {
  return !obstacles.some((r) => {
    // A bee already too close (the card just grew) may leave, but not get closer
    const pad = Math.min(bee.radius + CLEARANCE, distanceToRect(bee.x, bee.y, r) - 1);
    return lineHitsRect(bee.x, bee.y, x, y, r, pad);
  });
}

/* Pick somewhere to fly that can be reached without crossing anything.
   Of a few good options take the farthest, so bees roam instead of bunching up. */
function pickTarget(bee) {
  const pad = bee.width / 2 + 8;
  const safe = bee.radius + CLEARANCE;
  let best = null;
  let bestDistance = -1;
  let closest = null;
  let closestDistance = Infinity;
  let found = 0;
  for (let tries = 0; tries < 60 && found < 5; tries++) {
    const x = random(bounds.left + pad, Math.max(bounds.left + pad, bounds.right - pad));
    const y = random(bounds.top + pad, Math.max(bounds.top + pad, bounds.bottom - pad));
    if (!obstacles.every((r) => distanceToRect(x, y, r) >= safe)) continue;
    const distance = Math.hypot(x - bee.x, y - bee.y);
    if (distance < closestDistance) {
      closest = { x, y };
      closestDistance = distance;
    }
    if (!pathIsClear(bee, x, y)) continue;
    found++;
    if (distance > bestDistance) {
      best = { x, y };
      bestDistance = distance;
    }
  }
  // Boxed in by a card that just grew: slip out to the nearest free spot.
  // The bee layer is under the card, so this never draws over a button.
  const tooClose = obstacles.some((r) => distanceToRect(bee.x, bee.y, r) < safe);
  const spot = best || (tooClose || !bee.entered ? closest : null);
  bee.escaping = !best && Boolean(spot);
  if (!spot) return false;
  bee.tx = spot.x;
  bee.ty = spot.y;
  return true;
}

/* Bees give each other a little room */
function keepApart(dt) {
  for (let i = 0; i < bees.length; i++) {
    for (let j = i + 1; j < bees.length; j++) {
      const a = bees[i];
      const b = bees[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.hypot(dx, dy) || 1;
      const room = (a.radius + b.radius) * 1.3;
      if (distance >= room) continue;
      const push = (1 - distance / room) * 170 * dt;
      a.vx += (dx / distance) * push;
      a.vy += (dy / distance) * push;
      b.vx -= (dx / distance) * push;
      b.vy -= (dy / distance) * push;
    }
  }
}

function freeSpot(radius) {
  for (let tries = 0; tries < 200; tries++) {
    const x = random(bounds.left + radius, Math.max(bounds.left + radius, bounds.right - radius));
    const y = random(bounds.top + radius, Math.max(bounds.top + radius, bounds.bottom - radius));
    if (obstacles.every((r) => distanceToRect(x, y, r) >= radius + CLEARANCE)) return { x, y };
  }
  return null;
}

function createBee(type) {
  // Smaller on phones, where the gaps around the card are narrow
  const scale = SIZE * random(0.85, 1.12) * (innerWidth < 800 ? 0.7 : 1);
  const width = type.w * scale;
  const height = type.h * scale;

  const el = document.createElement("div");
  el.className = "bee";
  el.style.width = width + "px";
  el.style.height = height + "px";
  el.style.setProperty("--flap", random(0.1, 0.14).toFixed(3) + "s");

  const sprite = document.createElement("div");
  sprite.className = "bee-sprite";

  const addImage = (src, className, wing) => {
    const img = document.createElement("img");
    img.src = IMAGE_DIR + src;
    img.alt = "";
    img.draggable = false;
    if (className) img.className = className;
    if (wing) img.style.transformOrigin = `${wing.x}% ${wing.y}%`;
    sprite.append(img);
  };

  const topView = type.facing === "up";
  const addWings = () => type.wings.forEach((wing) => {
    const motion = topView ? `wing-top-${wing.side}` : "wing-side";
    addImage(wing.src, `wing ${motion} wing-ghost`, wing);
    addImage(wing.src, `wing ${motion}`, wing);
  });

  // Seen from above the wings tuck under the body; from the side they sit on top.
  if (topView) addWings();
  addImage(`bee-${type.n}-body.png`);
  if (!topView) addWings();

  const bubble = document.createElement("div");
  bubble.className = "bee-bubble";

  el.append(sprite, bubble);
  layer.append(el);

  const radius = Math.hypot(width, height) / 2 * 0.8;
  // Start just off screen, level with a free spot on the nearer side, and fly to it
  const arrival = freeSpot(radius) || { x: innerWidth / 2, y: bounds.top + height };
  const fromLeft = arrival.x < innerWidth / 2;
  const bee = {
    el, sprite, bubble, width, height,
    topView,
    native: type.facing === "left" ? -1 : 1,
    radius,
    x: fromLeft ? -width : innerWidth + width,
    y: arrival.y,
    vx: 0, vy: 0,
    tx: arrival.x, ty: arrival.y,
    speed: random(55, 95),
    hoverUntil: 0,
    entered: false,
    flip: fromLeft ? 1 : -1,   // eases between -1 and 1 so turning looks like turning
    facingDir: fromLeft ? 1 : -1,
    tilt: 0,
    heading: fromLeft ? 90 : -90,
    spin: 0,
    phase: random(0, 6.28),
    drawX: 0, drawY: 0,
    nextChat: performance.now() + random(3000, 12000),
    bubbleUntil: 0,
    bubbleW: 0, bubbleH: 0,
    bubbleSpot: null,
  };

  sprite.addEventListener("click", () => {
    bee.spin = 360;
    say(bee, "Wheee!", 1600);
  });
  return bee;
}

/* ---------- Speech bubbles ---------- */
function say(bee, text, duration = 2200) {
  bee.bubble.textContent = text;
  bee.bubbleW = bee.bubble.offsetWidth;
  bee.bubbleH = bee.bubble.offsetHeight;
  bee.bubbleSpot = null;
  bee.bubbleUntil = performance.now() + duration;
  bee.bubble.classList.add("show");
}

function nearestBee(el) {
  const r = el.getBoundingClientRect();
  const cx = (r.left + r.right) / 2;
  const cy = (r.top + r.bottom) / 2;
  let best = bees[0];
  let bestDistance = Infinity;
  bees.forEach((bee) => {
    const d = Math.hypot(bee.x - cx, bee.y - cy);
    if (bee.entered && d < bestDistance) {
      best = bee;
      bestDistance = d;
    }
  });
  return best;
}

/* Keep each bubble readable: on screen and clear of the card and title */
function placeBubble(bee) {
  const w = bee.bubbleW;
  const h = bee.bubbleH;
  const gap = 6;
  const spots = {
    above: [-w / 2, -bee.height / 2 - h - gap],
    below: [-w / 2, bee.height / 2 + gap],
    right: [bee.width / 2 + gap, -h / 2],
    left: [-bee.width / 2 - w - gap, -h / 2],
  };
  const clear = (x, y, r) => x + w < r.left || x > r.right || y + h < r.top || y > r.bottom;
  const fits = (spot) => {
    const x = bee.drawX + spots[spot][0];
    const y = bee.drawY + spots[spot][1];
    if (x < 6 || x + w > innerWidth - 6 || y < bounds.top || y + h > innerHeight - 6) return false;
    return obstacles.every((r) => clear(x, y, r));
  };
  // A new bubble also avoids the bubbles already showing
  const freeOfBubbles = (spot) => bees.every((other) =>
    other === bee || !other.bubbleBox || !other.bubble.classList.contains("show") ||
    clear(bee.drawX + spots[spot][0], bee.drawY + spots[spot][1], other.bubbleBox));
  if (!bee.bubbleSpot) {
    const names = Object.keys(spots);
    bee.bubbleSpot = names.find((s) => fits(s) && freeOfBubbles(s)) || names.find(fits) || "above";
  } else if (!fits(bee.bubbleSpot)) {
    bee.bubbleSpot = Object.keys(spots).find(fits) || bee.bubbleSpot;
  }
  const [ox, oy] = spots[bee.bubbleSpot];
  const x = clamp(bee.drawX + ox, 6, Math.max(6, innerWidth - w - 6));
  const y = bee.drawY + oy;
  bee.bubbleBox = { left: x, right: x + w, top: y, bottom: y + h };
  // The bubble lives inside .bee, whose corner sits at drawX - width/2
  bee.bubble.style.transform =
    `translate(${(x - bee.drawX + bee.width / 2).toFixed(1)}px, ${(y - bee.drawY + bee.height / 2).toFixed(1)}px)`;
}

/* ---------- Flying ---------- */
function steer(bee, now, dt) {
  const hovering = now < bee.hoverUntil;
  const dx = bee.tx - bee.x;
  const dy = bee.ty - bee.y;
  const distance = Math.hypot(dx, dy);

  if (!hovering) {
    if (distance < 28) {
      // Arrived: sometimes stop and hover like a real bee, then choose a new spot
      if (Math.random() < 0.55) bee.hoverUntil = now + random(700, 2600);
      pickTarget(bee);
    } else if (!bee.escaping && !pathIsClear(bee, bee.tx, bee.ty)) {
      // Something moved (e.g. the Register form is taller): choose another way
      pickTarget(bee);
    }
  }

  let wantX = 0;
  let wantY = 0;
  if (!hovering && distance > 0) {
    const easeIn = Math.min(1, distance / 60);
    wantX = (dx / distance) * bee.speed * easeIn;
    wantY = (dy / distance) * bee.speed * easeIn;
  }

  // Slow turns make long lazy curves instead of sharp corners
  const turn = Math.min(1, dt * 1.6);
  bee.vx += (wantX - bee.vx) * turn;
  bee.vy += (wantY - bee.vy) * turn;

  // Lean away from anything close
  obstacles.forEach((r) => {
    const safe = bee.radius + CLEARANCE;
    const d = distanceToRect(bee.x, bee.y, r);
    if (d >= safe + AVOID_BAND) return;
    const cx = clamp(bee.x, r.left, r.right);
    const cy = clamp(bee.y, r.top, r.bottom);
    let nx = bee.x - cx;
    let ny = bee.y - cy;
    if (nx === 0 && ny === 0) {
      // Inside the rectangle: head for the nearest edge
      const toEdges = [bee.x - r.left, r.right - bee.x, bee.y - r.top, r.bottom - bee.y];
      const nearest = toEdges.indexOf(Math.min(...toEdges));
      nx = [-1, 1, 0, 0][nearest];
      ny = [0, 0, -1, 1][nearest];
    }
    const length = Math.hypot(nx, ny);
    nx /= length;
    ny /= length;
    const push = 1 - clamp((d - safe) / AVOID_BAND, 0, 1);
    bee.vx += nx * push * push * 520 * dt;
    bee.vy += ny * push * push * 520 * dt;
    // Never keep moving into a rectangle once inside the safe distance
    if (d < safe) {
      const into = bee.vx * nx + bee.vy * ny;
      if (into < 0) {
        bee.vx -= into * nx;
        bee.vy -= into * ny;
      }
    }
  });

  bee.x += bee.vx * dt;
  bee.y += bee.vy * dt;

  if (!bee.entered) {
    if (bee.x > bee.width / 2 && bee.x < innerWidth - bee.width / 2) bee.entered = true;
  } else {
    // Stay fully on screen, leaving room for the weave added in draw()
    const padX = bee.width / 2 + 8;
    const padY = bee.height / 2 + 8;
    bee.x = clamp(bee.x, bounds.left + padX, Math.max(bounds.left + padX, bounds.right - padX));
    bee.y = clamp(bee.y, bounds.top + padY, Math.max(bounds.top + padY, bounds.bottom - padY));
  }
}

function draw(bee, now, dt) {
  const seconds = now / 1000;
  const speedNow = Math.hypot(bee.vx, bee.vy);

  // Bees never fly quite straight: a small weave plus a bob, stronger while hovering
  const weave = calm ? 0 : 5;
  const jitter = calm ? 0 : 1.2;
  const bob = calm ? 0 : 3.5;
  const offsetX = Math.sin(seconds * 2.3 + bee.phase) * weave + Math.sin(seconds * 7.1 + bee.phase) * jitter;
  const offsetY = Math.sin(seconds * 3.1 + bee.phase * 2) * weave + Math.sin(seconds * 9 + bee.phase) * bob;
  bee.drawX = bee.x + offsetX;
  bee.drawY = bee.y + offsetY;

  bee.el.style.transform =
    `translate3d(${(bee.drawX - bee.width / 2).toFixed(1)}px, ${(bee.drawY - bee.height / 2).toFixed(1)}px, 0)`;

  bee.spin = Math.max(0, bee.spin - dt * 420);

  let transform;
  if (bee.topView) {
    if (speedNow > 8) {
      const want = (Math.atan2(bee.vy, bee.vx) * 180) / Math.PI + 90;
      const difference = ((want - bee.heading + 540) % 360) - 180;
      bee.heading += difference * Math.min(1, dt * 3.5);
    }
    transform = `rotate(${(bee.heading + bee.spin).toFixed(1)}deg)`;
  } else {
    // Only turn round once clearly moving the other way, so bees don't flicker
    if (Math.abs(bee.vx) > 14) bee.facingDir = Math.sign(bee.vx);
    bee.flip += (bee.facingDir - bee.flip) * Math.min(1, dt * 7);
    const climb = clamp(bee.vy / Math.max(bee.speed, 1), -1, 1);
    const wantTilt = climb * 20 * bee.facingDir;
    bee.tilt += (wantTilt - bee.tilt) * Math.min(1, dt * 4);
    // Keep a sliver of width mid-turn so the bee never vanishes
    const flip = Math.abs(bee.flip) < 0.08 ? 0.08 * (bee.flip < 0 ? -1 : 1) : bee.flip;
    transform = `rotate(${(bee.tilt + bee.spin * bee.facingDir).toFixed(1)}deg) scaleX(${(flip * bee.native).toFixed(3)})`;
  }
  bee.sprite.style.transform = transform;

  if (bee.bubble.classList.contains("show")) {
    if (now > bee.bubbleUntil) bee.bubble.classList.remove("show");
    else placeBubble(bee);
  }
}

function chatter(now) {
  const showing = bees.filter((bee) => bee.bubble.classList.contains("show")).length;
  if (showing >= MAX_BUBBLES) return;
  const bee = bees.find((b) => b.entered && now > b.nextChat);
  if (!bee) return;
  bee.nextChat = now + random(6000, 15000);
  say(bee, CHATTER[Math.floor(Math.random() * CHATTER.length)]);
}

/* ---------- Start ---------- */
measure();

const beeCount = innerWidth < 800 ? 3 : innerWidth < 1200 ? 5 : BEE_TYPES.length;
const bees = BEE_TYPES.slice().sort(() => Math.random() - 0.5).slice(0, beeCount).map(createBee);

if (calm) {
  // Reduced motion: bees sit still in free spots and only talk when something happens
  const settle = (bee) => {
    const spot = freeSpot(bee.radius);
    if (spot) Object.assign(bee, spot);
    bee.el.hidden = !spot;
    bee.entered = true;
  };
  bees.forEach(settle);
  addEventListener("resize", () => {
    measure();
    bees.forEach(settle);
  });
} else {
  bees.forEach((bee, i) => {
    bee.startAt = performance.now() + 1400 + i * 650; // arrive one by one after the title
  });
}

let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  measure();
  if (!calm) keepApart(dt);
  bees.forEach((bee) => {
    if (!calm && now >= bee.startAt) steer(bee, now, dt);
    draw(bee, now, dt);
  });
  if (!calm) chatter(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- Little reactions ---------- */
document.querySelectorAll('input[type="password"]').forEach((input) => {
  input.addEventListener("focus", () => say(nearestBee(input), "I'm not looking!", 2600));
});

document.querySelectorAll("[data-say]").forEach((button) => {
  button.addEventListener("click", () => say(nearestBee(button), button.dataset.say, 2600));
});

const exitButton = document.getElementById("exit-button");
exitButton.addEventListener("click", () => say(nearestBee(exitButton), "Bye-bye, bzz!", 2600));
