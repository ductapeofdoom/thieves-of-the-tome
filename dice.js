// Thieves of the Tome — shared dice-pool roller.
// Self-contained: injects its own styles + a floating widget on any page that
// includes this script. Matches the act/react rule: roll a pool of d6, take the
// highest; 5–6 succeeds (player narrates), 1–4 fails (GM narrates).
(function () {
  if (window.__tottDice) return;          // guard against double-inclusion
  window.__tottDice = true;

  var POOL_KEY = "tott-dice-pool";
  var OPEN_KEY = "tott-dice-open";
  var MAX_POOL = 10;
  var pool = Math.max(1, Math.min(MAX_POOL, parseInt(localStorage.getItem(POOL_KEY), 10) || 1));

  var css = `
    .tott-dice-fab {
      position: fixed; right: 1rem; bottom: 1rem; z-index: 99999;
      width: 3rem; height: 3rem; border-radius: 50%;
      border: 2px solid var(--accent, #6b4f2a); background: var(--parchment, #f4ecd8);
      color: var(--accent, #6b4f2a); font-size: 1.4rem; cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,.25);
      display: flex; align-items: center; justify-content: center; font-family: inherit;
    }
    .tott-dice-fab:hover { background: var(--accent, #6b4f2a); color: var(--parchment, #f4ecd8); }
    .tott-dice-panel {
      position: fixed; right: 1rem; bottom: 4.4rem; z-index: 99999; width: 250px;
      background: var(--parchment, #f4ecd8); border: 2px solid var(--accent, #6b4f2a);
      border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,.25);
      padding: .8rem .9rem 1rem;
      font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
      color: var(--ink, #1c1a17); display: none;
    }
    .tott-dice-panel.open { display: block; }
    .tott-dice-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: .6rem; }
    .tott-dice-head h3 { margin: 0; font-size: 1rem; color: var(--accent, #6b4f2a); }
    .tott-dice-close { border: 0; background: transparent; font-size: 1.2rem; cursor: pointer; color: var(--ink, #1c1a17); opacity: .55; line-height: 1; }
    .tott-dice-close:hover { opacity: 1; }
    .tott-dice-pool { display: flex; align-items: center; justify-content: center; gap: .5rem; margin-bottom: .7rem; }
    .tott-dice-step {
      width: 1.8rem; height: 1.8rem; border: 1px solid var(--accent, #6b4f2a);
      background: var(--parchment, #f4ecd8); color: var(--accent, #6b4f2a);
      border-radius: 6px; cursor: pointer; font-size: 1.1rem; line-height: 1; font-family: inherit;
    }
    .tott-dice-step:hover { background: var(--accent, #6b4f2a); color: var(--parchment, #f4ecd8); }
    .tott-dice-count { font-weight: bold; min-width: 3.4rem; text-align: center; font-size: 1.05rem; }
    .tott-dice-roll {
      display: block; width: 100%; border: 2px solid var(--accent, #6b4f2a);
      background: var(--accent, #6b4f2a); color: var(--parchment, #f4ecd8);
      border-radius: 8px; padding: .45rem; font-size: .95rem; cursor: pointer;
      font-family: inherit; margin-bottom: .7rem;
    }
    .tott-dice-roll:hover { filter: brightness(1.12); }
    .tott-dice-results { display: flex; flex-wrap: wrap; gap: .4rem; justify-content: center; min-height: 2.4rem; margin-bottom: .5rem; }
    .tott-dice-die {
      width: 2.2rem; height: 2.2rem; border: 1.5px solid var(--line, #b8a983); border-radius: 6px;
      background: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 1.15rem; font-weight: bold; color: var(--ink, #1c1a17);
    }
    .tott-dice-die.max { border-color: var(--accent, #6b4f2a); border-width: 2.5px; }
    .tott-dice-die.hit { color: #2e6b2e; }
    .tott-dice-verdict { text-align: center; font-weight: bold; font-size: .9rem; min-height: 1.2rem; }
    .tott-dice-verdict.success { color: #2e6b2e; }
    .tott-dice-verdict.fail { color: #7a2d2d; }
    .tott-dice-note { text-align: center; font-size: .72rem; opacity: .6; margin-top: .35rem; }
    @media print { .tott-dice-fab, .tott-dice-panel { display: none !important; } }
  `;
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var fab = document.createElement("button");
  fab.className = "tott-dice-fab"; fab.type = "button"; fab.title = "Roll dice"; fab.setAttribute("aria-label", "Roll dice");
  fab.textContent = "🎲"; // 🎲

  var panel = document.createElement("div");
  panel.className = "tott-dice-panel";
  panel.innerHTML =
    '<div class="tott-dice-head"><h3>Dice Pool</h3><button class="tott-dice-close" type="button" title="Close">×</button></div>' +
    '<div class="tott-dice-pool">' +
      '<button class="tott-dice-step tott-dice-minus" type="button" aria-label="Fewer dice">−</button>' +
      '<span class="tott-dice-count">1d6</span>' +
      '<button class="tott-dice-step tott-dice-plus" type="button" aria-label="More dice">+</button>' +
    '</div>' +
    '<button class="tott-dice-roll" type="button">Roll</button>' +
    '<div class="tott-dice-results"></div>' +
    '<div class="tott-dice-verdict"></div>' +
    '<div class="tott-dice-note">Take the highest · 5–6 succeeds</div>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var countEl   = panel.querySelector(".tott-dice-count");
  var resultsEl = panel.querySelector(".tott-dice-results");
  var verdictEl = panel.querySelector(".tott-dice-verdict");

  function renderCount() { countEl.textContent = pool + "d6"; }
  function setPool(n) { pool = Math.max(1, Math.min(MAX_POOL, n)); localStorage.setItem(POOL_KEY, pool); renderCount(); }
  function setOpen(o) { panel.classList.toggle("open", o); localStorage.setItem(OPEN_KEY, o ? "1" : "0"); }

  fab.addEventListener("click", function () { setOpen(!panel.classList.contains("open")); });
  panel.querySelector(".tott-dice-close").addEventListener("click", function () { setOpen(false); });
  panel.querySelector(".tott-dice-minus").addEventListener("click", function () { setPool(pool - 1); });
  panel.querySelector(".tott-dice-plus").addEventListener("click", function () { setPool(pool + 1); });
  panel.querySelector(".tott-dice-roll").addEventListener("click", function () {
    var rolls = [];
    for (var i = 0; i < pool; i++) rolls.push(1 + Math.floor(Math.random() * 6));
    var max = Math.max.apply(null, rolls);
    resultsEl.innerHTML = "";
    rolls.forEach(function (v) {
      var d = document.createElement("div");
      d.className = "tott-dice-die" + (v === max ? " max" : "") + (v >= 5 ? " hit" : "");
      d.textContent = v;
      resultsEl.appendChild(d);
    });
    var success = max >= 5;
    verdictEl.className = "tott-dice-verdict " + (success ? "success" : "fail");
    verdictEl.textContent = success
      ? "Success (" + max + ") — you narrate"
      : "Failure (" + max + ") — GM narrates";
  });

  renderCount();
  if (localStorage.getItem(OPEN_KEY) === "1") setOpen(true);
})();
