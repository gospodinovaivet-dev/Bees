/* Shared by the pages you see after logging in (main, donations):
   greeting, burger menu, smooth in-page links, "coming soon" links and log out.
   Uses say(), nearestBee(), readStore(), writeStore(), goTo() and calm from bees.js. */

/* ---------- Greeting for the logged-in (mock) account ---------- */
const session = readStore(SESSION_KEY, null);
const hello = document.getElementById("hello");
if (hello && session?.name) {
  hello.textContent = `Hi, ${session.name}!`;
  hello.hidden = false;
}

/* ---------- Burger menu ---------- */
const burger = document.getElementById("burger");
const menu = document.getElementById("site-menu");

function setMenu(open) {
  menu.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));

document.addEventListener("click", (event) => {
  if (menu.classList.contains("open") && !menu.contains(event.target) && !burger.contains(event.target)) {
    setMenu(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.classList.contains("open")) {
    setMenu(false);
    burger.focus();
  }
});

/* ---------- Our bases and the people to call: edit them here ----------
   Used by the footer, the location boxes under the hives and the Participate window.
   Made-up details. The phone numbers are from a range reserved for films and TV,
   so they can't reach anyone: replace them with your team's real numbers. */
const CONTACTS = {
  victor: { name: "Victor Hale", role: "Founder & Head Beekeeper", phone: "+44 7700 900400", photo: "images/team/boss.jpg" },
  leo: { name: "Leo Brandt", role: "Hive Engineer", phone: "+44 7700 900141", photo: "images/team/leo.jpg" },
  rosa: { name: "Rosa Ilieva", role: "Florist & Meadow Designer", phone: "+44 7700 900287", photo: "images/team/rosa.jpg" },
  maya: { name: "Maya Petrova", role: "Energy & Sensor Engineer", phone: "+44 7700 900356", photo: "images/team/maya.jpg" },
};

const BASES = [
  {
    id: "forest", name: "Forest Edge Apiary", contact: "leo",
    place: "Green Hollow, 18 km north of the city", directions: "Turn off at the Green Hollow sign and follow the bee signs for 1 km.",
    visits: "Saturdays 9:00–13:00",
    tasks: ["Building and fixing hives", "Painting hive boxes", "Mowing paths between the hives"],
  },
  {
    id: "oak", name: "Oak Wood Apiary", contact: "rosa",
    place: "Old Oak Lane, Brookfield, 25 km east of the city", directions: "Park by the Brookfield church and walk 10 minutes along Old Oak Lane.",
    visits: "Sundays 10:00–14:00",
    tasks: ["Planting wildflowers", "Hive checks with a beekeeper", "Learning beekeeping basics"],
  },
  {
    id: "valley", name: "Valley Fields Apiary", contact: "maya",
    place: "Riverside Valley Road, 32 km south of the city", directions: "Follow Riverside Valley Road to the orchards; the hives are behind the red barn.",
    visits: "Wednesdays & Saturdays 8:00–12:00",
    tasks: ["Honey harvest (in summer)", "Checking the solar sensors", "Sowing meadow strips"],
  },
];

const EMAIL = "hello@beeworkers.example"; // placeholder address

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const telHref = (phone) => "tel:" + phone.replace(/[^\d+]/g, "");

/* ---------- Footer (the same on every page) ---------- */
const thisPage = location.pathname.split("/").pop() || "index.html";
// A link to a spot on the page you're already on scrolls there smoothly instead
const pageLink = (href, text) => {
  const [page, hash] = href.split("#");
  if (page === thisPage) return `<a href="#${hash || "top"}" data-scroll>${text}</a>`;
  return `<a href="${href}">${text}</a>`;
};

const footer = document.getElementById("site-footer");
if (footer) {
  footer.innerHTML = `
    <div class="footer-grid">
      <div class="footer-brand">
        <p class="footer-logo"><img src="images/bees/bee-1.png" alt=""> BeeWorkers</p>
        <p>Beekeepers, engineers and gardeners looking after honeybees in the countryside since 2019.</p>
        <button type="button" class="btn btn-honey" data-participate>Volunteer with us</button>
      </div>
      <nav class="footer-col" aria-label="Footer">
        <h2>Explore</h2>
        ${pageLink("main.html", "Home")}
        ${pageLink("main.html#about", "About us")}
        ${pageLink("main.html#team", "Our workers")}
        ${pageLink("main.html#hives", "Our hives")}
        ${pageLink("donations.html", "Donations")}
        ${pageLink("funfacts.html", "Fun Facts")}
      </nav>
      <div class="footer-col">
        <h2>Our bases</h2>
        ${BASES.map((b) => `<p><b>${esc(b.name)}</b><span>📍 ${esc(b.place)}</span><span>🕘 ${esc(b.visits)}</span></p>`).join("")}
      </div>
      <div class="footer-col">
        <h2>Get in touch</h2>
        <p><span>✉️ <a href="mailto:${EMAIL}">${EMAIL}</a></span></p>
        <p><span>📞 <a href="${telHref(CONTACTS.victor.phone)}">${CONTACTS.victor.phone}</a></span><span class="muted">${esc(CONTACTS.victor.name)}, ${esc(CONTACTS.victor.role)}</span></p>
        <p><span>🐝 Visits by appointment, see the times on the left.</span></p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} BeeWorkers · Demo site</span>
      <a href="#top" data-scroll>Back to top ↑</a>
    </div>`;
}

/* ---------- Location boxes under the hives (main page) ---------- */
document.querySelectorAll("[data-base-info]").forEach((box) => {
  const base = BASES.find((b) => b.id === box.dataset.baseInfo);
  if (!base) return;
  box.innerHTML = `
    <p><b>📍 Location</b>${esc(base.place)}</p>
    <p><b>🧭 Getting there</b>${esc(base.directions)}</p>
    <p><b>🕘 Open for visits</b>${esc(base.visits)}</p>
    <button type="button" class="btn" data-participate="${base.id}">Visit &amp; help here</button>`;
});

/* ---------- Links within this page scroll smoothly (without adding Back-button steps) ---------- */
document.querySelectorAll("a[data-scroll]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    setMenu(false);
    if (target.id === "top") scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
    else target.scrollIntoView({ behavior: calm ? "auto" : "smooth" });
  });
});

/* ---------- Pages that aren't built yet ---------- */
document.querySelectorAll("a.soon").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    say(nearestBee(link), "Coming soon, bzz!", 2200);
  });
});

/* ---------- Log out ---------- */
document.getElementById("logout").addEventListener("click", () => {
  writeStore(SESSION_KEY, null);
  setMenu(false);
  goTo("index.html", { replace: true });
});

/* ---------- Participate: call our team, then pick a base to visit and help ----------
   Any button with data-participate opens it; data-participate="forest" (a base id)
   picks that base in step 2. Demo only: the visit request isn't sent anywhere. */
const dialog = document.createElement("dialog");
dialog.className = "participate";
dialog.setAttribute("aria-labelledby", "participate-title");
dialog.innerHTML = `
  <button type="button" class="dialog-close" aria-label="Close">×</button>
  <h2 id="participate-title">Come and help at a bee base</h2>
  <ol class="steps" aria-hidden="true"><li class="on">Talk to us</li><li>Pick a base</li></ol>

  <section class="step" data-step="1">
    <p>Give one of us a call or a message. We'll answer your questions and tell you what to bring.</p>
    <ul class="contacts">
      ${[...BASES.map((b) => ({ ...CONTACTS[b.contact], where: b.name })), { ...CONTACTS.victor, where: "All bases" }].map((c) => `
        <li>
          <img src="${c.photo}" alt="">
          <div>
            <b>${esc(c.name)}</b>
            <span>${esc(c.role)} · ${esc(c.where)}</span>
            <a class="phone" href="${telHref(c.phone)}">📞 ${esc(c.phone)}</a>
          </div>
          <button type="button" class="copy" data-phone="${esc(c.phone)}">Copy</button>
        </li>`).join("")}
    </ul>
    <button type="button" class="btn btn-honey next">Choose a base to visit →</button>
  </section>

  <section class="step" data-step="2" hidden>
    <form id="visit-form" novalidate>
      <fieldset class="base-pick">
        <legend>Which base would you like to visit?</legend>
        ${BASES.map((b, i) => `
          <label>
            <input type="radio" name="base" value="${b.id}"${i === 0 ? " checked" : ""}>
            <span>
              <b>${esc(b.name)}</b>
              <small>📍 ${esc(b.place)}</small>
              <small>🕘 ${esc(b.visits)}</small>
            </span>
          </label>`).join("")}
      </fieldset>

      <fieldset class="task-pick">
        <legend>What would you like to help with?</legend>
        <div id="task-list"></div>
      </fieldset>

      <div class="visit-fields">
        <label>Your name<input type="text" name="name" autocomplete="name"></label>
        <label>Your phone<input type="tel" name="phone" autocomplete="tel"></label>
        <label>Preferred day<input type="date" name="date"></label>
      </div>

      <p class="form-message" aria-live="polite"></p>
      <div class="dialog-actions">
        <button type="button" class="btn back">← Back</button>
        <button type="submit" class="btn btn-honey">Send my visit request</button>
      </div>
    </form>
  </section>

  <section class="step done" data-step="3" hidden>
    <p class="done-icon" aria-hidden="true">🐝</p>
    <h3>See you at the hive!</h3>
    <p id="visit-summary"></p>
    <button type="button" class="btn btn-honey dialog-done">Close</button>
  </section>`;
document.body.append(dialog);

const visitForm = dialog.querySelector("#visit-form");
const baseRadios = [...visitForm.querySelectorAll('input[name="base"]')];
const visitMessage = visitForm.querySelector(".form-message");

function showStep(n) {
  dialog.querySelectorAll(".step").forEach((s) => (s.hidden = s.dataset.step !== String(n)));
  dialog.querySelectorAll(".steps li").forEach((li, i) => li.classList.toggle("on", i < n));
  dialog.scrollTop = 0;
}

// The jobs you can tick depend on the base
function showTasks() {
  const base = BASES.find((b) => b.id === baseRadios.find((r) => r.checked).value);
  dialog.querySelector("#task-list").innerHTML = base.tasks
    .map((t) => `<label><input type="checkbox" name="task" value="${esc(t)}"><span>${esc(t)}</span></label>`).join("");
}
baseRadios.forEach((r) => r.addEventListener("change", showTasks));

function openParticipate(baseId) {
  setMenu(false);
  visitForm.reset();
  visitMessage.textContent = "";
  const pick = baseRadios.find((r) => r.value === baseId) || baseRadios[0];
  pick.checked = true;
  showTasks();
  visitForm.elements.date.min = new Date().toISOString().slice(0, 10);
  showStep(1);
  dialog.showModal();
}

document.addEventListener("click", (event) => {
  const opener = event.target.closest("[data-participate]");
  if (opener) openParticipate(opener.dataset.participate);
});

dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.querySelector(".dialog-done").addEventListener("click", () => dialog.close());
dialog.querySelector(".next").addEventListener("click", () => showStep(2));
dialog.querySelector(".back").addEventListener("click", () => showStep(1));
// Clicking the dimmed background closes it too
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

dialog.querySelectorAll(".copy").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.phone);
      button.textContent = "Copied!";
    } catch {
      button.textContent = "Copy failed";
    }
    setTimeout(() => (button.textContent = "Copy"), 1800);
  });
});

visitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const f = visitForm.elements;
  const name = f.name.value.trim();
  const phone = f.phone.value.trim();
  const tasks = [...visitForm.querySelectorAll('input[name="task"]:checked')].map((c) => c.value);
  const say = (text) => (visitMessage.textContent = text);
  if (!tasks.length) return say("Tick at least one thing you'd like to help with.");
  if (!name) return say("Please tell us your name.");
  if (phone.replace(/\D/g, "").length < 6) return say("Please add a phone number so we can call you back.");
  if (!f.date.value) return say("Pick a day you'd like to come.");

  const base = BASES.find((b) => b.id === f.base.value);
  const contact = CONTACTS[base.contact];
  const day = new Date(f.date.value + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  dialog.querySelector("#visit-summary").textContent =
    `Thanks, ${name}! ${contact.name} from ${base.name} will call you on ${phone} to confirm your visit on ${day} ` +
    `(${tasks.join(", ").toLowerCase()}). Open for visits: ${base.visits}. (Demo: nothing was sent.)`;
  showStep(3);
});
