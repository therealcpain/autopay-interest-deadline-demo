/**
 * Autopay Interest Deadline — date to count from (defaults to today) + servicer autopay
 * status → days left to Sep 30 2026 11:59 p.m. ET + already-on vs enroll-through-servicer status.
 * Brand: Autopay Interest Deadline only. Uses only what the user chooses; no servicer login.
 * Never invents eligibility, rates, or monthly savings. Not financial advice.
 * Not SAVE / repayment-plan advice. Public ED / StudentAid.gov framing only.
 *
 * ui_refresh 2026-09-25: phone-first layout + plain-language copy. Date math, phases,
 * percentages, validation rules and share-hash format are unchanged from the
 * previous release (see ui_refresh/checks/equivalence.js).
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
    "ED Jun 18 2026: borrowers enrolled in auto pay may be eligible for a temporary 1% interest-rate reduction beginning Jul 1 2026; enroll by Sep 30 2026 (or be already enrolled) to benefit through Jun 30 2028. The usual autopay reduction was 0.25%; borrowers already enrolled get an extra 0.75% automatically (1% total). Enroll through your loan servicer account — StudentAid.gov is not the autopay switch. ED’s description: Direct Loans originated after Jul 1 2012; borrowers in default must get back into good standing first. For understanding only — not eligibility advice.";

  /** Examples — labeled sample dates/status. Not pulled from any servicer. */
  const SEEDS = [
    {
      id: "not-on-17d",
      label: "Not on autopay · 17 days left",
      sub: "Example · checked Sep 13 · enroll through your servicer",
      viewDate: "2026-09-13",
      autopay: "no",
      directLoan: "unknown",
      noteLabel: "Example: not on autopay",
    },
    {
      id: "already-on",
      label: "Already on autopay · no extra action",
      sub: "Example · already enrolled · extra 0.75% automatically",
      viewDate: "2026-09-13",
      autopay: "yes",
      directLoan: "yes",
      noteLabel: "Example: already on autopay",
    },
    {
      id: "unsure-check",
      label: "Unsure · check with your servicer",
      sub: "Example · StudentAid.gov is not the autopay switch",
      viewDate: "2026-09-13",
      autopay: "unsure",
      directLoan: "unsure",
      noteLabel: "Example: not sure",
    },
    {
      id: "last-day",
      label: "Last day · Sep 30",
      sub: "Example · enroll by 11:59 p.m. ET",
      viewDate: "2026-09-30",
      autopay: "no",
      directLoan: "unknown",
      noteLabel: "Example: last day",
    },
    {
      id: "window-closed",
      label: "Window closed · Oct 1",
      sub: "Example · deadline passed · no made-up late option",
      viewDate: "2026-10-01",
      autopay: "no",
      directLoan: "unknown",
      noteLabel: "Example: after the deadline",
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
        deadlineSub: "Enroll by " + DEADLINE_LABEL,
      };
    }
    if (daysLeft === 0) {
      return {
        phase: "last",
        headline: "Last day — enroll by 11:59 p.m. ET",
        daysLabel: "Today is the last day",
        ringLabel: "TODAY",
        deadlineSub: "Enroll by " + DEADLINE_LABEL,
      };
    }
    return {
      phase: "closed",
      headline: "The enrollment window has closed",
      daysLabel: "Closed",
      ringLabel: "CLOSED",
      deadlineSub: "The Sep 30 2026 enrollment deadline has passed",
    };
  }

  function loanMeta(flag) {
    if (flag === "yes") {
      return {
        short: "After Jul 1 2012",
        line: "You said your Direct Loan was originated (made) after Jul 1 2012 — that matches ED’s public description. This is still not a decision that you are eligible.",
      };
    }
    if (flag === "no") {
      return {
        short: "Other loan type",
        line: "You said this is not a Direct Loan originated after Jul 1 2012. ED’s public description is for that group of loans — we do not invent eligibility for other loans.",
      };
    }
    if (flag === "unsure") {
      return {
        short: "Not sure",
        line: "You’re not sure whether this is a Direct Loan originated after Jul 1 2012. Eligibility is not confirmed by what you entered — check with your servicer or StudentAid.gov.",
      };
    }
    return {
      short: "Not confirmed",
      line: "You didn’t say whether this is a Direct Loan originated after Jul 1 2012. Eligibility is not confirmed by what you entered — we never invent it.",
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
          flag: "You’re already on autopay — no extra action for the temporary 1%. We don’t guess whether you qualified.",
          decoder:
            "You said you’re already on autopay with your servicer. ED: borrowers already enrolled get the extra 0.75% automatically (1% total). The Sep 30 enrollment deadline has passed. If you were on autopay by that date, ED says the reduction runs through Jun 30 2028 — this page can’t confirm your account.",
          action:
            "Check your loan servicer account to confirm autopay and the reduction. Details are on the StudentAid.gov auto-pay interest-rate-reduction page. This page doesn’t log in or change your loans.",
          short: "Already on",
        };
      }
      return {
        pill: "Already on autopay",
        sub: "No extra action for the temporary 1% reduction",
        cls: "ok",
        flag: "You’re already on autopay — no extra action for the temporary 1% reduction.",
        decoder:
          "You said you’re already on autopay with your servicer. ED Jun 18 2026: borrowers already enrolled get the extra 0.75% automatically (1% total) — no extra enrollment step for this temporary reduction. Confirm with your servicer; we can’t see your account.",
        action:
          "Confirm autopay is on in your loan servicer account (not StudentAid.gov). Details are on StudentAid.gov. This page doesn’t change your loans.",
        short: "Already on",
      };
    }

    if (status === "no") {
      if (closed) {
        return {
          pill: "Window closed",
          sub: "Sep 30 deadline passed · no made-up late option",
          cls: "danger",
          flag: "The window has closed and you’re not on autopay. This page doesn’t make up a late-enrollment option.",
          decoder:
            "You said you’re not on autopay with your servicer, and the public Sep 30 2026 deadline to enroll has passed. We do not invent a late-enrollment exception. Check with your servicer or StudentAid.gov for your actual status.",
          action:
            "Log in to your loan servicer and read the StudentAid.gov auto-pay interest-rate-reduction page. This page only explains the calendar — it is not eligibility or plan advice.",
          short: "Not on · closed",
        };
      }
      if (last) {
        return {
          pill: "Last day · enroll through your servicer",
          sub: "Enroll by 11:59 p.m. ET today in your servicer account",
          cls: "danger",
          flag: "Today is the last day and you’re not on autopay. Enroll through your servicer by 11:59 p.m. ET.",
          decoder:
            "You said you’re not on autopay with your servicer. The public deadline to enroll is today — Sep 30 2026 11:59 p.m. ET. Enroll in autopay in your loan servicer account. StudentAid.gov is not the autopay switch. We do not invent that you are eligible.",
          action:
            "Enroll in autopay in your loan servicer account today. Details are on the StudentAid.gov auto-pay interest-rate-reduction page. Not plan advice. Not a Loan Simulator.",
          short: "Not on · last day",
        };
      }
      return {
        pill: "Enroll through your servicer",
        sub: "Not on autopay · enroll in your servicer account",
        cls: "warn",
        flag: "You’re not on autopay yet. Enroll through your servicer by Sep 30 2026 11:59 p.m. ET.",
        decoder:
          "You said you’re not on autopay with your servicer. ED: enroll by Sep 30 2026 (or be already enrolled) to benefit through Jun 30 2028. You enroll in your loan servicer account — StudentAid.gov is not the autopay switch. We do not invent eligibility, your rate, or monthly savings.",
        action:
          "Enroll in autopay in your loan servicer account. Details are on the StudentAid.gov auto-pay interest-rate-reduction page. Not SAVE / repayment-plan advice.",
        short: "Not on",
      };
    }

    // unsure
    if (closed) {
      return {
        pill: "Window closed · check with your servicer",
        sub: "Confirm whether you were enrolled by Sep 30",
        cls: "unsure",
        flag: "The window has closed and you’re not sure about autopay. Check with your servicer — we won’t guess your status.",
        decoder:
          "You said you’re not sure about your autopay status, and the public Sep 30 2026 deadline to enroll has passed. Confirm with your servicer whether you were enrolled by that date. We do not invent your status or a late-enrollment option.",
        action:
          "Log in to your loan servicer (not StudentAid.gov) and read the official auto-pay interest-rate-reduction page. This page does not decide eligibility.",
        short: "Unsure · closed",
      };
    }
    if (last) {
      return {
        pill: "Last day · check with your servicer",
        sub: "Confirm today · StudentAid.gov is not the autopay switch",
        cls: "warn",
        flag: "Today is the last day and you’re not sure about autopay. Check with your servicer by 11:59 p.m. ET.",
        decoder:
          "You said you’re not sure about your autopay status. The public deadline to enroll is today — Sep 30 2026 11:59 p.m. ET. StudentAid.gov is not the autopay switch. Check your servicer account before the cutoff. We do not invent your status.",
        action:
          "Open your loan servicer account and confirm autopay. Details are on StudentAid.gov. Not financial advice.",
        short: "Unsure · last day",
      };
    }
    return {
      pill: "Check your servicer",
      sub: "Unsure · StudentAid.gov is not the autopay switch",
      cls: "unsure",
      flag: "Not sure if you’re on autopay? Check with your servicer — StudentAid.gov is not the autopay switch.",
      decoder:
        "You said you’re not sure about your autopay status. Many borrowers mix up StudentAid.gov with servicer autopay. Confirm in your loan servicer account. Enroll by Sep 30 2026 11:59 p.m. ET (or be already enrolled), per ED — we do not invent whether you already qualify.",
      action:
        "Log in to your loan servicer and look for auto pay / autopay. Details are on the StudentAid.gov auto-pay interest-rate-reduction page. Not plan advice.",
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
      return "Pick a date to count from (the view date — usually today). We won’t guess the days left.";
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
        renderCard({ writeHash: true });
        $("status").textContent = "Showing example: " + s.label;
        scrollToCard();
      });
      box.appendChild(btn);
    });
  }

  /** Put text into el, turning known source names into their (existing) links. */
  const LINKS = [
    ["StudentAid.gov auto-pay interest-rate-reduction page", STUDENTAID],
    ["official auto-pay interest-rate-reduction page", STUDENTAID],
  ];
  function setLinkedText(el, text) {
    el.textContent = "";
    let rest = String(text);
    while (rest) {
      let hit = null;
      LINKS.forEach(([k, url]) => {
        const i = rest.indexOf(k);
        if (i !== -1 && (!hit || i < hit.i)) hit = { i: i, k: k, url: url };
      });
      if (!hit) {
        el.appendChild(document.createTextNode(rest));
        break;
      }
      if (hit.i) el.appendChild(document.createTextNode(rest.slice(0, hit.i)));
      const a = document.createElement("a");
      a.href = hit.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = hit.k;
      el.appendChild(a);
      rest = rest.slice(hit.i + hit.k.length);
    }
  }

  /** Display only: keep "Sep 30 2026" and "11:59 p.m. ET" from breaking across lines. */
  function keepTogether(text) {
    return String(text)
      .replace(/11:59 p\.m\. ET/g, "11:59\u00a0p.m.\u00a0ET")
      .replace(/([A-Z][a-z]{2}) (\d{1,2}) (\d{4})/g, "$1\u00a0$2\u00a0$3");
  }

  function setBig(num, unit, cls, isWord) {
    $("bigNum").textContent = num;
    $("bigNum").className = "big-num" + (isWord ? " is-word" : "");
    $("bigUnit").textContent = unit;
    $("bigLine").className = "big " + (cls || "");
  }

  function scrollToCard() {
    const el = $("cardSection");
    if (!el || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.6) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function citeText() {
    return (
      CITE_ONE_LINER +
      " Benefit through " +
      BENEFIT_LABEL +
      " (ED). Business Insider Sep 1 2026 published an example (~$23/mo) — that is their math, not yours, and it is not shown as a calculated savings here."
    );
  }

  /**
   * opts.writeHash — update the address bar (only after a user action or when the page
   * was opened from a share link, so a #toggle-goatcounter visit is never overwritten).
   */
  function renderCard(opts) {
    const o = opts || {};
    const input = readInputs();
    const err = validate(input);
    const hash = encodeHash(input);
    $("shareUrl").value = location.href.split("#")[0] + hash;

    if (err) {
      setBig("—", "", "unsure", true);
      $("daysBar").hidden = true;
      $("windowLine").textContent = "";
      $("statusPill").hidden = true;
      $("dlHeadline").textContent = err;
      $("status").textContent = err;
      return false;
    }

    const c = compute(input);
    if (o.announce) {
      $("status").textContent = "Answer ready — share it, copy it, or save it as an image.";
    } else if (o.clearStatus) {
      $("status").textContent = "";
    }

    const metaBits = [];
    if (input.noteLabel) metaBits.push(input.noteLabel);
    $("cardMeta").textContent = metaBits.join(" · ");

    // Big answer
    if (c.win.phase === "open") {
      const urgent = c.daysLeft <= 7 ? "danger" : c.ap.cls === "ok" ? "ok" : "warn";
      setBig(String(c.daysLeft), c.daysLeft === 1 ? "day left" : "days left", urgent, false);
    } else if (c.win.phase === "last") {
      setBig("Today", "is the last day", "danger", true);
    } else {
      setBig(c.win.daysLabel, "", "unsure", true);
    }
    $("deadlineLine").textContent = keepTogether(c.win.deadlineSub);

    const bar = $("daysBar");
    const windowEl = $("windowLine");
    if (c.win.phase === "closed") {
      bar.hidden = true;
      windowEl.textContent =
        "Deadline passed · if you were enrolled, the benefit runs through " + BENEFIT_LABEL;
    } else {
      bar.hidden = false;
      bar.style.setProperty("--pct", String(c.pct));
      bar.className =
        "bar " + (c.win.phase === "last" || c.daysLeft <= 7 ? "danger" : c.ap.cls === "ok" ? "ok" : "");
      windowEl.textContent =
        c.win.phase === "last"
          ? "Last calendar day of the enrollment window"
          : c.daysLeft + " of " + c.span + " days remain in the Jun 18–Sep 30 public window";
    }

    const pill = $("statusPill");
    pill.hidden = false;
    pill.textContent = c.ap.pill;
    pill.className = "pill " + c.ap.cls;

    $("dlHeadline").textContent = c.ap.flag;
    setLinkedText($("actionLine"), c.ap.action);

    $("rAutopay").textContent = c.ap.short;
    $("rLoan").textContent = c.loan.short;
    $("rDeadline").textContent = "Sep 30 2026";
    $("rBenefit").textContent = BENEFIT_LABEL;

    $("decoderLine").textContent = c.ap.decoder + " " + c.loan.line;
    $("citeLine").textContent = citeText();

    if (o.writeHash && location.hash !== hash) {
      history.replaceState(null, "", hash);
    }
    return true;
  }

  function clearAll() {
    applyInputs({
      viewDate: todayISO(),
      autopay: "unsure",
      directLoan: "unknown",
      noteLabel: "",
    });
    if (location.hash.startsWith("#p=")) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    renderCard({});
    $("status").textContent = "Cleared.";
  }

  function summaryText() {
    const input = readInputs();
    const err = validate(input);
    if (err) return err;
    const c = compute(input);
    const lines = [
      "Autopay Interest Deadline",
      "Counting from: " + fmtDate(c.viewDate),
      "Countdown: " + c.win.daysLabel + " · " + c.win.deadlineSub,
      "Status: " + c.ap.pill + " · " + c.ap.sub,
      "Direct Loan: " + c.loan.short,
      "Benefit through (ED): " + BENEFIT_LABEL,
      "",
      c.ap.decoder,
      c.loan.line,
      c.ap.action,
      "",
      CITE_ONE_LINER,
      "Not financial advice. Not SAVE plan advice. We never invent eligibility.",
    ];
    return lines.filter((x) => x != null).join("\n");
  }

  /** Clipboard with a fallback for older browsers / non-secure contexts. */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext !== false) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      /* fall through */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function showLinkBox() {
    const box = $("shareBox");
    if (box) box.open = true;
    const inp = $("shareUrl");
    if (inp) {
      inp.focus();
      inp.select();
    }
  }

  async function copySummary() {
    if (await copyText(summaryText())) {
      $("status").textContent = "Summary copied.";
    } else {
      $("status").textContent = "Couldn’t copy — select the link below instead.";
      showLinkBox();
    }
  }

  async function shareLink() {
    if (!renderCard({ writeHash: true })) return;
    const url = $("shareUrl").value;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Autopay Interest Deadline",
          text: "Days left to Sep 30 for ED’s 1% autopay interest reduction — a calendar card",
          url: url,
        });
        $("status").textContent = "Share sheet opened.";
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") {
        $("status").textContent = "Share cancelled.";
        return;
      }
    }
    if (await copyText(url)) {
      $("status").textContent = "Link copied — paste it anywhere.";
    } else {
      $("status").textContent = "Sharing isn’t available here — copy the link below.";
      showLinkBox();
    }
  }

  async function copyShare() {
    renderCard({ writeHash: true });
    if (await copyText($("shareUrl").value)) {
      $("status").textContent = "Link copied.";
    } else {
      $("status").textContent = "Couldn’t copy — select the link below.";
      showLinkBox();
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

  const SANS = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

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

    ctx.fillStyle = "#f6f6f3";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 36, 36, W - 72, H - 72, 24);
    ctx.fill();
    ctx.strokeStyle = "#d5dae0";
    ctx.lineWidth = 2;
    ctx.stroke();

    let y = 90;
    ctx.fillStyle = "#4a5360";
    ctx.font = "600 22px " + SANS;
    ctx.fillText("Autopay Interest Deadline", 72, y);
    y += 30;
    ctx.font = "400 20px " + SANS;
    ctx.fillText(
      "Counting from " + fmtDate(c.viewDate) + (input.noteLabel ? " · " + input.noteLabel : ""),
      72,
      y
    );
    y += 140;

    const color =
      c.ap.cls === "danger" || c.win.phase === "last" || (c.win.phase === "open" && c.daysLeft <= 7)
        ? "#b0261d"
        : c.ap.cls === "ok"
          ? "#1b7340"
          : c.ap.cls === "warn"
            ? "#85560a"
            : "#16191d";
    ctx.fillStyle = color;
    if (c.win.phase === "open") {
      ctx.font = "800 140px " + SANS;
      const num = String(c.daysLeft);
      ctx.fillText(num, 68, y);
      const w = ctx.measureText(num).width;
      ctx.fillStyle = "#16191d";
      ctx.font = "700 40px " + SANS;
      ctx.fillText(c.daysLeft === 1 ? "day left" : "days left", 68 + w + 20, y);
    } else {
      ctx.font = "800 72px " + SANS;
      y = wrapText(ctx, c.win.daysLabel, 68, y - 40, W - 144, 80) - 40;
    }
    y += 60;

    ctx.fillStyle = "#16191d";
    ctx.font = "700 30px " + SANS;
    y = wrapText(ctx, c.win.deadlineSub, 72, y, W - 144, 38);
    y += 10;

    ctx.font = "700 24px " + SANS;
    ctx.fillStyle = color;
    y = wrapText(ctx, c.ap.pill + " · " + c.ap.sub, 72, y, W - 144, 32);
    y += 8;

    ctx.fillStyle = "#16191d";
    ctx.font = "400 24px " + SANS;
    y = wrapText(ctx, c.ap.flag, 72, y, W - 144, 32);
    y += 18;

    ctx.fillStyle = "#fff5dc";
    roundRect(ctx, 64, y, W - 128, 90, 16);
    ctx.fill();
    ctx.strokeStyle = "#e2bd5b";
    ctx.stroke();
    ctx.fillStyle = "#16191d";
    ctx.font = "400 22px " + SANS;
    wrapText(
      ctx,
      "Enroll in autopay in your loan servicer account — StudentAid.gov is not where you turn autopay on.",
      88, y + 38, W - 176, 30
    );
    y += 120;

    ctx.font = "700 22px " + SANS;
    ctx.fillText("What to do next", 72, y);
    y += 32;
    ctx.font = "400 21px " + SANS;
    y = wrapText(ctx, c.ap.action, 72, y, W - 144, 29);
    y += 14;

    const cells = [
      ["Autopay", c.ap.short],
      ["Direct Loan", c.loan.short],
      ["Enroll by", "Sep 30 2026"],
      ["Benefit through", BENEFIT_LABEL],
    ];
    const cellW = (W - 144) / 4;
    cells.forEach((cell, i) => {
      const cx = 72 + cellW * i;
      ctx.fillStyle = "#4a5360";
      ctx.font = "400 17px " + SANS;
      ctx.fillText(cell[0], cx, y + 10);
      ctx.fillStyle = "#16191d";
      ctx.font = "700 19px " + SANS;
      ctx.fillText(cell[1], cx, y + 38);
    });

    ctx.fillStyle = "#4a5360";
    ctx.font = "400 16px " + SANS;
    wrapText(
      ctx,
      "ED Jun 18 2026: 1% autopay interest reduction; enroll by Sep 30 2026 (or be already enrolled) to benefit through Jun 30 2028. Enroll through your servicer. Direct Loans originated after Jul 1 2012. We never invent your rate, savings, or eligibility. The Business Insider Sep 1 example math is theirs — not shown as yours.",
      72, H - 150, W - 144, 22
    );
    ctx.fillText(
      "Not financial advice · StudentAid.gov · your loan servicer · source: ED",
      72,
      H - 56
    );

    canvas.toBlob((blob) => {
      if (!blob) {
        $("status").textContent = "Couldn’t create the image.";
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
      $("status").textContent = "Image saved.";
    });
  }

  function bind() {
    if (!$("viewDate").value) $("viewDate").value = todayISO();
    renderChips();

    const live = () => renderCard({ writeHash: true, clearStatus: true });
    ["autopay", "directLoan", "viewDate"].forEach((id) => $(id).addEventListener("change", live));
    $("noteLabel").addEventListener("input", live);
    $("cardBtn").addEventListener("click", () => {
      renderCard({ writeHash: true, announce: true });
      scrollToCard();
    });
    $("clearBtn").addEventListener("click", clearAll);
    $("copySummary").addEventListener("click", copySummary);
    $("shareBtn").addEventListener("click", shareLink);
    $("copyShare").addEventListener("click", copyShare);
    $("pngBtn").addEventListener("click", exportPng);

    window.addEventListener("hashchange", () => {
      const p = decodeHash();
      if (p) {
        applyInputs(p);
        renderCard({ writeHash: true });
      }
    });

    const fromHash = decodeHash();
    if (fromHash) {
      applyInputs(fromHash);
      renderCard({ writeHash: true });
    } else {
      // Show an answer straight away with the default inputs (today’s date).
      renderCard({});
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
      windowSpanDays: windowSpanDays,
      validate: validate,
      compute: compute,
      CITE_ONE_LINER: CITE_ONE_LINER,
      BENEFIT_END_ISO: BENEFIT_END_ISO,
      ED_PRESS: ED_PRESS,
      STUDENTAID: STUDENTAID,
      BI_SEP1: BI_SEP1,
      FORBES_JUL29: FORBES_JUL29,
    };
  }
})();
