/* PLAVE 응원법 타자 연습 — app logic (no build step, no dependencies) */
(function () {
  "use strict";

  const MEMBERS = {
    예준: { color: "#5DA9FF", emoji: "💙" },
    노아: { color: "#A78BFA", emoji: "💜" },
    밤비: { color: "#FF8FAB", emoji: "💗" },
    은호: { color: "#FF6B6B", emoji: "❤️" },
    하민: { color: "#2ECC71", emoji: "💚" },
  };
  const PLLI_COLOR = "#FFFFFF";
  const ALL = "PLAVE";
  const MEMBER_ORDER = ["예준", "노아", "밤비", "은호", "하민"];
  const MEMBER_RE = /\[(예준|노아|밤비|은호|하민|PLAVE|PALVE|플리)\]/gi;
  const TIME_RE = /\[([^\]]*\d{1,2}:\d{2}[^\]]*)\]/g;
  const FREE_RE = /^(함성|환호)\s*!?$/;
  const PASS_ACCURACY = 95;
  const LS = { records: "plave-typing-records-v1", name: "plave-typing-name", mode: "plave-typing-mode", track: "plave-typing-track" };

  const nfc = (s) => (s || "").normalize("NFC");
  const chars = (s) => Array.from(nfc(s));
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtTime = (ms, long) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return (long ? pad2(m) : m) + ":" + pad2(s % 60);
  };
  const fmtDate = (d = new Date()) => `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
  const el = (id) => document.getElementById(id);
  const h = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ---------- 한글 타수(키 입력 수) 계산 ---------- */
  // 중성: ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ  (복합 모음 = 2타)
  const DOUBLE_VOWEL = new Set([9, 10, 11, 14, 15, 16, 19]);
  // 종성: (없음)ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ (겹받침 = 2타)
  const DOUBLE_FINAL = new Set([3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 18]);
  function strokes(ch) {
    const code = ch.codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const i = code - 0xac00;
      const jong = i % 28;
      const jung = Math.floor(i / 28) % 21;
      let n = 1 + (DOUBLE_VOWEL.has(jung) ? 2 : 1);
      if (jong) n += DOUBLE_FINAL.has(jong) ? 2 : 1;
      return n;
    }
    return 1;
  }

  /* ---------- 가사 파서 ---------- */
  // 한 줄 → { member, time, kind:'lyric'|'chant'|'free', segments:[{type:'text'|'bold'|'chant'|'divider', text}], cells, target }
  function tokenize(s) {
    const out = [];
    const re = /\*\*([^*]+?)\*\*|<([^>]*)>|([^*<]+|\*|<)/g;
    let m;
    while ((m = re.exec(s))) {
      if (m[1] != null) {
        const t = m[1];
        const lead = t.match(/^\s*/)[0], trail = t.match(/\s*$/)[0];
        if (lead) out.push({ type: "text", text: lead });
        if (t.trim()) out.push({ type: "bold", text: t.trim() });
        if (trail) out.push({ type: "text", text: trail });
      } else if (m[2] != null) {
        const parts = m[2].trim().split(/\s*\/\s*/).filter(Boolean);
        parts.forEach((p, i) => {
          if (i) out.push({ type: "divider", text: " " });
          out.push({ type: "chant", text: p });
        });
      } else {
        out.push({ type: "text", text: m[3] });
      }
    }
    return out;
  }

  function normalizeSegments(segs) {
    const merged = [];
    for (const s of segs) {
      const last = merged[merged.length - 1];
      if (s.type === "text" && last && last.type === "text") last.text += s.text;
      else merged.push({ ...s });
    }
    for (const s of merged) if (s.type === "text") s.text = s.text.replace(/\s+/g, " ");
    while (merged.length && merged[0].type === "text") {
      merged[0].text = merged[0].text.replace(/^\s+/, "");
      if (merged[0].text) break;
      merged.shift();
    }
    while (merged.length && merged[merged.length - 1].type === "text") {
      const l = merged[merged.length - 1];
      l.text = l.text.replace(/\s+$/, "");
      if (l.text) break;
      merged.pop();
    }
    return merged.filter((s) => s.type === "divider" || s.text.length);
  }

  function parseTrack(text, chantMode) {
    const lines = [];
    let member = null, pendingTime = null;
    for (const raw of nfc(text).split("\n")) {
      let s = raw.trim();
      if (!s) continue;
      const times = [];
      s = s.replace(TIME_RE, (_, t) => { times.push(t.trim()); return " "; });
      s = s.replace(MEMBER_RE, (_, name) => {
        const n = name.toUpperCase();
        member = n === "PLAVE" || n === "PALVE" ? ALL : name === "플리" ? null : name;
        return " ";
      });
      s = s.trim();
      if (!s) { if (times.length) pendingTime = times[0]; continue; }
      const time = times[0] || pendingTime; pendingTime = null;

      let segs = normalizeSegments(tokenize(s));
      const allChant = segs.length > 0 && segs.every((x) => x.type === "chant" || x.type === "divider");
      const isFree = allChant && segs.length === 1 && FREE_RE.test(segs[0].text);
      if (!chantMode) {
        if (allChant) continue;
        segs = normalizeSegments(segs.filter((x) => x.type !== "chant" && x.type !== "divider"));
        if (!segs.length) continue;
      }
      const cells = [];
      segs.forEach((seg, si) => { for (const ch of chars(seg.text)) cells.push({ ch, si }); });
      lines.push({
        member: allChant ? null : member,
        time,
        kind: isFree ? "free" : allChant ? "chant" : "lyric",
        segments: segs,
        hasBold: segs.some((x) => x.type === "bold"),
        cells,
        target: cells.map((c) => c.ch).join(""),
      });
    }
    return lines;
  }

  /* ---------- 상태 ---------- */
  const TRACKS = (window.PLAVE_TRACKS || []).map((t) => ({ ...t, text: nfc(t.text) }));
  if (!TRACKS.length) throw new Error("lyrics.js 에 곡이 없습니다");

  const S = {
    trackId: null, chantMode: true, lines: [], idx: 0,
    typed: "", composing: false, scoredUpTo: 0,
    total: 0, correct: 0, strokesOk: 0, skipped: 0,
    elapsed: 0, runningSince: null, paused: false, finished: false,
    ticker: null, certUrl: null, enterPending: false, skipNextKeyup: false,
  };
  try {
    S.chantMode = localStorage.getItem(LS.mode) !== "off";
    S.trackId = localStorage.getItem(LS.track);
  } catch (_) {}
  if (!TRACKS.some((t) => t.id === S.trackId)) S.trackId = TRACKS[0].id;

  const track = () => TRACKS.find((t) => t.id === S.trackId);
  const isLocked = () => !!track().locked || !track().text.trim();
  const trackIndex = () => TRACKS.findIndex((t) => t.id === S.trackId);
  const line = () => S.lines[S.idx];
  const elapsedMs = () => S.elapsed + (S.runningSince ? Date.now() - S.runningSince : 0);
  const accuracy = () => (S.total ? Math.round((S.correct / S.total) * 100) : 100);
  const speed = () => Math.round(S.strokesOk / Math.max(elapsedMs() / 60000, 1 / 60));
  const progress = () => (S.lines.length ? Math.round((S.idx / S.lines.length) * 100) : 0);
  const memberColor = (m) => (m && MEMBERS[m] ? MEMBERS[m].color : PLLI_COLOR);
  const RAINBOW = `linear-gradient(90deg, ${MEMBER_ORDER.map((m) => MEMBERS[m].color).join(", ")})`;
  const rainbowColor = (i) => MEMBERS[MEMBER_ORDER[i % MEMBER_ORDER.length]].color;

  function startTimer() {
    if (S.runningSince || S.paused || S.finished) return;
    S.runningSince = Date.now();
    if (!S.ticker) S.ticker = setInterval(renderStats, 250);
  }
  function stopTimer() {
    if (S.runningSince) { S.elapsed += Date.now() - S.runningSince; S.runningSince = null; }
    if (S.ticker) { clearInterval(S.ticker); S.ticker = null; }
  }

  function reset() {
    stopTimer();
    Object.assign(S, { idx: 0, typed: "", composing: false, scoredUpTo: 0, total: 0, correct: 0, strokesOk: 0, skipped: 0,
      elapsed: 0, paused: false, finished: false });
    S.lines = isLocked() ? [] : parseTrack(track().text, S.chantMode);
    el("typing").value = "";
    el("typing").disabled = isLocked();
    el("restartBtn").disabled = isLocked();
    el("pauseBtn").disabled = isLocked();
    el("pauseBtn").textContent = "⏸ PAUSE";
    el("pauseBtn").classList.remove("gold");
    el("modal").classList.remove("open");
    renderAll();
    setTimeout(() => el("typing").focus(), 30);
  }

  function selectTrack(id) {
    S.trackId = id;
    try { localStorage.setItem(LS.track, id); } catch (_) {}
    document.documentElement.style.setProperty("--accent", track().accent || "#5DA9FF");
    reset();
  }

  /* ---------- 채점 ---------- */
  function score() {
    const L = line();
    if (!L) return;
    const arr = chars(S.typed);
    if (arr.length < S.scoredUpTo) S.scoredUpTo = arr.length;
    if (L.kind === "free") { if (arr.length) startTimer(); S.scoredUpTo = arr.length; return; }
    for (let i = S.scoredUpTo; i < arr.length; i++) {
      startTimer();
      S.total++;
      if (L.cells[i] && L.cells[i].ch === arr[i]) { S.correct++; S.strokesOk += strokes(arr[i]); }
    }
    S.scoredUpTo = arr.length;
  }

  function isComplete() {
    const L = line();
    if (!L) return false;
    if (L.kind === "free") return S.typed.trim().length > 0;
    return S.typed === L.target;
  }

  function advance() {
    S.idx++;
    S.typed = ""; S.scoredUpTo = 0;
    el("typing").value = "";
    if (S.idx >= S.lines.length) finish();
    else renderAll();
  }

  function submit() {
    if (S.paused || S.finished) return;
    if (isComplete()) advance();
    else if (S.typed.length) shake();
  }

  function skip() {
    if (S.paused || S.finished) return;
    S.skipped++;
    advance();
  }

  function shake() {
    const w = el("inputwrap");
    w.classList.remove("shake"); void w.offsetWidth; w.classList.add("shake");
  }

  function togglePause() {
    if (S.finished) return;
    S.paused = !S.paused;
    if (S.paused) stopTimer();
    el("typing").disabled = S.paused;
    el("typing").placeholder = S.paused ? "PAUSED — 잠시 쉬어가요" : "따라 치고 ENTER";
    el("pauseBtn").textContent = S.paused ? "▶ RESUME" : "⏸ PAUSE";
    el("pauseBtn").classList.toggle("gold", S.paused);
    if (!S.paused) el("typing").focus();
  }

  /* ---------- 렌더 ---------- */
  function renderAll() { renderTracks(); renderHead(); renderStage(); renderStats(); renderRecords(); }

  function renderTracks() {
    const box = el("tracks");
    box.innerHTML = "";
    TRACKS.forEach((t, i) => {
      const locked = !!t.locked || !t.text.trim();
      const b = h("button", "track" + (t.id === S.trackId ? " active" : "") + (locked ? " locked" : ""));
      b.type = "button";
      b.style.setProperty("--c", t.accent || "#5DA9FF");
      b.append(h("span", "num", pad2(i + 1)), locked ? h("span", "lock", "🔒") : h("span", "dot"), h("span", null, t.title));
      if (locked) b.appendChild(h("span", "soon", "준비중"));
      b.addEventListener("click", () => (t.id === S.trackId ? reset() : selectTrack(t.id)));
      box.appendChild(b);
    });
    el("trackChip").innerHTML = "";
    const dot = h("i"); dot.style.cssText = `width:8px;height:8px;border-radius:50%;display:inline-block;background:${track().accent};box-shadow:0 0 10px ${track().accent}`;
    el("trackChip").append(dot, h("span", null, track().title), h("span", null, "·"), h("span", null, isLocked() ? "🔒 준비중" : `${S.lines.length}줄`));
    el("modeBtn").textContent = S.chantMode ? "응원법 포함 ON" : "응원법 포함 OFF";
    el("modeBtn").classList.toggle("on", S.chantMode);
  }

  function renderHead() {
    el("trackPill").textContent = `TRACK ${pad2(trackIndex() + 1)}/${pad2(TRACKS.length)}`;
    el("linePill").textContent = isLocked() ? "LOCKED" : `${pad2(Math.min(S.idx + 1, S.lines.length))} / ${pad2(S.lines.length)}`;
    el("modePill").textContent = isLocked() ? "가사 문서 대기중" : S.chantMode ? "FANCHANT ON" : "LYRICS ONLY";
    el("progressBar").style.width = progress() + "%";
  }

  function partBadge(member) {
    const wrap = h("div", "part" + (member ? "" : " plli") + (member === ALL ? " all" : ""));
    wrap.style.setProperty("--c", memberColor(member));
    const box = h("div", "box");
    if (member === ALL) {
      const dots = h("span", "dots");
      MEMBER_ORDER.forEach((m) => { const d = h("i"); d.style.background = MEMBERS[m].color; dots.appendChild(d); });
      box.append(dots, h("span", "n", "PLAVE"), h("span", "t", "ALL"));
    } else {
      box.append(h("span", "d"), h("span", "n", member || "플리"), h("span", "t", "PART"));
    }
    wrap.append(h("span", "barline"), box);
    return wrap;
  }

  function renderStage() {
    const L = line();
    const badges = el("badges"), lyric = el("lyric");
    badges.innerHTML = ""; lyric.innerHTML = "";
    const locked = isLocked();
    el("inputwrap").style.display = locked ? "none" : "";
    el("status").style.display = locked ? "none" : "";
    el("nextup").style.display = locked ? "none" : "";
    if (locked) {
      const box = h("div", "lockbox");
      box.append(h("div", "ico", "🔒"), h("h2", null, "준비중"), h("div", "sub", "가사 문서가 오면 열려요"));
      const back = h("button", "btn-back", "첫 번째 곡으로 돌아가기");
      back.type = "button";
      back.addEventListener("click", () => selectTrack(TRACKS.find((t) => !t.locked && t.text.trim()).id));
      box.appendChild(back);
      lyric.appendChild(box);
      return;
    }
    if (!L) return;
    const color = memberColor(L.member);
    lyric.style.setProperty("--c", color);

    badges.appendChild(partBadge(L.member));
    if (L.time) badges.appendChild(h("span", "tag time", "⏱ " + L.time));
    if (L.hasBold) badges.appendChild(h("span", "tag", "🤍 플리 함께"));

    const typed = chars(S.typed);
    if (L.kind === "free") {
      const f = h("div", "free");
      f.append(h("div", "big", L.target), h("div", "sub", "으아아아! 악! 아무거나 입력하고 ENTER"));
      lyric.appendChild(f);
    } else {
      let ci = 0;
      L.segments.forEach((seg, si) => {
        const span = h("span", "seg " + seg.type + (seg.type === "chant" && L.kind !== "chant" ? " inline" : ""));
        for (const ch of chars(seg.text)) {
          const c = h("span", "ch", ch === " " ? "·" : ch);
          if (ch === " ") c.classList.add("sp");
          if (seg.type === "divider") c.textContent = "/";
          const i = ci++;
          if (i < typed.length) {
            if (S.composing && i === typed.length - 1) c.classList.add("comp");
            else {
              c.classList.add(typed[i] === ch ? "ok" : "bad");
              if (typed[i] === ch && L.member === ALL && seg.type !== "chant" && ch !== " ") c.style.color = rainbowColor(i);
            }
          } else if (i === typed.length) c.classList.add("cur");
          span.appendChild(c);
        }
        lyric.appendChild(span);
      });
      if (typed.length > L.cells.length) {
        const ex = h("span", "seg");
        ex.appendChild(h("span", "ch extra", typed.slice(L.cells.length).join("")));
        lyric.appendChild(ex);
      }
    }

    const ready = isComplete();
    el("typing").classList.toggle("ready", ready);
    el("goBtn").textContent = ready ? "ENTER" : "SKIP";
    el("goBtn").classList.toggle("ready", ready);
    const st = el("status");
    st.className = "status" + (ready ? " ready" : "");
    if (ready) st.textContent = "ENTER → 다음 가사 ↵";
    else if (typed.length > L.cells.length) st.innerHTML = "입력이 너무 길어요 · <b>Backspace</b>로 지워주세요";
    else if (S.typed.length) st.innerHTML = "정확히 입력 후 <b>ENTER</b>를 눌러 넘어가세요";
    else st.textContent = "";

    renderNext();
  }

  function renderNext() {
    const N = S.lines[S.idx + 1];
    const box = el("nextup");
    box.innerHTML = "";
    if (!N) return;
    box.appendChild(h("div", "lab", "NEXT UP"));
    const prev = h("div", "prev");
    prev.style.setProperty("--c", memberColor(N.member));
    if (N.kind === "free") prev.appendChild(h("span", "c", N.target));
    else N.segments.forEach((seg) => {
      if (seg.type === "divider") prev.appendChild(h("span", null, "/"));
      else prev.appendChild(h("span", seg.type === "bold" ? "b" : seg.type === "chant" ? "c" : "", seg.text));
    });
    const who = h("span", "m");
    const dot = h("i");
    if (N.member === ALL) dot.style.background = RAINBOW;
    who.append(dot, h("span", null, N.member || "플리"));
    prev.appendChild(who);
    box.appendChild(prev);
  }

  function renderStats() {
    const acc = accuracy() + "%", sp = String(speed()), pr = progress() + "%";
    el("hWpm").textContent = sp; el("mWpm").textContent = sp;
    el("hAcc").textContent = acc; el("mAcc").textContent = acc;
    el("hProg").textContent = pr; el("mProg").textContent = pr;
    el("hTime").textContent = fmtTime(elapsedMs(), true);
    el("mTime").textContent = fmtTime(elapsedMs());
  }

  /* ---------- 기록 ---------- */
  function loadRecords() { try { return JSON.parse(localStorage.getItem(LS.records) || "[]"); } catch (_) { return []; } }
  function saveRecord(rec) {
    const all = loadRecords().concat(rec);
    const byTrack = {};
    all.forEach((r) => (byTrack[r.track] = byTrack[r.track] || []).push(r));
    const keep = [];
    Object.values(byTrack).forEach((list) => {
      list.sort((a, b) => b.accuracy - a.accuracy || b.wpm - a.wpm);
      keep.push(...list.slice(0, 5));
    });
    try { localStorage.setItem(LS.records, JSON.stringify(keep)); } catch (_) {}
    return keep;
  }
  const trackRecords = () => loadRecords().filter((r) => r.track === S.trackId && r.mode === (S.chantMode ? "chant" : "lyrics"))
    .sort((a, b) => b.accuracy - a.accuracy || b.wpm - a.wpm);

  function renderRecords() {
    el("recTitle").textContent = track().title;
    const list = el("recList"), best = el("bestBox");
    list.innerHTML = ""; best.innerHTML = "";
    const recs = trackRecords();
    if (!recs.length) { list.appendChild(h("div", "rec empty", "아직 기록 없음\n완주하면 저장돼요")); return; }
    recs.forEach((r, i) => {
      const row = h("div", "rec");
      const left = h("span");
      left.append(h("span", "rank", String(i + 1)), h("b", null, r.accuracy + "%"), h("span", null, " · " + r.wpm + "타"));
      row.append(left, h("span", "d mono", r.dateDisplay));
      list.appendChild(row);
    });
    const b = recs[0];
    const bb = h("div", "best");
    bb.append(h("span", null, "BEST"), h("span", null, `${b.accuracy}% · ${b.wpm}타`));
    best.appendChild(bb);
  }

  /* ---------- 완주 ---------- */
  function finish() {
    stopTimer();
    S.finished = true;
    el("typing").disabled = true;
    renderHead(); renderStats();
    const rec = {
      track: S.trackId, mode: S.chantMode ? "chant" : "lyrics", date: new Date().toISOString(), dateDisplay: fmtDate(),
      wpm: speed(), accuracy: accuracy(), time: Math.round(elapsedMs() / 1000), total: S.total, wrong: S.total - S.correct, skipped: S.skipped,
    };
    saveRecord(rec);
    renderRecords();
    openResult(rec);
  }

  function openResult(rec) {
    const name = (el("nameInput").value || "").trim() || "PLLI";
    const pass = rec.accuracy >= PASS_ACCURACY, perfect = rec.wrong === 0 && !rec.skipped;
    const cert = el("cert");
    cert.className = "cert" + (pass ? " pass" : "");
    cert.innerHTML = "";
    const top = h("div", "top"), left = h("div");
    const lab = h("div", "lab"); lab.append(h("span", "p", "P"), h("span", null, "PLAVE TYPING CERTIFICATE"));
    left.appendChild(lab);
    left.appendChild(h("h2", null, pass ? (perfect ? "🎉 PLLI 합격증 · PERFECT" : "🎖️ PLLI 합격증") : "PLLI 연습생 - 조금만 더!"));
    const who = h("div", "who"); who.append(h("small", null, "수여"), h("span", null, name));
    left.appendChild(who);
    const p = h("p");
    if (pass) {
      p.append(h("b", null, track().title), "을(를) 완벽하게 타이핑하였습니다", h("br"),
        h("small", null, `인증일: ${rec.dateDisplay} · ${S.chantMode ? "응원법 포함" : "가사만"}${rec.skipped ? ` · 건너뜀 ${rec.skipped}줄` : ""}`));
    } else {
      p.append("정확도 ", h("b", null, rec.accuracy + "%"), " · 합격까지 ", h("span", "pink", `${PASS_ACCURACY - rec.accuracy}%`), " 남았어요", h("br"),
        h("small", null, `${track().title} · ${rec.dateDisplay}${rec.skipped ? ` · 건너뜀 ${rec.skipped}줄` : ""}`));
    }
    left.appendChild(p);
    const stamp = h("div", "stamp"); stamp.append(h("b", null, "PLLI"), h("span", null, pass ? "합격" : "연습"));
    top.append(left, stamp);
    cert.appendChild(top);
    const g = h("div", "grid3");
    [["타수", String(rec.wpm), "타/분"], ["정확도", rec.accuracy + "%", ""], ["시간", fmtTime(rec.time * 1000), ""]].forEach(([k, v, u]) => {
      const d = h("div"); const vv = h("div", "v", v + " "); if (u) vv.appendChild(h("small", null, u));
      d.append(h("div", "k", k), vv); g.appendChild(d);
    });
    cert.appendChild(g);
    cert.appendChild(h("div", "saved", "기록 저장됨 ✓"));
    const best = trackRecords()[0];
    if (best) { const pb = h("div", "pb"); pb.append("개인 최고: ", h("b", null, `${best.accuracy}% · ${best.wpm}타`), ` (${best.dateDisplay})`); cert.appendChild(pb); }

    S.certUrl = drawCertificate({ ...rec, name, pass, perfect, title: track().title, trackNum: trackIndex() + 1, accent: track().accent });
    el("previewImg").src = S.certUrl;
    el("preview").style.display = "";
    el("modal").classList.add("open");
  }

  function drawCertificate(v) {
    const W = 1200, H = 675, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    const font = (w, s) => `${w} ${s}px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif`;
    x.fillStyle = "#080808"; x.fillRect(0, 0, W, H);
    let g = x.createRadialGradient(180, 135, 0, 180, 135, 520); g.addColorStop(0, v.accent + "33"); g.addColorStop(1, "transparent"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    g = x.createRadialGradient(1020, 540, 0, 1020, 540, 460); g.addColorStop(0, "#2ECC7122"); g.addColorStop(1, "transparent"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = v.pass ? "#FFD700" : "rgba(255,255,255,.15)"; x.lineWidth = 3; x.strokeRect(18, 18, W - 36, H - 36);
    x.strokeStyle = v.pass ? "rgba(255,215,0,.25)" : "rgba(255,255,255,.06)"; x.lineWidth = 1; x.strokeRect(26, 26, W - 52, H - 52);
    const lg = x.createLinearGradient(0, 0, W, 0);
    [["0", "#1E5AFF"], [".25", "#7A2AFF"], [".5", "#FF4D8D"], [".75", "#FF1A1A"], ["1", "#1AFF6B"]].forEach(([s, c]) => lg.addColorStop(+s, c));
    x.fillStyle = lg; x.fillRect(18, 18, W - 36, 4);
    x.fillStyle = "#fff"; x.font = font(900, 20); x.fillText("PLAVE TYPING CERTIFICATE", 56, 86);
    x.fillStyle = "rgba(255,255,255,.35)"; x.font = font(700, 12);
    x.fillText(`TRACK ${pad2(v.trackNum)} · ${v.mode === "chant" ? "FANCHANT ON" : "LYRICS ONLY"} · ${v.dateDisplay}`, 56, 108);
    x.fillStyle = "#fff"; x.font = font(900, 64); x.fillText(v.title, 56, 200);
    x.fillStyle = "rgba(255,255,255,.45)"; x.font = font(600, 16); x.fillText("PLAVE 응원법 타자 연습 · PLLI", 56, 232);
    x.fillStyle = "#fff"; x.font = font(800, 22); x.fillText(`수여: ${v.name}`, 56, 266);
    const cards = [["타수", String(v.wpm), " 타/분"], ["정확도", v.accuracy + "%", ""], ["시간", fmtTime(v.time * 1000), ""]];
    cards.forEach((c, i) => {
      const cx = 56 + i * 340, cy = 290, cw = 320, chh = 88;
      x.fillStyle = i === 0 ? v.accent + "22" : i === 1 ? "rgba(46,204,113,.10)" : "rgba(255,255,255,.06)"; x.fillRect(cx, cy, cw, chh);
      x.strokeStyle = i === 0 ? v.accent + "88" : "rgba(255,255,255,.12)"; x.lineWidth = 1; x.strokeRect(cx, cy, cw, chh);
      x.fillStyle = "rgba(255,255,255,.35)"; x.font = font(800, 11); x.fillText(c[0], cx + 18, cy + 24);
      x.fillStyle = "#fff"; x.font = font(900, 32); x.fillText(c[1], cx + 18, cy + 64);
      if (c[2]) { x.fillStyle = "rgba(255,255,255,.35)"; x.font = font(700, 14); x.fillText(c[2], cx + 18 + x.measureText(c[1]).width + 4, cy + 64); }
    });
    x.fillStyle = v.pass ? "#FFD700" : "rgba(255,255,255,.65)"; x.font = v.pass ? font(900, 34) : font(800, 24);
    x.fillText(v.pass ? (v.perfect ? "🎉 PLLI 합격증 · PERFECT" : "🎖️ PLLI 합격증") : "PLLI 연습생 - 조금만 더!", 56, 460);
    x.fillStyle = v.pass ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.38)"; x.font = font(600, 16);
    x.fillText(v.pass ? `${v.title}을(를) 완벽하게 타이핑하였습니다 · 인증일: ${v.dateDisplay}` : `${v.title} · 정확도 ${v.accuracy}% · 합격까지 ${PASS_ACCURACY - v.accuracy}% 남았어요!`, 56, 490);
    x.save(); x.translate(1000, 170); x.rotate(-0.18);
    x.beginPath(); x.arc(0, 0, 86, 0, Math.PI * 2); x.fillStyle = v.pass ? "rgba(255,215,0,.12)" : "rgba(255,255,255,.06)"; x.fill();
    x.lineWidth = v.pass ? 3 : 1.5; x.strokeStyle = v.pass ? "#FFD700" : "rgba(255,255,255,.18)"; x.setLineDash(v.pass ? [] : [8, 6]); x.stroke(); x.setLineDash([]);
    x.fillStyle = v.pass ? "#FFD700" : "rgba(255,255,255,.55)"; x.textAlign = "center";
    x.font = v.pass ? font(900, 22) : font(800, 16); x.fillText(v.pass ? "PLLI" : "TRAINEE", 0, -12);
    x.font = v.pass ? font(900, 26) : font(700, 14); x.fillText(v.pass ? "합격" : "연습생", 0, 18);
    x.restore();
    x.fillStyle = "#666"; x.font = font(600, 11); x.textAlign = "left"; x.fillText("MADE FOR PLLI", 56, 631);
    ["#5DA9FF", "#A78BFA", "#FF8FAB", "#FF6B6B", "#2ECC71"].forEach((c, i) => { x.beginPath(); x.arc(1144 - i * 18, 627, 4, 0, Math.PI * 2); x.fillStyle = c; x.fill(); });
    return cv.toDataURL("image/png");
  }

  async function downloadCert() {
    if (!S.certUrl) return;
    const name = (el("nameInput").value || "").trim();
    const filename = `PLAVE_${S.trackId}${name ? "_" + name : ""}_${fmtDate().replace(/\./g, "")}_${accuracy()}p.png`;
    // claude.ai 아티팩트 뷰어 안에서는 일반 다운로드 링크가 막혀 있어 downloads 기능으로 저장한다.
    if (window.claude && typeof window.claude.use === "function") {
      try {
        const dl = await window.claude.use("downloads");
        if (dl) {
          const blob = await (await fetch(S.certUrl)).blob();
          await dl.save({ filename, data: blob });
          return;
        }
      } catch (e) { if (e && e.code === "declined") return; }
    }
    const a = document.createElement("a");
    a.href = S.certUrl;
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function nextTrack() { selectTrack(TRACKS[(trackIndex() + 1) % TRACKS.length].id); }

  /* ---------- 이벤트 ---------- */
  const input = el("typing");
  input.addEventListener("compositionstart", () => { S.composing = true; });
  input.addEventListener("compositionend", () => {
    S.composing = false; S.typed = nfc(input.value); score(); renderStage(); renderStats();
    if (S.enterPending) { S.enterPending = false; submit(); }
  });
  input.addEventListener("input", () => {
    if (S.paused || S.finished) return;
    S.typed = nfc(input.value);
    if (!S.composing) score();
    renderStage(); renderStats();
  });
  // Enter 처리. 한글 입력기가 마지막 글자를 조합 중일 때 누른 Enter 는 "조합 확정"에 쓰인다.
  //  - 윈도우(Chrome/Edge): keydown 이 key="Process"/229 로 들어와 Enter 인지 알 수 없고, 조합이 끝난 뒤
  //    keyup(Enter) 만 온다 → keyup 에서 판정한다.
  //  - 맥: keydown(Enter, isComposing) 뒤에 compositionend 가 온다 → compositionend 에서 판정한다.
  //  - 일반 Enter: keydown 에서 바로 판정하고, 뒤따르는 keyup 은 건너뛴다.
  const isEnterKey = (e) => e.key === "Enter" || e.keyCode === 13 || e.which === 13;
  function enterNow() {
    S.typed = nfc(input.value); score(); renderStage(); renderStats();
    submit();
  }
  input.addEventListener("keydown", (e) => {
    if (!isEnterKey(e)) return;
    e.preventDefault();
    S.skipNextKeyup = true;
    if (S.composing || e.isComposing) { S.enterPending = true; return; }
    enterNow();
  });
  input.addEventListener("keyup", (e) => {
    if (!isEnterKey(e)) return;
    e.preventDefault();
    if (S.skipNextKeyup) { S.skipNextKeyup = false; return; }
    S.composing = false; S.enterPending = false;
    enterNow();
  });
  el("goBtn").addEventListener("click", () => { if (isComplete()) submit(); else skip(); input.focus(); });
  el("restartBtn").addEventListener("click", reset);
  el("modalRestartBtn").addEventListener("click", reset);
  el("nextTrackBtn").addEventListener("click", nextTrack);
  el("modalNextBtn").addEventListener("click", nextTrack);
  el("pauseBtn").addEventListener("click", togglePause);
  el("saveImgBtn").addEventListener("click", downloadCert);
  el("closeBtn").addEventListener("click", () => el("modal").classList.remove("open"));
  el("modeBtn").addEventListener("click", () => {
    S.chantMode = !S.chantMode;
    try { localStorage.setItem(LS.mode, S.chantMode ? "on" : "off"); } catch (_) {}
    reset();
  });
  el("nameInput").addEventListener("input", () => { try { localStorage.setItem(LS.name, el("nameInput").value); } catch (_) {} });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") el("modal").classList.remove("open"); });
  try { el("nameInput").value = localStorage.getItem(LS.name) || ""; } catch (_) {}

  window.PLAVE_TYPING = { parseTrack, strokes, state: S };
  selectTrack(S.trackId);
})();
