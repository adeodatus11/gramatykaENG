/* Gramatyka ENG – prosta aplikacja bez zależności. Dane: data.js */

// ───────── sprawdzanie odpowiedzi wpisywanych ─────────
function variants(input) {
  let s = input.toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.!?,;]+$/g, "").trim().replace(/\s+/g, " ");
  s = s.replace(/\bwon't\b/g, "will not").replace(/\bcan't\b/g, "can not").replace(/\bcannot\b/g, "can not")
    .replace(/\bshan't\b/g, "shall not")
    .replace(/n't\b/g, " not").replace(/'re\b/g, " are").replace(/'ve\b/g, " have")
    .replace(/'ll\b/g, " will").replace(/'m\b/g, " am");
  let out = [s];
  // 's i 'd są niejednoznaczne – sprawdzamy obie wersje
  const amb = [[/'s\b/, [" is", " has"]], [/'d\b/, [" would", " had"]]];
  for (const [re, subs] of amb) {
    const next = [];
    for (const v of out) {
      if (re.test(v)) subs.forEach((r) => next.push(v.replace(re, r)));
      else next.push(v);
    }
    out = next;
  }
  return out.map((v) => v.replace(/\s+/g, " ").trim());
}
function checkTyped(input, answers) {
  const user = variants(input);
  return answers.some((a) => variants(a).some((v) => user.includes(v)));
}

// ───────── stan (localStorage) ─────────
const KEY = "gramatykaENG.v1";
let state = { scores: {}, mistakes: [] };
try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = Object.assign(state, JSON.parse(raw));
} catch (e) { /* prywatny tryb – działamy bez zapisu */ }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} updateBadge(); }
function updateBadge() {
  const el = document.getElementById("rev-count");
  if (!el) return;
  el.hidden = state.mistakes.length === 0;
  el.textContent = state.mistakes.length;
}

// ───────── narzędzia ─────────
const $app = document.getElementById("app");
const byId = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const allQuestions = () => TOPICS.flatMap((t) => t.q.map((q, i) => ({ ...q, ref: t.id + ":" + i, topic: t.id })));
const questionsOf = (id) => byId[id].q.map((q, i) => ({ ...q, ref: id + ":" + i, topic: id }));

// ───────── widoki ─────────
function viewHome() {
  const done = TOPICS.filter((t) => state.scores[t.id]).length;
  let html = `<h1>Gramatyka angielska</h1>
    <p class="lead">Krótka teoria po polsku + ćwiczenia z natychmiastowym wyjaśnieniem. Zacznij od dowolnego tematu – albo od „Ściągawki”, żeby zobaczyć wszystkie czasy naraz. Ukończone tematy: <b>${done}/${TOPICS.length}</b>.</p>
    <div class="hero">
      <a class="btn" href="#/mixed">Mix: 15 losowych pytań</a>
      <a class="btn ghost" href="#/cheatsheet">Ściągawka czasów</a>
      ${state.mistakes.length ? `<a class="btn ghost" href="#/review">Powtórz błędy (${state.mistakes.length})</a>` : ""}
    </div>`;
  for (const g of GROUPS) {
    html += `<div class="group-title">${g.name}</div><div class="grid">`;
    for (const t of TOPICS.filter((x) => x.group === g.id)) {
      const s = state.scores[t.id];
      html += `<a class="tile" href="#/topic/${t.id}"><b>${esc(t.name)}</b><small>${esc(t.short)}</small>
        <div class="bar"><i style="width:${s ? s.best : 0}%"></i></div>
        <div class="score">${s ? "najlepszy wynik: " + s.best + "%" : "jeszcze nie ćwiczone"}</div></a>`;
    }
    html += `</div>`;
  }
  $app.innerHTML = html;
}

function viewTopic(id) {
  const t = byId[id];
  if (!t) return viewHome();
  const li = (a) => a.map((x) => `<li>${x}</li>`).join("");
  $app.innerHTML = `
    <div class="crumbs"><a href="#/">← Wszystkie tematy</a></div>
    <h1>${esc(t.name)}</h1><p class="lead">${esc(t.short)}</p>
    <div class="hero"><a class="btn" href="#/practice/${t.id}">Ćwicz (${t.q.length} pytań)</a></div>
    <h2>Kiedy go używamy</h2><div class="card"><ul>${li(t.when)}</ul></div>
    <h2>Budowa</h2><div class="card"><dl class="formula">${t.form.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join("")}</dl></div>
    <h2>Słowa-sygnały</h2><div class="pills">${t.sig.map((s) => `<span class="pill">${esc(s)}</span>`).join("")}</div>
    <h2>Przykłady</h2><div class="card">${t.ex.map(([en, pl]) => `<div class="ex"><span>${esc(en)}</span><span>${esc(pl)}</span></div>`).join("")}</div>
    <h2>Typowe błędy</h2><div class="card">${t.watch.map(([w, r, n]) => `<div class="mistake"><span class="wrong">${esc(w)}</span><span class="right">✓ ${esc(r)}</span><small>${n}</small></div>`).join("")}</div>
    <div class="tipbox">💡 ${t.tip}</div>
    <div class="hero"><a class="btn" href="#/practice/${t.id}">Ćwicz teraz</a></div>`;
}

function viewCheatsheet() {
  $app.innerHTML = `<div class="crumbs"><a href="#/">← Wszystkie tematy</a></div>
    <h1>Ściągawka czasów</h1><p class="lead">Wszystkie podstawowe czasy w jednym miejscu. Kliknij nazwę tematu w menu, żeby zobaczyć szczegóły.</p>
    <div class="scroll"><table class="cs"><thead><tr><th>Czas</th><th>Przykład</th><th>Użycie</th><th>Sygnały</th></tr></thead><tbody>
    ${CHEATSHEET.map((r) => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("")}
    </tbody></table></div>
    <h2>Szybkie pytania kontrolne</h2><div class="card"><ul>
      <li><b>Czy podaję „kiedy” (yesterday, in 2015, ago)?</b> → Past Simple.</li>
      <li><b>Czy to doświadczenie / wynik teraz / „od jak dawna”?</b> → Present Perfect (Continuous, jeśli liczy się czas trwania).</li>
      <li><b>Czy coś trwa w konkretnym momencie?</b> → Continuous (przeszłość, teraz lub przyszłość).</li>
      <li><b>Czy coś wydarzyło się wcześniej niż inna rzecz w przeszłości?</b> → Past Perfect.</li>
      <li><b>Czy chodzi o „do jakiegoś terminu będzie zrobione”?</b> → Future Perfect (by…).</li>
      <li><b>Czy po if / when / as soon as mówię o przyszłości?</b> → Present Simple, nie will.</li>
    </ul></div>`;
}

// ───────── silnik ćwiczeń ─────────
function startQuiz(list, opts) {
  const questions = shuffle(list);
  let idx = 0, correct = 0, wrongs = [];
  const total = questions.length;

  function next() {
    if (idx >= total) return finish();
    const q = questions[idx];
    const isChoice = Array.isArray(q.o);
    const parts = q.q.split("___");
    const opts_ = isChoice ? shuffle(q.o.map((text, i) => ({ text, ok: i === q.a }))) : null;
    const tag = opts.showTopic ? `<div class="tag">${esc(byId[q.topic].name)}</div>` : "";
    $app.innerHTML = `
      <div class="crumbs"><a href="${opts.back}">← ${opts.backLabel}</a></div>
      <div class="progress"><span>${opts.title}</span><span>${idx + 1} / ${total}</span></div>
      <div class="bar"><i style="width:${(idx / total) * 100}%"></i></div>${tag}
      <div class="question">${esc(parts[0])}<span class="blank" id="blank">&nbsp;</span>${esc(parts.slice(1).join("___"))}</div>
      ${isChoice
        ? `<div class="opts">${opts_.map((o, i) => `<button class="opt" data-i="${i}">${esc(o.text)}</button>`).join("")}</div>`
        : `<form class="typed" id="f"><input id="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="wpisz odpowiedź…"><button class="btn">Sprawdź</button></form>`}
      <div id="fb"></div>`;

    const answer = (ok, shown, correctText) => {
      const blank = document.getElementById("blank");
      blank.textContent = shown; blank.classList.add(ok ? "ok" : "bad");
      if (ok) correct++; else wrongs.push(q);
      opts.onAnswer && opts.onAnswer(q, ok);
      const last = idx + 1 >= total;
      document.getElementById("fb").innerHTML = `<div class="feedback ${ok ? "ok" : "bad"}">
        <b>${ok ? "✓ Dobrze!" : "✗ Poprawna odpowiedź: " + esc(correctText)}</b><br>${q.e}<br>
        <button class="btn" id="nx">${last ? "Zobacz wynik" : "Dalej →"}</button></div>`;
      const nx = document.getElementById("nx");
      nx.focus();
      nx.onclick = () => { idx++; next(); };
    };

    if (isChoice) {
      $app.querySelectorAll(".opt").forEach((b) => (b.onclick = () => {
        const chosen = opts_[+b.dataset.i];
        $app.querySelectorAll(".opt").forEach((x, i) => { x.disabled = true; if (opts_[i].ok) x.classList.add("ok"); });
        if (!chosen.ok) b.classList.add("bad");
        answer(chosen.ok, chosen.text, q.o[q.a]);
      }));
    } else {
      const inp = document.getElementById("inp");
      inp.focus();
      document.getElementById("f").onsubmit = (e) => {
        e.preventDefault();
        const v = inp.value.trim();
        if (!v) return;
        inp.disabled = true; e.target.querySelector("button").disabled = true;
        answer(checkTyped(v, q.t), v, q.t[0]);
      };
    }
  }

  function finish() {
    const pct = Math.round((correct / total) * 100);
    opts.onFinish && opts.onFinish(pct);
    const msg = pct === 100 ? "Bezbłędnie! 🎉" : pct >= 75 ? "Bardzo dobrze." : pct >= 50 ? "Nieźle – przejrzyj teorię i spróbuj jeszcze raz." : "Wróć do teorii i spróbuj ponownie – to normalne na początku.";
    $app.innerHTML = `<div class="result"><div class="big">${correct} / ${total}</div><p>${pct}% – ${msg}</p>
      <div class="hero" style="justify-content:center">
        ${wrongs.length ? `<button class="btn" id="again-w">Powtórz błędne (${wrongs.length})</button>` : ""}
        <button class="btn ghost" id="again">Jeszcze raz wszystko</button>
        <a class="btn ghost" href="${opts.back}">${opts.backLabel}</a></div></div>
      ${wrongs.length ? `<h2>Do powtórzenia</h2><div class="card">${wrongs.map((q) => `<div class="mistake"><span>${esc(q.q)}</span><span class="right">${esc(Array.isArray(q.o) ? q.o[q.a] : q.t[0])}</span><small>${q.e}</small></div>`).join("")}</div>` : ""}`;
    document.getElementById("again").onclick = () => startQuiz(list, opts);
    const w = document.getElementById("again-w");
    if (w) w.onclick = () => startQuiz(wrongs, { ...opts, onFinish: null });
  }
  next();
}

// wynik zapisywany w stanie; błędy trafiają do „Powtórki”, poprawne odpowiedzi je usuwają
function recordAnswer(q, ok) {
  const i = state.mistakes.indexOf(q.ref);
  if (ok && i >= 0) state.mistakes.splice(i, 1);
  if (!ok && i < 0) state.mistakes.push(q.ref);
  save();
}

function viewPractice(id) {
  const t = byId[id];
  if (!t) return viewHome();
  startQuiz(questionsOf(id), {
    title: t.name, back: "#/topic/" + id, backLabel: "Wróć do teorii",
    onAnswer: recordAnswer,
    onFinish: (pct) => {
      const s = state.scores[id] || { best: 0, tries: 0 };
      state.scores[id] = { best: Math.max(s.best, pct), tries: s.tries + 1 };
      save();
    },
  });
}
function viewMixed() {
  startQuiz(shuffle(allQuestions()).slice(0, 15), { title: "Mix – losowe pytania", back: "#/", backLabel: "Tematy", showTopic: true, onAnswer: recordAnswer });
}
function viewReview() {
  const map = Object.fromEntries(allQuestions().map((q) => [q.ref, q]));
  const list = state.mistakes.map((r) => map[r]).filter(Boolean);
  if (!list.length) {
    $app.innerHTML = `<h1>Powtórka błędów</h1><p class="lead">Brak błędów do powtórzenia. Ćwicz dalej – każda pomyłka trafi tutaj automatycznie, a poprawna odpowiedź ją stąd usunie.</p><a class="btn" href="#/">Tematy</a>`;
    return;
  }
  startQuiz(list, { title: "Powtórka błędów", back: "#/", backLabel: "Tematy", showTopic: true, onAnswer: recordAnswer });
}

// ───────── router ─────────
function route() {
  const h = location.hash.replace(/^#\/?/, "").split("/");
  window.scrollTo(0, 0);
  updateBadge();
  if (h[0] === "topic") return viewTopic(h[1]);
  if (h[0] === "practice") return viewPractice(h[1]);
  if (h[0] === "cheatsheet") return viewCheatsheet();
  if (h[0] === "mixed") return viewMixed();
  if (h[0] === "review") return viewReview();
  viewHome();
}
document.getElementById("reset").onclick = (e) => {
  e.preventDefault();
  if (confirm("Usunąć wszystkie wyniki i listę błędów?")) { state = { scores: {}, mistakes: [] }; save(); route(); }
};
window.addEventListener("hashchange", route);
route();

if (typeof module !== "undefined") module.exports = { checkTyped, variants };
