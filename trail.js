/* ---------- The trail bee ----------
   As you scroll, a bee zigzags down the side of the page with you, leaving a dashed
   golden trail, and lands near the end of the page: halfway down the last part or
   in its bottom corner, on the left or the right. Each visit picks a different
   flight from last time. Works on any page that marks these in its HTML:

     .journey             the scrolling content the bee flies over
     [data-trail-start]   the block she waits beside at the top (the hero text)
     [data-trail-cross]   she may only change sides above the top of this block
     [data-trail-end]     the last part, where she lands (data-trail-say = her line)
     [data-trail-band]    optional, inside the end part: the content she flies beside

   Uses BEE_TYPES, buildSprite(), readStore(), writeStore(), random(), clamp()
   and calm from bees.js. */
(() => {
  const journey = document.querySelector(".journey");
  const startEl = document.querySelector("[data-trail-start]");
  const crossEl = document.querySelector("[data-trail-cross]");
  const endEl = document.querySelector("[data-trail-end]");
  if (!journey || !startEl || !crossEl || !endEl) return;
  const endBandEl = endEl.querySelector("[data-trail-band]") || endEl;

  // The trail itself
  const SVG = "http://www.w3.org/2000/svg";
  const trail = document.createElementNS(SVG, "svg");
  trail.classList.add("trail");
  trail.setAttribute("aria-hidden", "true");
  const trailGlow = document.createElementNS(SVG, "path");
  trailGlow.classList.add("trail-glow");
  const trailLine = document.createElementNS(SVG, "path");
  trailLine.classList.add("trail-line");
  trail.append(trailGlow, trailLine);
  journey.append(trail);

  // Pick a flight that's different from last time on this page
  const flightKey = "beeworkers-last-flight-" + location.pathname.split("/").pop();
  const plans = [];
  for (const from of ["left", "right"]) {
    for (const to of ["left", "right"]) {
      for (const spot of ["middle", "bottom"]) plans.push({ from, to, spot, key: `${from}-${to}-${spot}` });
    }
  }
  const last = readStore(flightKey, null);
  const choices = plans.filter((p) => p.key !== last);
  const plan = choices[Math.floor(Math.random() * choices.length)];
  writeStore(flightKey, plan.key);

  // The bee
  const type = BEE_TYPES.find((t) => t.n === 3); // side view, facing right
  const scale = innerWidth < 800 ? 0.3 : 0.4;
  const beeW = type.w * scale;
  const beeH = type.h * scale;
  const bee = document.createElement("div");
  bee.className = "scroll-bee";
  bee.style.width = beeW + "px";
  bee.style.height = beeH + "px";
  bee.style.setProperty("--flap", "0.11s");
  const sprite = buildSprite(type);
  const bubble = document.createElement("div");
  bubble.className = "bee-bubble";
  bubble.classList.toggle("on-right", plan.to === "left");
  bubble.textContent = endEl.dataset.trailSay || "Bzz, we're here!";
  bee.append(sprite, bubble);
  journey.append(bee);

  const smooth = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  let path = null;

  function layout() {
    trail.setAttribute("width", 0);
    trail.setAttribute("height", 0);
    const width = journey.clientWidth;
    const height = journey.scrollHeight;
    trail.setAttribute("width", width);
    trail.setAttribute("height", height);
    trail.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const margin = Math.max(beeW * 0.7, 50);
    const box = journey.getBoundingClientRect();
    const inJourney = (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left - box.left, right: r.right - box.left, top: r.top - box.top, bottom: r.bottom - box.top };
    };
    // The empty strip beside some content, so the trail never scribbles over text
    const band = (side, content) => {
      const room = side === "left" ? content.left : width - content.right;
      const x = side === "left" ? Math.max(margin, room / 2) : Math.min(width - margin, width - room / 2);
      return { x, amplitude: clamp(room / 2 - margin / 2, 20, 130) };
    };

    const start = inJourney(startEl);
    const end = inJourney(endEl);
    const endY = Math.min(
      plan.spot === "middle" ? (end.top + end.bottom) / 2 : end.bottom - 40,
      height - beeH,
    );
    const crossFrom = start.bottom + 30;
    const journeyTop = box.top + scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);

    path = {
      start: { x: band(plan.from, start).x, y: start.top + (start.bottom - start.top) * 0.4 },
      end: { x: plan.to === "left" ? margin : width - margin, y: endY },
      startBand: band(plan.from, start),
      endBand: band(plan.to, inJourney(endBandEl)),
      crossFrom,
      crossTo: Math.max(crossFrom + 1, inJourney(crossEl).top - 10),
      margin,
      width,
      // Landed when she's a little below the middle of the screen (or the page can't scroll further)
      scrollEnd: clamp(journeyTop + endY - innerHeight * 0.6, 1, maxScroll),
    };
  }

  /* Position along the flight, t from 0 (beside the hero text) to 1 (landed) */
  function flightPoint(t) {
    const { start, end, startBand, endBand, crossFrom, crossTo, margin, width } = path;
    const y = lerp(start.y, end.y, t);
    const cross = smooth(clamp((y - crossFrom) / (crossTo - crossFrom), 0, 1));
    const bandX = lerp(startBand.x, endBand.x, cross);
    const amplitude = lerp(startBand.amplitude, endBand.amplitude, cross);
    // Side-to-side swoops, about one every 320px, calm at both ends
    const waves = Math.max(2, Math.round((end.y - start.y) / 320)) + 0.5;
    const swoop = Math.sin(t * Math.PI * 2 * waves) * amplitude * Math.pow(Math.sin(Math.PI * t), 0.8);
    // Tuck right into the corner for the last bit
    const x = lerp(bandX + swoop, end.x, smooth(clamp((t - 0.9) / 0.1, 0, 1)));
    return { x: clamp(x, margin, width - margin), y };
  }

  function trailUpTo(t) {
    if (t <= 0.001) return "";
    const steps = Math.ceil(t * Math.max(220, (path.end.y - path.start.y) / 6));
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const p = flightPoint((t * i) / steps);
      d += `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }
    return d;
  }

  function sparkle(x, y) {
    const s = document.createElement("span");
    s.className = "sparkle";
    s.style.setProperty("--x", `${(x + random(-10, 10)).toFixed(1)}px`);
    s.style.setProperty("--y", `${(y + random(-6, 10)).toFixed(1)}px`);
    journey.append(s);
    s.addEventListener("animationend", () => s.remove());
  }

  const startFacing = plan.from === "right" ? -1 : 1; // face the hero text
  const flight = { t: 0, prevX: 0, prevY: 0, facing: startFacing, flip: startFacing, tilt: 0, lastSparkle: 0, arrived: false };

  function frame(now) {
    const target = calm ? 1 : clamp(scrollY / path.scrollEnd, 0, 1);
    // Ease towards the scroll position so the flight feels smooth, not jerky
    flight.t += (target - flight.t) * (calm ? 1 : 0.12);
    if (Math.abs(target - flight.t) < 0.0005) flight.t = target;

    const point = flightPoint(flight.t);
    const arrived = flight.t > 0.995;
    const bob = calm ? 0 : Math.sin(now / 260) * 4; // gentle hover
    const x = point.x;
    const y = point.y + bob;

    // Face and lean the way she's moving; once landed, look back at the page
    const dx = x - flight.prevX;
    const dy = y - flight.prevY;
    const moving = Math.hypot(dx, dy) > 0.6;
    if (Math.abs(dx) > 0.8) flight.facing = Math.sign(dx);
    if (arrived) flight.facing = plan.to === "right" ? -1 : 1;
    if (flight.t === 0) flight.facing = startFacing;
    const wantTilt = moving && !calm ? clamp((Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI, -35, 35) : 0;
    flight.flip += (flight.facing - flight.flip) * (calm ? 1 : 0.18);
    flight.tilt += (wantTilt - flight.tilt) * (calm ? 1 : 0.12);
    flight.prevX = x;
    flight.prevY = y;

    const flip = Math.abs(flight.flip) < 0.08 ? 0.08 * Math.sign(flight.flip || 1) : flight.flip;
    bee.style.transform = `translate3d(${(x - beeW / 2).toFixed(1)}px, ${(y - beeH / 2).toFixed(1)}px, 0)`;
    sprite.style.transform = `rotate(${(flight.tilt * flight.facing).toFixed(1)}deg) scaleX(${flip.toFixed(3)})`;

    const d = trailUpTo(flight.t);
    trailGlow.setAttribute("d", d);
    trailLine.setAttribute("d", d);

    // Little golden sparkles shake off while flying
    if (!calm && moving && !arrived && now - flight.lastSparkle > 70) {
      flight.lastSparkle = now;
      sparkle(x - flight.facing * beeW * 0.35, y);
    }

    if (arrived !== flight.arrived) {
      flight.arrived = arrived;
      bubble.classList.toggle("show", arrived);
    }
    requestAnimationFrame(frame);
  }

  layout();
  flight.prevX = flightPoint(0).x;
  flight.prevY = flightPoint(0).y;
  new ResizeObserver(layout).observe(journey);
  addEventListener("resize", layout);
  requestAnimationFrame(frame);
})();
