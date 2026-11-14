/* Donations page: fundraising bar, thank-you shop, mystery box and the (demo) donation form.
   Uses say(), nearestBee() and calm from bees.js. No real payment happens here. */

/* ---------- Products and prices: edit them here ---------- */
const PRODUCTS = [
  { id: "honey", name: "Jar of wildflower honey", price: 10, img: "images/donations/honey-jar.jpg",
    text: "450 g of raw honey from our Valley Fields Apiary." },
  { id: "candle", name: "Beeswax candle", price: 12, img: "images/donations/wax-candle.jpg",
    text: "Hand-poured from our own wax, with a carved flower pattern." },
  { id: "carving", name: "Hand-carved bee panel", price: 180, img: "images/donations/bee-carving.jpg", tag: "One of a kind",
    text: "A big relief carving of a bee on honeycomb, cut by hand from a single board by a local woodcarver." },
  { id: "figure", name: "Wooden bee figure", price: 18, img: "images/donations/bee-figure.svg",
    text: "A small hand-painted bee on a round wooden stand." },
  { id: "comb", name: "Honeycomb square", price: 9, img: "images/donations/honeycomb.svg",
    text: "200 g of honey still in the comb, straight from the hive." },
  { id: "hotel", name: "Bee hotel", price: 22, img: "images/donations/bee-hotel.svg",
    text: "A cosy home for wild solitary bees, for your garden or balcony." },
  { id: "name", name: "Name a hive", price: 40, img: "images/donations/name-a-hive.svg",
    text: "Your name on one of our hives for a whole year, with a certificate." },
  { id: "seeds", name: "Wildflower seed pack", price: 5, img: "images/donations/seed-pack.svg",
    text: "Enough seeds for 2 m² of bee-friendly flowers." },
  { id: "balm", name: "Beeswax lip balm", price: 4, img: "images/donations/lip-balm.svg",
    text: "Made with our own beeswax and a drop of honey." },
  { id: "dipper", name: "Wooden honey dipper", price: 3, img: "images/donations/honey-dipper.svg",
    text: "The proper way to get honey out of the jar." },
];

/* Mystery box: what goes in, by how much you give */
const BOXES = [
  { from: 101, label: "€101+", text: "6 items: honey, a beeswax candle, a wooden bee figure and 3 surprises" },
  { from: 51, label: "€51–100", text: "5 items, always with a jar of honey and a beeswax candle" },
  { from: 26, label: "€26–50", text: "4 items, always with a jar of honey" },
  { from: 10, label: "€10–25", text: "3 small treats, like lip balm, a honey dipper or wildflower seeds" },
];

// How each euro is shared out (same as the "Every €10 you give" card)
const SPLIT = [
  ["Hive boxes & frames", 0.3],
  ["Bee colonies", 0.25],
  ["Solar hive sensors", 0.15],
  ["Wildflower meadows", 0.1],
  ["Stands & water stations", 0.08],
  ["Suits & tools", 0.07],
  ["Bee health care", 0.05],
];

const euros = (n) => "€" + n.toLocaleString("en", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---------- Fundraising goal ---------- */
const goal = document.querySelector(".goal");
const goalFill = document.getElementById("goal-fill");
let raised = Number(goal.dataset.raised);
let donors = Number(goal.dataset.donors);
const target = Number(goal.dataset.target);

function showGoal() {
  goalFill.style.width = Math.min(100, (raised / target) * 100) + "%";
  document.getElementById("goal-raised").textContent = euros(raised);
  document.getElementById("goal-donors").textContent = donors;
}
setTimeout(showGoal, calm ? 0 : 700); // fill up once the page curtain has lifted

/* ---------- The shop ---------- */
const cart = {}; // product id -> how many
const shop = document.getElementById("shop");

shop.innerHTML = PRODUCTS.map((p) => `
  <article class="gift-card" data-id="${p.id}">
    <div class="gift-img"><img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy"></div>
    <div class="card-text">
      <p class="price">${euros(p.price)}</p>
      ${p.tag ? `<p class="tag">${p.tag}</p>` : ""}
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.text)}</p>
      <button type="button" class="btn add">Add</button>
    </div>
  </article>`).join("");

document.getElementById("box-tiers").innerHTML = BOXES.slice().reverse()
  .map((b) => `<li><b>${b.label}</b><span>${b.text}</span></li>`).join("");

/* ---------- The form ---------- */
const form = document.getElementById("donate-form");
const button = document.getElementById("donate-button");
const message = document.getElementById("donate-message");
const cartList = document.getElementById("cart");
const extra = document.getElementById("extra");
const modeRadios = [...form.querySelectorAll('input[name="mode"]')];

const mode = () => modeRadios.find((r) => r.checked).value;

function setMode(value) {
  modeRadios.forEach((r) => (r.checked = r.value === value));
  form.querySelectorAll(".mode-panel").forEach((panel) => (panel.hidden = panel.dataset.mode !== value));
  update();
}

// Amount picked in a panel: the typed "Other" amount wins over the preset pills
function panelAmount(name) {
  const panel = form.querySelector(`.mode-panel[data-mode="${name}"]`);
  const typed = Math.floor(Number(panel.querySelector(".other").value));
  if (typed > 0) return typed;
  const checked = panel.querySelector('input[type="radio"]:checked');
  return checked ? Number(checked.value) : 0;
}

const cartTotal = () => PRODUCTS.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);

function amount() {
  if (mode() === "plain") return panelAmount("plain");
  if (mode() === "box") return panelAmount("box");
  return cartTotal() + Math.max(0, Math.floor(Number(extra.value) || 0));
}

function giftText(total) {
  if (mode() === "plain") return "No gift, just a big thank-you from the hive. 💛";
  if (mode() === "box") {
    const box = BOXES.find((b) => total >= b.from);
    return box ? `A mystery box with ${box.text}.` : "Mystery boxes start at €10.";
  }
  const picked = PRODUCTS.filter((p) => cart[p.id]).map((p) => `${cart[p.id]} × ${p.name}`);
  return picked.length ? picked.join(", ") + "." : "Nothing picked yet.";
}

function renderCart() {
  const picked = PRODUCTS.filter((p) => cart[p.id]);
  document.getElementById("cart-empty").hidden = picked.length > 0;
  cartList.innerHTML = picked.map((p) => `
    <li data-id="${p.id}">
      <span>${escapeHtml(p.name)}</span>
      <span class="qty">
        <button type="button" class="less" aria-label="One less ${escapeHtml(p.name)}">−</button>
        <b>${cart[p.id]}</b>
        <button type="button" class="more" aria-label="One more ${escapeHtml(p.name)}">+</button>
      </span>
      <b>${euros(cart[p.id] * p.price)}</b>
    </li>`).join("");
  // Show how many of each are picked on the shop cards
  shop.querySelectorAll(".gift-card").forEach((card) => {
    const n = cart[card.dataset.id] || 0;
    card.classList.toggle("in-cart", n > 0);
    card.querySelector(".add").textContent = n ? `Added × ${n} (add more)` : "Add";
  });
}

function update() {
  const total = amount();
  const gift = mode() !== "plain";
  document.getElementById("summary-amount").textContent = euros(total);
  document.getElementById("summary-gift").textContent = giftText(total);
  document.getElementById("summary-split").innerHTML = SPLIT
    .map(([name, share]) => `<li><span>${name}</span><b>${euros(Math.round(total * share * 100) / 100)}</b></li>`)
    .join("");
  document.getElementById("email-why").textContent = gift ? "(so we can send your gift)" : "(optional)";
  if (!form.classList.contains("thanked")) button.textContent = total > 0 ? `Donate ${euros(total)}` : "Donate";
}

modeRadios.forEach((r) => r.addEventListener("change", () => setMode(r.value)));

form.querySelectorAll(".mode-panel").forEach((panel) => {
  const other = panel.querySelector(".other");
  if (!other) return;
  panel.querySelectorAll('input[type="radio"]').forEach((r) => r.addEventListener("change", () => {
    other.value = "";
    update();
  }));
  other.addEventListener("input", () => {
    // Typing your own amount un-picks the preset ones
    if (other.value) panel.querySelectorAll('input[type="radio"]').forEach((r) => (r.checked = false));
    update();
  });
});

extra.addEventListener("input", update);

cartList.addEventListener("click", (event) => {
  const id = event.target.closest("li")?.dataset.id;
  if (!id) return;
  if (event.target.classList.contains("more")) cart[id] += 1;
  else if (event.target.classList.contains("less")) cart[id] -= 1;
  else return;
  if (cart[id] <= 0) delete cart[id];
  renderCart();
  update();
});

const scrollToForm = () => document.getElementById("donate").scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });

shop.addEventListener("click", (event) => {
  const add = event.target.closest(".add");
  if (!add) return;
  const id = add.closest(".gift-card").dataset.id;
  cart[id] = (cart[id] || 0) + 1;
  renderCart();
  setMode("gifts");
  say(nearestBee(add), "Added to your gifts!", 1800);
});

document.getElementById("pick-box").addEventListener("click", (event) => {
  setMode("box");
  scrollToForm();
  say(nearestBee(event.currentTarget), "Ooh, a surprise!", 2000);
});

/* ---------- Donate (demo) ---------- */
function tell(text, kind = "error") {
  message.textContent = text;
  message.dataset.kind = kind;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (form.classList.contains("thanked")) return;
  const total = amount();
  const name = form.elements["donor-name"].value.trim();
  const email = form.elements["donor-email"];
  const needsEmail = mode() !== "plain";

  if (mode() === "gifts" && cartTotal() === 0) return tell("Pick at least one gift above, bzz!");
  if (mode() === "box" && total < 10) return tell("Mystery boxes start at €10.");
  if (total <= 0) return tell("Pick an amount first, bzz!");
  if (!name) return tell("Tell us your name, so we can thank you!");
  if (needsEmail && (!email.value.trim() || !email.checkValidity())) return tell("We need your email to send your gift.");
  if (!needsEmail && email.value.trim() && !email.checkValidity()) return tell("That email looks odd!");

  raised += total;
  donors += 1;
  showGoal();
  form.classList.add("thanked");
  button.textContent = "Thank you! 💛";
  button.disabled = true;
  tell(`Thank you, ${name}! You gave ${euros(total)}. (Demo: no money was taken.)`, "ok");
  say(nearestBee(button), "Bzz, thank you!", 3000);
});

renderCart();
update();
