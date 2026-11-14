/* Login / Register page. Uses say(), nearestBee(), readStore(), writeStore()
   and calm from bees.js, which loads first. */

/* ---------- Mock accounts ----------
   TEMPORARY: accounts live only in this browser's storage, passwords included.
   Replace with a real server login before the site goes live. */
const ACCOUNTS_KEY = "beeworkers-accounts";
const DEMO_ACCOUNT = { name: "Demo Bee", email: "demo@beeworkers.test", password: "honey123" };

const accounts = () => [DEMO_ACCOUNT, ...readStore(ACCOUNTS_KEY, [])];
const sameEmail = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

const auth = document.getElementById("auth");
const formsBox = document.getElementById("forms");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginTab = document.getElementById("tab-login");
const registerTab = document.getElementById("tab-register");

/* ---------- Smooth Login / Register switch ----------
   1. the old form fades up and out
   2. the card eases to the new height while the new form rises in
   The card is pinned by its top edge (see .right in style.css), so the tabs never move. */
const easeInOut = "cubic-bezier(0.45, 0, 0.2, 1)";
let switchId = 0;

async function showForm(next) {
  const current = formsBox.querySelector("form.active");
  const id = ++switchId;
  if (current === next) {
    // Clicked back before the old form had finished leaving: just settle it again
    formsBox.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    formsBox.style.height = "";
    formsBox.style.overflow = "";
    return;
  }

  // Start from wherever things are right now, even mid-switch
  const from = formsBox.getBoundingClientRect().height;
  const fadeFrom = getComputedStyle(current).opacity;
  formsBox.getAnimations({ subtree: true }).forEach((a) => a.cancel());

  if (!calm) {
    formsBox.style.height = from + "px";
    const fadeOut = current.animate(
      [{ opacity: fadeFrom, transform: "none" }, { opacity: 0, transform: "translateY(-8px)" }],
      { duration: 160, easing: "ease-in", fill: "forwards" },
    );
    await fadeOut.finished.catch(() => {});
    if (id !== switchId) return; // another click took over
  }

  current.classList.remove("active");
  current.getAnimations().forEach((a) => a.cancel());
  next.classList.add("active");
  formsBox.style.height = "";
  if (calm) return;

  const to = formsBox.offsetHeight;
  formsBox.style.overflow = "hidden";
  const grow = formsBox.animate(
    [{ height: from + "px" }, { height: to + "px" }],
    { duration: 380, easing: easeInOut },
  );
  next.animate(
    [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
    { duration: 340, delay: 110, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" },
  );
  grow.finished.then(() => {
    if (id === switchId) formsBox.style.overflow = "";
  }).catch(() => {});
}

loginTab.addEventListener("change", () => showForm(loginForm));
registerTab.addEventListener("change", () => showForm(registerForm));

/* ---------- Messages ---------- */
function tell(form, text, kind = "error") {
  const message = form.querySelector(".form-message");
  message.textContent = text;
  message.dataset.kind = kind;
  say(nearestBee(form), text, 2400);
  if (kind === "error" && !calm) {
    auth.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(7px)" },
        { transform: "translateX(-4px)" }, { transform: "translateX(0)" }],
      { duration: 380, easing: "ease-out" },
    );
  }
}

function enterHive(account) {
  writeStore(SESSION_KEY, { name: account.name, email: account.email });
  auth.classList.add("leaving");
  // replace() so the browser's Back button (and Exit) leaves the site instead of returning here
  setTimeout(() => goTo("main.html", { replace: true }), calm ? 300 : 700);
}

/* ---------- Login ---------- */
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = loginForm.elements["login-email"].value;
  const password = loginForm.elements["login-password"].value;
  if (!email.trim() || !password) return tell(loginForm, "Fill in both fields, bzz!");
  const account = accounts().find((a) => sameEmail(a.email, email) && a.password === password);
  if (!account) return tell(loginForm, "Hmm, that's not right!");
  tell(loginForm, `Welcome to the hive, ${account.name}!`, "ok");
  enterHive(account);
});

/* ---------- Register ---------- */
registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = registerForm.elements["register-name"].value.trim();
  const emailInput = registerForm.elements["register-email"];
  const email = emailInput.value.trim();
  const password = registerForm.elements["register-password"].value;
  const confirm = registerForm.elements["register-confirm"].value;

  if (!name || !email || !password || !confirm) return tell(registerForm, "Fill in every field, bzz!");
  if (!emailInput.checkValidity()) return tell(registerForm, "That email looks odd!");
  if (password.length < 6) return tell(registerForm, "Password needs 6+ letters!");
  if (password !== confirm) return tell(registerForm, "Passwords don't match!");
  if (accounts().some((a) => sameEmail(a.email, email))) return tell(registerForm, "That bee already exists!");

  const account = { name, email, password };
  writeStore(ACCOUNTS_KEY, [...readStore(ACCOUNTS_KEY, []), account]);
  tell(registerForm, `New worker bee: ${name}!`, "ok");
  enterHive(account);
});

/* ---------- Demo account: one click straight in (temporary) ---------- */
document.getElementById("demo-login").addEventListener("click", () => {
  if (!loginTab.checked) {
    loginTab.checked = true;
    showForm(loginForm);
  }
  loginForm.elements["login-email"].value = DEMO_ACCOUNT.email;
  loginForm.elements["login-password"].value = DEMO_ACCOUNT.password;
  loginForm.elements["login-password"].dispatchEvent(new Event("input"));
  loginForm.requestSubmit();
});

/* ---------- Password flower ----------
   A little bud sits in each password field. Click it and it blooms
   and the password shows; click again and it closes back into a bud. */
const PETALS = [0, 1, 2, 3, 4].map((n) =>
  `<ellipse class="petal" cx="16" cy="9" rx="4.6" ry="7" style="--n:${n};--bud:${(n - 2) * 9}deg;--open:${n * 72}deg"/>`
).join("");

const FLOWER_SVG = `<svg viewBox="0 0 32 32" aria-hidden="true">
  <path class="stem" d="M16 18V31"/>
  ${PETALS}
  <path class="sepal" d="M16 21C11 20 9.5 15 10.5 11C12.5 14 14 15.5 16 16C18 15.5 19.5 14 21.5 11C22.5 15 21 20 16 21Z"/>
  <circle class="middle" cx="16" cy="16" r="4"/>
</svg>`;

document.querySelectorAll('input[type="password"]').forEach((input) => {
  const field = document.createElement("div");
  field.className = "password-field";
  input.before(field);
  field.append(input);

  const peek = document.createElement("button");
  peek.type = "button";
  peek.className = "peek";
  peek.setAttribute("aria-pressed", "false");
  peek.setAttribute("aria-label", "Show password");
  peek.innerHTML = FLOWER_SVG;
  field.append(peek);

  input.addEventListener("input", () => field.classList.toggle("has-text", input.value !== ""));
  input.addEventListener("focus", () => {
    if (input.type === "password") say(nearestBee(input), "I'm not looking!", 2600);
  });

  // Clicking the flower keeps the cursor in the field
  peek.addEventListener("mousedown", (event) => event.preventDefault());
  peek.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    peek.setAttribute("aria-pressed", String(show));
    peek.setAttribute("aria-label", show ? "Hide password" : "Show password");
    if (show) say(nearestBee(input), "Peek-a-bee!", 1800);
  });
});
