/* Fun Facts page: flip cards and the "bees on / off" basket.
   Uses say() and nearestBee() from bees.js. */

/* ---------- Flip cards ---------- */
document.querySelectorAll(".flip").forEach((card) => {
  card.setAttribute("aria-pressed", "false");
  card.addEventListener("click", () => {
    const flipped = card.classList.toggle("flipped");
    card.setAttribute("aria-pressed", String(flipped));
  });
});

/* ---------- What disappears without bees ---------- */
const shelf = document.querySelector(".shelf");
const toggle = document.getElementById("bees-toggle");
const note = document.getElementById("shelf-note");
const items = [...document.querySelectorAll("#shelf li")];
const needBees = items.filter((li) => li.hasAttribute("data-bees"));
needBees.forEach((li, i) => li.style.setProperty("--n", i)); // fade out one after another

toggle.addEventListener("click", () => {
  const off = shelf.classList.toggle("no-bees");
  toggle.setAttribute("aria-pressed", String(off));
  toggle.textContent = off ? "🐝 Bring the bees back" : "🐝 Turn the bees off";
  note.textContent = off
    ? `${needBees.length} of ${items.length} things are gone or much harder to find. Bread and rice stay, but meals get a lot more boring.`
    : "Phew! With bees, the basket is full again.";
  say(nearestBee(toggle), off ? "Oh no, where's the food?!" : "We're back, bzz!", 2400);
});
