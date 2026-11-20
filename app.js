(function () {
  const $ = (id) => document.getElementById(id);
  const state = {
    domainId: null,
    domain: null,
    asked: new Set(),
    history: [],
    scores: {},      // topic -> {correct,total,levelEvidence}
    branchState: {}, // branch/parent -> {confidence, targetDiff}
    trace: [],
    current: null,
    maxQuestions: 10
  };

  function initWizard() {
    const profSel = $("profession");
    const domSel = $("domain");
    profSel.innerHTML = QUIZ_DATA.professions.map(p => `<option value="${p.id}">${p.label}</option>`).join("");
    function refreshDomains() {
      const prof = QUIZ_DATA.professions.find(p => p.id === profSel.value);
      const doms = (prof?.domains || []).map(id => ({ id, label: QUIZ_DATA.domains[id].label }));
      domSel.innerHTML = doms.map(d => `<option value="${d.id}">${d.label}</option>`).join("");
      updateMeta();
    }
    function updateMeta() {
      const d = QUIZ_DATA.domains[domSel.value];
      $("wizardMeta").textContent = d ? d.description : "";
    }
    profSel.onchange = refreshDomains;
    domSel.onchange = updateMeta;
    refreshDomains();
    $("startBtn").onclick = startQuiz;
    $("submitBtn").onclick = submitAnswer;
    $("skipBtn").onclick = () => submitAnswer(true);
    $("restartBtn").onclick = () => location.reload();
  }

  function startQuiz() {
    state.domainId = $("domain").value;
    state.domain = QUIZ_DATA.domains[state.domainId];
    state.asked.clear(); state.history = []; state.scores = {}; state.branchState = {}; state.trace = [];
    // initialize branch states from tree (divide-and-conquer frontier)
    state.domain.tree.forEach(node => {
      state.branchState[node.id] = { confidence: 0, targetDiff: 3, probed: 0 };
      node.children.forEach(ch => { state.scores[ch] = { correct:0, total:0, sumDiff:0 }; });
    });
    const focus = $("focus").value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    if (focus.length) state.trace.push(`سوگیری راه‌انداز: تمرکز بر [${focus.join(", ")}]`);
    state.trace.push(`شروع: کاوش سؤال‌های با سختی میانه در شاخه‌های مختلف (دانه‌بندی تقسیم و حل).`);
    $("wizard").classList.add("hidden");
    $("result").classList.add("hidden");
    $("quiz").classList.remove("hidden");
    nextQuestion(focus);
  }

  function availableQuestions() {
    return state.domain.questions.filter(q => !state.asked.has(q.id));
  }

  // Divide-and-conquer selector:
  // 1) Seed: pick mid-difficulty (3) questions from different parents not yet probed.
  // 2) Narrow: choose parent with lowest confidence/highest uncertainty; adjust target difficulty
  //    up if correct, down if incorrect; pick closest unused question in that branch.
  function selectNextQuestion(focus) {
    const avail = availableQuestions();
    if (!avail.length) return null;
    const parents = state.domain.tree.map(n => n.id);

    // Seed phase: ensure each branch probed once, prefer focus-matching topics, diff ~3
    const unprobed = parents.filter(p => state.branchState[p].probed === 0);
    if (unprobed.length) {
      let pool = avail.filter(q => unprobed.includes(q.parent));
      if (focus.length) {
        const biased = pool.filter(q => focus.some(f => q.topic.includes(f) || q.parent.includes(f) || q.prompt.toLowerCase().includes(f)));
        if (biased.length) pool = biased;
      }
      pool.sort((a,b) => Math.abs(a.difficulty-3) - Math.abs(b.difficulty-3));
      if (pool.length) return { q: pool[0], reason: `کاوش شاخه «${pool[0].parent}» با سختی میانه برای دو نیم کردن فضای دانش.` };
    }

    // Narrowing phase: highest uncertainty = low confidence; tie-break by fewer probes
    const targetParent = parents.slice().sort((a,b) => {
      const A = state.branchState[a], B = state.branchState[b];
      if (A.confidence !== B.confidence) return A.confidence - B.confidence;
      return A.probed - B.probed;
    })[0];
    const targetDiff = state.branchState[targetParent].targetDiff;
    let pool = avail.filter(q => q.parent === targetParent);
    if (!pool.length) pool = avail;
    pool.sort((a,b) => Math.abs(a.difficulty - targetDiff) - Math.abs(b.difficulty - targetDiff));
    const q = pool[0];
    return { q, reason: `تقسیم و حل: تمرکز روی «${targetParent}» (اطمینان کم). سختی هدف ${targetDiff} برای دقیق‌تر کردن مرزها.` };
  }

  function nextQuestion(focus = []) {
    if (state.history.length >= state.maxQuestions || confidenceSufficient()) {
      return finish();
    }
    const pick = selectNextQuestion(focus);
    if (!pick) return finish();
    state.current = pick.q;
    state.asked.add(pick.q.id);
    renderQuestion(pick.reason);
  }

  function confidenceSufficient() {
    const vals = Object.values(state.branchState);
    return vals.length && vals.every(b => b.confidence >= 2 && b.probed >= 1);
  }

  function renderQuestion(reason) {
    const q = state.current;
    $("qDomain").textContent = state.domain.label;
    $("qTopic").textContent = `${q.parent} / ${q.topic}`;
    $("qDiff").textContent = `سختی ${q.difficulty}/5`;
    $("progress").textContent = `سؤال ${state.history.length + 1} از حدود ${state.maxQuestions}`;
    $("qText").textContent = q.prompt;
    $("engineNote").textContent = reason;
    const wrap = $("choices");
    wrap.innerHTML = "";
    q.choices.forEach((c, i) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.textContent = c;
      btn.onclick = () => {
        wrap.querySelectorAll(".choice").forEach(x => x.classList.remove("selected"));
        btn.classList.add("selected");
        wrap.dataset.selected = String(i);
        $("submitBtn").disabled = false;
      };
      wrap.appendChild(btn);
    });
    $("submitBtn").disabled = true;
  }

  function submitAnswer(skipped = false) {
    const q = state.current;
    const sel = skipped ? null : Number($("choices").dataset.selected);
    const correct = !skipped && sel === q.answer;
    state.history.push({ id: q.id, topic: q.topic, parent: q.parent, difficulty: q.difficulty, correct, skipped });

    if (!state.scores[q.topic]) state.scores[q.topic] = { correct:0,total:0,sumDiff:0 };
    const sc = state.scores[q.topic];
    sc.total += 1; sc.sumDiff += q.difficulty; if (correct) sc.correct += 1;

    const bs = state.branchState[q.parent];
    if (bs) {
      bs.probed += 1;
      // confidence grows with consistent evidence; target difficulty moves to bisect ability
      if (!skipped) {
        bs.confidence = Math.min(3, bs.confidence + 1);
        bs.targetDiff = correct ? Math.min(5, q.difficulty + 1) : Math.max(1, q.difficulty - 1);
        state.trace.push(`${q.parent}: ${correct ? "درست" : "نادرست"} در سختی ${q.difficulty} ← سختی هدف بعدی ${bs.targetDiff}.`);
      } else {
        state.trace.push(`${q.parent}: رد شده در سختی ${q.difficulty} ← سختی هدف ${bs.targetDiff} حفظ شد.`);
      }
    }
    $("choices").dataset.selected = "";
    nextQuestion($("focus").value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean));
  }

  function estimateLevel(stat) {
    if (!stat || stat.total === 0) return { label: "دیده‌نشده", pct: 0, acc: 0 };
    const acc = stat.correct / stat.total;
    const avgDiff = stat.sumDiff / stat.total;
    // simple evidence model: accuracy weighted by difficulty faced
    const score = acc * avgDiff;
    let label = "مبتدی";
    if (score >= 3.5) label = "پیشرفته";
    else if (score >= 2.2) label = "میانه";
    else if (score >= 1.2) label = "تازه‌کار";
    return { label, pct: Math.round(Math.min(1, score / 5) * 100), acc: Math.round(acc * 100) };
  }

  function finish() {
    $("quiz").classList.add("hidden");
    $("result").classList.remove("hidden");
    const total = state.history.length;
    const correct = state.history.filter(h => h.correct).length;
    $("summary").textContent = `پاسخ به ${total} سؤال (${correct} درست، ${total - correct} نادرست/ردشده). حوزه: ${state.domain.label}. ` +
      `روش: کاوش‌های اولیه در شاخه‌های مختلف، سپس دو نیم‌سازی سختی (تقسیم و حل) به‌سوی نواحی نامطمئن.`;
    const prof = $("profile");
    prof.innerHTML = "";
    // aggregate by parent branch
    state.domain.tree.forEach(node => {
      let c=0,t=0,sd=0;
      node.children.forEach(ch => { const s = state.scores[ch]; if (s){ c+=s.correct; t+=s.total; sd+=s.sumDiff; } });
      const est = estimateLevel(t?{correct:c,total:t,sumDiff:sd}:null);
      const card = document.createElement("div");
      card.className = "card";
      card.style.margin = "0";
      card.innerHTML = `<strong>${node.label}</strong><div class="meta">شواهد: ${t} مورد، دقت ${est.acc ?? 0}%</div>
        <div class="bar"><span style="width:${est.pct}%"></span></div>
        <div style="margin-top:6px">${est.label} <span class="meta">(${est.pct}/100)</span></div>`;
      prof.appendChild(card);
    });
    const trace = $("trace"); trace.innerHTML = "";
    state.trace.concat([`پایان: ${confidenceSufficient() ? "اطمینان در شاخه‌ها کافی شد" : "بودجه سؤال یا مخزن سؤال‌ها به پایان رسید"}.`])
      .forEach(t => { const li=document.createElement("li"); li.textContent=t; trace.appendChild(li); });
  }

  initWizard();
})();
