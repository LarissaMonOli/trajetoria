/* =========================================================
   Site pessoal da Larissa — interatividade
   Depende de js/redacoes.js (constante REDACOES)
   ========================================================= */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Menu e barra de progresso ---------- */
  const topbar = $("#topbar");
  const progress = $("#progress");
  const nav = $("#nav");
  const menuBtn = $("#menuBtn");

  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  $$("a", nav).forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    })
  );

  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    topbar.classList.toggle("scrolled", h.scrollTop > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Link ativo no menu ---------- */
  const sections = ["inicio", "memorias", "galeria", "redacoes"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          $$("a", nav).forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id)
          );
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- Revelar ao rolar ---------- */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          revealObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => revealObs.observe(el));

  /* ---------- Contadores do hero ---------- */
  $$("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    const t0 = performance.now();
    const dur = 1200;
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  });

  /* ---------- Galeria + lightbox ---------- */
  const FOTOS = [
    { src: "assets/img/infancia.png", alt: "Foto de infância com uma rosa", cap: "Pré-escola · Creche Família Feliz" },
    { src: "assets/img/apresentacao-creche.png", alt: "Apresentação escolar com balões verdes e brancos", cap: "Educação infantil · Dia de apresentação" },
    { src: "assets/img/turma-3f.png", alt: "Turma do 3º ano F no pátio da escola", cap: "3º ano · Turma 3F" },
    { src: "assets/img/amiga-morelli.png", alt: "Larissa e uma amiga abraçadas no colégio", cap: "Ensino Médio · Colégio Morelli" },
  ];

  const gallery = $("#gallery");
  FOTOS.forEach((f, i) => {
    const b = document.createElement("button");
    b.className = "shot";
    b.type = "button";
    b.innerHTML = `<img src="${f.src}" alt="${f.alt}" loading="lazy"><span>${f.cap}</span>`;
    b.addEventListener("click", () => openLightbox(i));
    gallery.appendChild(b);
  });

  const lb = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCap = $("#lbCap");
  let lbIndex = 0;

  function showLightbox() {
    const f = FOTOS[lbIndex];
    lbImg.src = f.src;
    lbImg.alt = f.alt;
    lbCap.textContent = f.cap + "  (" + (lbIndex + 1) + "/" + FOTOS.length + ")";
  }
  function openLightbox(i) {
    lbIndex = i;
    showLightbox();
    lb.hidden = false;
    document.body.classList.add("no-scroll");
    $("#lbClose").focus();
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.classList.remove("no-scroll");
  }
  $("#lbClose").addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });

  /* ---------- Redações: cards ---------- */
  const cardsEl = $("#cards");
  const resultsEl = $("#results");
  const searchEl = $("#search");
  let currentFilter = "todas";

  const countWords = (r) => r.paragrafos.join(" ").split(/\s+/).filter(Boolean).length;
  const readMinutes = (r) => Math.max(1, Math.round(countWords(r) / 200));
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const pad = (n) => String(n).padStart(2, "0");

  $("#cAll").textContent = REDACOES.length;
  $("#cCorrigida").textContent = REDACOES.filter((r) => r.tipo === "Corrigida").length;

  function visibleList() {
    const q = norm(searchEl.value.trim());
    return REDACOES.filter((r) => {
      const okType = currentFilter === "todas" || r.tipo === currentFilter;
      const okText = !q || norm(r.titulo).includes(q) || norm(r.paragrafos.join(" ")).includes(q);
      return okType && okText;
    });
  }

  function renderCards() {
    const list = visibleList();
    cardsEl.innerHTML = "";
    if (!list.length) {
      cardsEl.innerHTML = '<p class="empty">Nenhuma redação encontrada. Tente outra palavra.</p>';
    }
    list.forEach((r) => {
      const c = document.createElement("button");
      c.type = "button";
      c.className = "card " + r.tipo.toLowerCase();
      c.innerHTML = `
        <span class="card-num">${pad(r.num)}</span>
        <h3>${r.titulo}</h3>
        <div class="card-foot">
          <span class="badge">${r.tipo}</span>
          <span>${readMinutes(r)} min · <span class="read">Ler →</span></span>
        </div>`;
      c.addEventListener("click", () => openModal(r.num));
      cardsEl.appendChild(c);
    });
    resultsEl.textContent =
      list.length === REDACOES.length
        ? "Mostrando as " + list.length + " redações."
        : "Mostrando " + list.length + " de " + REDACOES.length + " redações.";
  }

  $$(".filter").forEach((btn) =>
    btn.addEventListener("click", () => {
      $$(".filter").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentFilter = btn.dataset.filter;
      renderCards();
    })
  );
  searchEl.addEventListener("input", renderCards);
  renderCards();

  /* ---------- Redações: modal de leitura ---------- */
  const modal = $("#modal");
  const mTitle = $("#mTitle");
  const mMeta = $("#mMeta");
  const mText = $("#mText");
  const mCount = $("#mCount");
  const mScroll = $("#modalScroll");
  const prevBtn = $("#prev");
  const nextBtn = $("#next");
  let order = [];   // números das redações na ordem atual
  let pos = 0;
  let lastFocus = null;
  let fontRem = 1.08;

  function esc(s) {
    return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  function renderModal() {
    const r = REDACOES.find((x) => x.num === order[pos]);
    mMeta.textContent = "Redação " + pad(r.num) + " · " + r.tipo + " · " + readMinutes(r) + " min de leitura";
    mTitle.textContent = r.titulo;
    const last = r.paragrafos.length - 1;
    mText.innerHTML = r.paragrafos
      .map((p, i) => {
        const part = i === 0 ? "Introdução" : i === last ? "Conclusão" : "Desenvolvimento";
        return `<p><span class="part">${part}</span>${esc(p)}</p>`;
      })
      .join("");
    mCount.textContent = (pos + 1) + " de " + order.length;
    prevBtn.disabled = pos === 0;
    nextBtn.disabled = pos === order.length - 1;
    mScroll.scrollTop = 0;
  }

  function openModal(num) {
    order = visibleList().map((r) => r.num);
    pos = Math.max(0, order.indexOf(num));
    lastFocus = document.activeElement;
    renderModal();
    modal.hidden = false;
    document.body.classList.add("no-scroll");
    $(".modal-panel", modal).focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  }
  function go(step) {
    const n = pos + step;
    if (n < 0 || n >= order.length) return;
    pos = n;
    renderModal();
  }

  prevBtn.addEventListener("click", () => go(-1));
  nextBtn.addEventListener("click", () => go(1));
  $$("[data-close]", modal).forEach((el) => el.addEventListener("click", closeModal));

  function setFont(delta) {
    fontRem = Math.min(1.6, Math.max(0.9, fontRem + delta));
    document.documentElement.style.setProperty("--read-size", fontRem + "rem");
  }
  $("#fontPlus").addEventListener("click", () => setFont(0.1));
  $("#fontMinus").addEventListener("click", () => setFont(-0.1));

  /* ---------- Teclado ---------- */
  document.addEventListener("keydown", (e) => {
    if (!modal.hidden) {
      if (e.key === "Escape") closeModal();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "Tab") {
        const f = $$("button:not(:disabled)", modal);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    } else if (!lb.hidden) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") { lbIndex = (lbIndex - 1 + FOTOS.length) % FOTOS.length; showLightbox(); }
      else if (e.key === "ArrowRight") { lbIndex = (lbIndex + 1) % FOTOS.length; showLightbox(); }
    }
  });
})();
