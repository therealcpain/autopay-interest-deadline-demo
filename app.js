/**
 * Autopay Interest Deadline — paste view date + servicer autopay status
 * → days left to Sep 30 2026 11:59 p.m. ET + already-on vs enroll-via-servicer chip.
 * Brand: Autopay Interest Deadline only. User-pasted flags; no servicer login.
 * Never invents eligibility, rates, or monthly savings. Not financial advice.
 * Not SAVE / repayment-plan advice. Public ED / StudentAid.gov framing only.
 */
(function () {
  "use strict";

  const ED_PRESS =
    "https://www.ed.gov/about/news/press-release/us-department-of-education-announces-student-loan-interest-rate-reduction";
  const STUDENTAID =
    "https://studentaid.gov/announcements-events/auto-pay-interest-rate-reduction";
  const BI_SEP1 =
    "https://www.businessinsider.com/student-loan-borrowers-one-month-left-interest-rate-reduction-benefit-2026-9";
  const FORBES_JUL29 =
    "https://www.forbes.com/sites/adamminsky/2026/07/29/borrowers-have-63-days-to-enroll-student-loans-in-new-repayment-benefit-but-watch-for-pitfalls/";

  const DEADLINE_ISO = "2026-09-30";
  const BENEFIT_END_ISO = "2028-06-30";
  const WINDOW_OPEN_ISO = "2026-06-18";
  const DEADLINE_LABEL = "Sep 30 2026 11:59 p.m. ET";
  const BENEFIT_LABEL = "Jun 30 2028";

  const CITE_ONE_LINER =
    "ED Jun 18 2026: borrowers enrolled in auto pay may be eligible for a temporary 1% interest-rate reduction beginning Jul 1 2026; enroll by Sep 30 2026 (or already enrolled) to benefit through Jun 30 2028. Baseline autopay reduction was 0.25%; already-enrolled borrowers get an additional 0.75% automatically (total 1%). Enroll via your loan servicer account — not a StudentAid.gov autopay toggle. ED framing: Direct Loans originated after Jul 1 2012; defaulted borrowers must restore good standing first. Literacy only — not eligibility advice.";

  /** Teaching seeds — labeled dates/status. Not live servicer scrapes. */
  const SEEDS = [
    {
      id: "not-on-17d",
      label: "Not on autopay · 17 days left",
      sub: "Teaching · Sep 13 look · enroll via servicer",
      viewDate: "2026-09-13",
      autopay: "no",
      directLoan: "unknown",
      noteLabel: "Not-on-autopay teaching seed",
    },
    {
      id: "already-on",
      label: "Already on autopay · no extra action",
      sub: "Teaching · already enrolled · +0.75% auto",
      viewDate: "2026-09-13",
      autopay: "yes",
      directLoan: "yes",
      noteLabel: "Already-on-autopay teaching seed",
    },
    {
      id: "unsure-check",
      label: "Unsure · check servicer",
      sub: "Teaching · StudentAid.gov ≠ autopay toggle",
      viewDate: "2026-09-13",
      autopay: "unsure",
      directLoan: "unsure",
      noteLabel: "Unsure teaching seed",
    },
    {
      id: "last-day",
      label: "Last day · Sep 30",
      sub: "Teaching · enroll by 11:59 p.m. ET",
      viewDate: "2026-09-30",
      autopay: "no",
      directLoan: "unknown",
      noteLabel: "Last-day teaching seed",
    },
    {
      id: "window-closed",
      label: "Window closed · Oct 1",
      sub: "Teaching · enroll-by passed · no invented late path",
      viewDate: "2026-10-01",
      autopay: "no",
      directLoan: "unknown",
      noteLabel: "Post-deadline teaching seed",
    },
  ];

  const $ = (id) => document.getElementById(id);

  function parseISODate(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const parts = s.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (
      d.getFullYear() !== parts[0] ||
      d.getMonth() !== parts[1] - 1 ||
      d.getDate() !== parts[2]
    ) {
      return null;
    }
    return d;
  }

  function fmtDate(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function isoFromDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function todayISO() {
    return isoFromDate(new Date());
  }

  /**
   * Whole calendar days from view date (local) to Sep 30 2026.
   * Sep 13 → 17; Sep 30 → 0 (last day); Oct 1 → -1 (closed).
   */
  function daysUntilDeadline(viewDate) {
    const deadline = parseISODate(DEADLINE_ISO);
    const a = Date.UTC(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      viewDate.getDate()
    );
    const b = Date.UTC(
      deadline.getFullYear(),
      deadline.getMonth(),
      deadline.getDate()
    );
    return Math.round((b - a) / 86400000);
  }

  function windowSpanDays() {
    const open = parseISODate(WINDOW_OPEN_ISO);
    const close = parseISODate(DEADLINE_ISO);
    const a = Date.UTC(open.getFullYear(), open.getMonth(), open.getDate());
    const b = Date.UTC(close.getFullYear(), close.getMonth(), close.getDate());
    return Math.round((b - a) / 86400000);
  }

  function windowMeta(daysLeft) {
    if (daysLeft > 0) {
      return {
        phase: "open",
        headline:
          daysLeft === 1
            ? "1 day left to Sep 30"
            : daysLeft + " days left to Sep 30",
        daysLabel:
          daysLeft === 1 ? "1 day left" : daysLeft + " days left",
        ringLabel: String(daysLeft),
        deadlineSub: "Enroll-by " + DEADLINE_LABEL,
      };
    }
    if (daysLeft === 0) {
      return {
        phase: "last",
        headline: "Last day — enroll by 11:59 p.m. ET",
        daysLabel: "TODAY · last day",
        ringLabel: "TODAY",
        deadlineSub: "Enroll-by " + DEADLINE_LABEL,
      };
    }
    return {
      phase: "closed",
      headline: "Enroll-by window closed",
      daysLabel: "CLOSED",
      ringLabel: "CLOSED",
      deadlineSub: "Sep 30 2026 enroll-by has passed",
    };
  }

  function loanMeta(flag) {
    if (flag === "yes") {
      return {
        short: "After Jul 1 2012",
        line: "You marked Direct Loan originated after Jul 1 2012 — that matches ED’s public framing. This is still not a determination that you are eligible.",
      };
    }
    if (flag === "no") {
      return {
        short: "Not that cohort",
        line: "You marked that this is not a Direct Loan originated after Jul 1 2012. ED’s public framing is for that cohort — we do not invent eligibility for other loans.",
      };
    }
    if (flag === "unsure") {
      return {
        short: "Unsure",
        line: "Direct Loan originated-after-Jul 1 2012 flag is unsure. Eligibility is not confirmed from your paste — check your servicer / StudentAid.gov.",
      };
    }
    return {
      short: "Not confirmed",
      line: "No Direct Loan originated-after-Jul 1 2012 flag pasted. Eligibility is not confirmed from your paste — we never invent it.",
    };
  }

  function autopayMeta(status, phase) {
    const closed = phase === "closed";
    const last = phase === "last";

    if (status === "yes") {
      if (closed) {
        return {
          pill: "Already on autopay",
          sub: "If enrolled by Sep 30 · benefit through Jun 30 2028",
          cls: "ok",
          flag: "ALREADY ON AUTOPAY · no extra action for the temporary 1% · we do not invent whether you qualified",
          decoder:
            "You marked already on servicer autopay. ED: already-enrolled borrowers get the additional 0.75% automatically (total 1%). The Sep 30 enroll-by has passed. If you were on autopay by that date, ED says the reduction runs through Jun 30 2028 — this card does not confirm your account.",
          action:
            "Calm next step: confirm autopay and the reduction on your loan servicer account. Details at the StudentAid.gov auto-pay interest-rate-reduction page. This card does not log in or change your loans.",
          short: "Already on",
        };
      }
      return {
        pill: "Already on autopay",
        sub: "No extra action for the temporary 1% reduction",
        cls: "ok",
        flag: "ALREADY ON AUTOPAY · no extra action for the temporary 1% reduction",
        decoder:
          "You marked already on servicer autopay. ED Jun 18 2026: already-enrolled borrowers get the additional 0.75% automatically (total 1%) — no extra enroll step for this temporary reduction. Confirm on your servicer; we do not see your account.",
        action:
          "Calm next step: confirm autopay is on in your loan servicer account (not StudentAid.gov). Details at StudentAid.gov. This card does not change your loans.",
        short: "Already on",
      };
    }

    if (status === "no") {
      if (closed) {
        return {
          pill: "Window closed",
          sub: "Sep 30 enroll-by passed · no invented late path",
          cls: "danger",
          flag: "WINDOW CLOSED · not on autopay · this card does not invent a late-enroll path",
          decoder:
            "You marked not on servicer autopay, and the public Sep 30 2026 enroll-by has passed. We do not invent a late-enrollment exception. Check your servicer / StudentAid.gov for your actual status.",
          action:
            "Calm next step: log into your loan servicer and read the StudentAid.gov auto-pay interest-rate-reduction page. This card is calendar literacy only — not eligibility or plan advice.",
          short: "Not on · closed",
        };
      }
      if (last) {
        return {
          pill: "Last day · enroll via servicer",
          sub: "Enroll by 11:59 p.m. ET today in your servicer account",
          cls: "danger",
          flag: "LAST DAY · not on autopay · enroll via servicer by 11:59 p.m. ET",
          decoder:
            "You marked not on servicer autopay. Public enroll-by is today — Sep 30 2026 11:59 p.m. ET. Enroll in autopay in your loan servicer account. StudentAid.gov is not the autopay toggle. We do not invent that you are eligible.",
          action:
            "Calm next step: enroll in autopay in your loan servicer account today. Details at the StudentAid.gov auto-pay interest-rate-reduction page. Not plan advice. Not a Loan Simulator.",
          short: "Not on · last day",
        };
      }
      return {
        pill: "Enroll via servicer",
        sub: "Not on autopay · enroll in your servicer account",
        cls: "warn",
        flag: "NOT ON AUTOPAY · enroll via servicer by Sep 30 2026 11:59 p.m. ET",
        decoder:
          "You marked not on servicer autopay. ED: enroll by Sep 30 2026 (or already enrolled) to benefit through Jun 30 2028. Enrollment is in your loan servicer account — not a StudentAid.gov autopay toggle. We do not invent eligibility, your rate, or monthly savings.",
        action:
          "Calm next step: enroll in autopay in your loan servicer account. Details at the StudentAid.gov auto-pay interest-rate-reduction page. Not SAVE / repayment-plan advice.",
        short: "Not on",
      };
    }

    // unsure
    if (closed) {
      return {
        pill: "Window closed · check servicer",
        sub: "Confirm whether you were enrolled by Sep 30",
        cls: "unsure",
        flag: "WINDOW CLOSED · autopay unsure · check servicer · no invented status",
        decoder:
          "You marked autopay status unsure, and the public Sep 30 2026 enroll-by has passed. Confirm with your servicer whether you were enrolled by that date. We do not invent your status or a late-enroll path.",
        action:
          "Calm next step: log into your loan servicer (not StudentAid.gov) and read the official auto-pay interest-rate-reduction page. This card does not determine eligibility.",
        short: "Unsure · closed",
      };
    }
    if (last) {
      return {
        pill: "Last day · check servicer",
        sub: "Confirm today · StudentAid.gov ≠ autopay toggle",
        cls: "warn",
        flag: "LAST DAY · autopay unsure · check servicer by 11:59 p.m. ET",
        decoder:
          "You marked autopay status unsure. Public enroll-by is today — Sep 30 2026 11:59 p.m. ET. StudentAid.gov is not the autopay switch. Check your servicer account before the cutoff. We do not invent your status.",
        action:
          "Calm next step: open your loan servicer account and confirm autopay. Details at StudentAid.gov. Not financial advice.",
        short: "Unsure · last day",
      };
    }
    return {
      pill: "Check your servicer",
      sub: "Unsure · StudentAid.gov is not the autopay toggle",
      cls: "unsure",
      flag: "AUTOPAY UNSURE · check servicer · StudentAid.gov ≠ autopay toggle",
      decoder:
        "You marked autopay status unsure. Many borrowers confuse StudentAid.gov with servicer autopay. Confirm in your loan servicer account. Enroll by Sep 30 2026 11:59 p.m. ET (or already enrolled) per ED — we do not invent whether you already qualify.",
      action:
        "Calm next step: log into your loan servicer and look for auto pay / autopay. Details at the StudentAid.gov auto-pay interest-rate-reduction page. Not plan advice.",
      short: "Unsure",
    };
  }

  function readInputs() {
    return {
      viewDate: ($("viewDate").value || "").trim(),
      autopay: $("autopay").value || "unsure",
      directLoan: $("directLoan").value || "unknown",
      noteLabel: ($("noteLabel").value || "").trim(),
    };
  }

  function applyInputs(p) {
    $("viewDate").value = p.viewDate || "";
    $("autopay").value = p.autopay || "unsure";
    $("directLoan").value = p.directLoan || "unknown";
    $("noteLabel").value = p.noteLabel || "";
  }

  function validate(input) {
    const d = parseISODate(input.viewDate);
    if (!d) {
      return "Pick a view date (the day you’re looking) — the countdown needs it. We will not invent days left.";
    }
    return null;
  }

  function compute(input) {
    const viewDate = parseISODate(input.viewDate);
    const daysLeft = daysUntilDeadline(viewDate);
    const win = windowMeta(daysLeft);
    const ap = autopayMeta(input.autopay, win.phase);
    const loan = loanMeta(input.directLoan);
    const span = windowSpanDays();
    let pct = 0;
    if (win.phase === "closed") {
      pct = 0;
    } else if (win.phase === "last") {
      pct = Math.max(2, Math.round((1 / span) * 100));
    } else {
      pct = Math.max(2, Math.min(100, Math.round((daysLeft / span) * 100)));
    }

    return {
      viewDate: viewDate,
      daysLeft: daysLeft,
      win: win,
      ap: ap,
      loan: loan,
      pct: pct,
      span: span,
    };
  }

  function encodeHash(input) {
    const parts = [
      input.viewDate || "",
      input.autopay || "unsure",
      input.directLoan || "unknown",
      input.noteLabel || "",
    ];
    const raw = parts.join("|");
    try {
      return "#p=" + btoa(unescape(encodeURIComponent(raw)));
    } catch (e) {
      return "#p=" + encodeURIComponent(raw);
    }
  }

  function decodeHash() {
    const raw = location.hash || "";
    if (!raw.startsWith("#p=")) return null;
    try {
      let decoded;
      try {
        decoded = decodeURIComponent(escape(atob(raw.slice(3))));
      } catch (e) {
        decoded = decodeURIComponent(raw.slice(3));
      }
      const parts = decoded.split("|");
      if (parts.length < 1 || !parts[0]) return null;
      return {
        viewDate: parts[0] || "",
        autopay: parts[1] || "unsure",
        directLoan: parts[2] || "unknown",
        noteLabel: parts[3] || "",
      };
    } catch (e) {
      return null;
    }
  }

  function renderChips() {
    const box = $("seedChips");
    box.innerHTML = "";
    SEEDS.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seed-chip";
      btn.setAttribute("role", "listitem");
      btn.innerHTML =
        s.label + '<span class="chip-sub">' + s.sub + "</span>";
      btn.addEventListener("click", () => {
        applyInputs(s);
        $("status").textContent = "Loaded seed: " + s.label;
        renderCard();
      });
      box.appendChild(btn);
    });
  }

  function renderSources() {
    $("sourceLinks").innerHTML =
      'Cites: <a href="' +
      ED_PRESS +
      '" target="_blank" rel="noopener noreferrer">ED Jun 18 2026</a>' +
      '<a href="' +
      STUDENTAID +
      '" target="_blank" rel="noopener noreferrer">StudentAid.gov auto-pay reduction</a>' +
      '<a href="' +
      BI_SEP1 +
      '" target="_blank" rel="noopener noreferrer">BI Sep 1 2026 (example math is theirs)</a>' +
      '<a href="' +
      FORBES_JUL29 +
      '" target="_blank" rel="noopener noreferrer">Forbes Jul 29 2026 (pitfalls)</a>';
  }

  function renderCard() {
    const input = readInputs();
    const err = validate(input);
    if (err) {
      $("cardSection").hidden = true;
      $("status").textContent = err;
      return;
    }

    const c = compute(input);
    $("cardSection").hidden = false;
    $("shareBox").hidden = false;
    $("status").textContent = "Card ready — copy, share, or export PNG.";

    const metaBits = [];
    metaBits.push("Servicer autopay: " + c.ap.short);
    if (input.noteLabel) metaBits.push(input.noteLabel);
    $("cardMeta").textContent = metaBits.join(" · ");

    $("dlHeadline").textContent = c.win.headline;
    $("statusPill").textContent = c.ap.pill;
    $("statusPill").className = "verdict-k " + c.ap.cls;
    $("statusSub").textContent = c.ap.sub;

    $("viewDateDisp").textContent = fmtDate(c.viewDate);
    $("daysDisp").textContent = c.win.daysLabel;
    $("deadlineLine").textContent = c.win.deadlineSub;

    $("daysRingDisp").textContent = c.win.ringLabel;
    $("daysRing").style.setProperty("--pct", String(c.pct));
    if (c.win.phase === "closed") {
      $("daysRing").className = "fee-ring empty";
    } else if (c.win.phase === "last" || (c.daysLeft > 0 && c.daysLeft <= 7)) {
      $("daysRing").className = "fee-ring danger";
    } else if (c.ap.cls === "ok") {
      $("daysRing").className = "fee-ring ok";
    } else {
      $("daysRing").className = "fee-ring";
    }

    const windowEl = $("windowLine");
    if (c.win.phase === "closed") {
      windowEl.className = "hero-sub danger";
      windowEl.textContent =
        "Enroll-by passed · benefit window (if enrolled) through " +
        BENEFIT_LABEL;
    } else if (c.win.phase === "last") {
      windowEl.className = "hero-sub danger";
      windowEl.textContent = "Last calendar day of the enroll-by window";
    } else {
      windowEl.className = "hero-sub warn";
      windowEl.textContent =
        c.daysLeft +
        " of " +
        c.span +
        " days remain in the Jun 18–Sep 30 public window";
    }

    const flag = $("actionFlag");
    flag.textContent = c.ap.flag;
    flag.className = "look-enroll-flag " + c.ap.cls;

    $("rAutopay").textContent = c.ap.short;
    $("rLoan").textContent = c.loan.short;
    $("rDeadline").textContent = "Sep 30 2026";
    $("rBenefit").textContent = BENEFIT_LABEL;

    $("decoderLine").textContent = c.ap.decoder + " " + c.loan.line;
    $("actionLine").textContent = c.ap.action;
    $("citeLine").textContent =
      CITE_ONE_LINER +
      " Benefit through " +
      BENEFIT_LABEL +
      " (ED). Business Insider Sep 1 2026 published an example (~$23/mo) — that is their math, not yours, and not shown as a computed savings here.";

    const hash = encodeHash(input);
    if (location.hash !== hash) {
      history.replaceState(null, "", hash);
    }
    $("shareUrl").value = location.href.split("#")[0] + hash;
  }

  function clearAll() {
    applyInputs({
      viewDate: todayISO(),
      autopay: "unsure",
      directLoan: "unknown",
      noteLabel: "",
    });
    $("cardSection").hidden = true;
    $("shareBox").hidden = true;
    $("status").textContent = "Cleared.";
    history.replaceState(null, "", location.pathname + location.search);
  }

  function summaryText() {
    const input = readInputs();
    const err = validate(input);
    if (err) return err;
    const c = compute(input);
    const lines = [
      "Autopay Interest Deadline",
      "View date: " + fmtDate(c.viewDate),
      "Countdown: " + c.win.daysLabel + " · " + c.win.deadlineSub,
      "Status: " + c.ap.pill + " · " + c.ap.sub,
      "Direct Loan flag: " + c.loan.short,
      "Benefit through (ED): " + BENEFIT_LABEL,
      "",
      c.ap.decoder,
      c.loan.line,
      c.ap.action,
      "",
      CITE_ONE_LINER,
      "Not financial advice. Not SAVE plan advice. Eligibility not invented.",
    ];
    return lines.filter((x) => x != null).join("\n");
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText());
      $("status").textContent = "Summary copied.";
    } catch (e) {
      $("status").textContent = "Copy failed — select share URL instead.";
    }
  }

  async function shareLink() {
    renderCard();
    const url = $("shareUrl").value;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Autopay Interest Deadline",
          text: "Days left to Sep 30 for ED’s 1% autopay interest reduction — calendar literacy card",
          url: url,
        });
        $("status").textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(url);
        $("status").textContent = "Share link copied.";
      }
    } catch (e) {
      $("status").textContent = "Share cancelled or unavailable.";
    }
  }

  async function copyShare() {
    try {
      await navigator.clipboard.writeText($("shareUrl").value);
      $("status").textContent = "Share URL copied.";
    } catch (e) {
      $("status").textContent = "Copy failed.";
    }
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || "").split(/\s+/);
    let line = "";
    let yy = y;
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, yy);
        line = words[i];
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, x, yy);
      yy += lineHeight;
    }
    return yy;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function exportPng() {
    const input = readInputs();
    const err = validate(input);
    if (err) {
      $("status").textContent = err;
      return;
    }
    const c = compute(input);
    const canvas = $("pngCanvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "rgba(240,180,41,0.14)");
    g.addColorStop(0.55, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(62,207,142,0.08)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#121820";
    roundRect(ctx, 36, 36, W - 72, H - 72, 18);
    ctx.fill();
    ctx.strokeStyle = "#2e3a48";
    ctx.lineWidth = 2;
    ctx.stroke();

    let y = 78;
    ctx.fillStyle = "#7eb8e8";
    ctx.font = "700 14px IBM Plex Sans, system-ui, sans-serif";
    ctx.fillText("AUTOPAY INTEREST DEADLINE", 64, y);

    y += 28;
    ctx.fillStyle = "#8b9aab";
    ctx.font = "400 13px IBM Plex Mono, monospace";
    ctx.fillText(
      fmtDate(c.viewDate) + " · " + c.ap.pill + " · ED 1% enroll-by",
      64,
      y
    );

    y += 52;
    ctx.fillStyle = "#e8eef4";
    ctx.font = "700 40px IBM Plex Sans, system-ui, sans-serif";
    ctx.fillText(c.win.daysLabel, 64, y);

    const chipX = W - 280;
    const chipY = 96;
    const chipFill =
      c.ap.cls === "ok"
        ? "rgba(62,207,142,0.14)"
        : c.ap.cls === "danger"
          ? "rgba(240,113,120,0.12)"
          : c.ap.cls === "warn"
            ? "rgba(240,180,41,0.12)"
            : "rgba(139,154,171,0.12)";
    const chipStroke =
      c.ap.cls === "ok"
        ? "#3ecf8e"
        : c.ap.cls === "danger"
          ? "#f07178"
          : c.ap.cls === "warn"
            ? "#f0b429"
            : "#8b9aab";
    ctx.fillStyle = chipFill;
    ctx.strokeStyle = chipStroke;
    ctx.lineWidth = 2;
    roundRect(ctx, chipX, chipY, 200, 118, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#8b9aab";
    ctx.font = "700 11px IBM Plex Sans, system-ui, sans-serif";
    ctx.fillText("STATUS (TEXT LABEL)", chipX + 14, chipY + 22);
    ctx.fillStyle = chipStroke;
    ctx.font = "700 15px IBM Plex Sans, system-ui, sans-serif";
    wrapText(ctx, c.ap.pill, chipX + 14, chipY + 46, 172, 18);
    ctx.fillStyle = "#e8eef4";
    ctx.font = "600 11px IBM Plex Sans, system-ui, sans-serif";
    wrapText(ctx, c.ap.sub, chipX + 14, chipY + 84, 172, 14);

    y += 28;
    ctx.fillStyle = "#f0b429";
    ctx.font = "700 13px IBM Plex Sans, system-ui, sans-serif";
    y = wrapText(ctx, c.ap.flag, 64, y, W - 330, 18);

    y += 8;
    ctx.fillStyle = "#8b9aab";
    ctx.font = "500 15px IBM Plex Sans, system-ui, sans-serif";
    y = wrapText(ctx, c.win.deadlineSub, 64, y, W - 128, 22);

    y += 16;
    ctx.fillStyle = "#1a222c";
    roundRect(ctx, 64, y, W - 128, 78, 10);
    ctx.fill();
    const cells = [
      ["Autopay", c.ap.short],
      ["Direct Loan", c.loan.short],
      ["Enroll-by", "Sep 30 2026"],
      ["Benefit thru", BENEFIT_LABEL],
    ];
    const cellW = (W - 128) / 4;
    cells.forEach((cell, i) => {
      const cx = 64 + cellW * i + 14;
      ctx.fillStyle = "#8b9aab";
      ctx.font = "700 11px IBM Plex Sans, system-ui, sans-serif";
      ctx.fillText(cell[0], cx, y + 28);
      ctx.fillStyle = "#e8eef4";
      ctx.font = "600 14px IBM Plex Mono, monospace";
      ctx.fillText(cell[1], cx, y + 54);
    });
    y += 100;

    ctx.fillStyle = "#f0b429";
    ctx.font = "700 13px IBM Plex Sans, system-ui, sans-serif";
    ctx.fillText("CALENDAR LITERACY — NOT ELIGIBILITY", 64, y);
    y += 24;
    ctx.fillStyle = "#e8eef4";
    ctx.font = "500 15px IBM Plex Sans, system-ui, sans-serif";
    y = wrapText(ctx, c.ap.decoder + " " + c.loan.line, 64, y, W - 128, 22);

    y += 14;
    ctx.fillStyle = "#7eb8e8";
    ctx.font = "700 13px IBM Plex Sans, system-ui, sans-serif";
    ctx.fillText("NEXT STEP (NOT ADVICE)", 64, y);
    y += 24;
    ctx.fillStyle = "#e8eef4";
    ctx.font = "500 15px IBM Plex Sans, system-ui, sans-serif";
    y = wrapText(ctx, c.ap.action, 64, y, W - 128, 22);

    y += 16;
    ctx.fillStyle = "#8b9aab";
    ctx.font = "400 12px IBM Plex Sans, system-ui, sans-serif";
    y = wrapText(
      ctx,
      "ED Jun 18 2026: 1% autopay interest reduction; enroll by Sep 30 2026 (or already enrolled) through Jun 30 2028. Enroll via servicer. Direct Loans originated after Jul 1 2012. We never invent your rate, savings, or eligibility. BI Sep 1 example math is theirs — not shown as yours.",
      64,
      y,
      W - 128,
      18
    );

    ctx.fillStyle = "#8b9aab";
    ctx.font = "400 12px IBM Plex Mono, monospace";
    ctx.fillText(
      "Not financial advice · StudentAid.gov · your loan servicer · cite ED",
      64,
      H - 56
    );

    canvas.toBlob((blob) => {
      if (!blob) {
        $("status").textContent = "PNG export failed.";
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download =
        "autopay-interest-deadline-" +
        input.viewDate +
        "-" +
        (input.autopay || "unsure") +
        ".png";
      a.click();
      URL.revokeObjectURL(a.href);
      $("status").textContent = "PNG downloaded.";
    });
  }

  function bind() {
    if (!$("viewDate").value) $("viewDate").value = todayISO();
    renderChips();
    renderSources();

    $("cardBtn").addEventListener("click", renderCard);
    $("clearBtn").addEventListener("click", clearAll);
    $("copySummary").addEventListener("click", copySummary);
    $("shareBtn").addEventListener("click", shareLink);
    $("copyShare").addEventListener("click", copyShare);
    $("pngBtn").addEventListener("click", exportPng);

    window.addEventListener("hashchange", () => {
      const p = decodeHash();
      if (p) {
        applyInputs(p);
        renderCard();
      }
    });

    const fromHash = decodeHash();
    if (fromHash) {
      applyInputs(fromHash);
      renderCard();
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bind);
    } else {
      bind();
    }
  }

  // Expose compute helpers for node verify (no-op in browser).
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      daysUntilDeadline: daysUntilDeadline,
      windowMeta: windowMeta,
      autopayMeta: autopayMeta,
      loanMeta: loanMeta,
      parseISODate: parseISODate,
      DEADLINE_ISO: DEADLINE_ISO,
      SEEDS: SEEDS,
    };
  }
})();
