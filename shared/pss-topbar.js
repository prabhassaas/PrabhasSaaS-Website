/* ==========================================================================
   Prabhas SaaS — shared app top bar (behaviour only)

   The markup lives in each app's own HTML so the bar is server-rendered:
   no flash, no layout shift, and the links are in the DOM for crawlers.
   This file only adds behaviour:

     - dropdown open/close (app switcher, user menu) with outside-click,
       Escape and roving focus
     - the mobile menu toggle
     - swapping the signed-out cluster for the signed-in one when a session
       exists, so an app that has auth doesn't need to duplicate this logic

   Auth is optional. If the page has loaded pss-auth.js (window.PSSAuth), the
   bar asks it for the current user; otherwise it stays in its signed-out
   state, which is the correct resting state for apps without login.

   Spec + markup: docs/TOPBAR.md
   ========================================================================== */
(function () {
  "use strict";

  var bar = document.querySelector(".pss-topbar");
  if (!bar) return;

  /* ---------- dropdowns ---------- */

  function closeAll(except) {
    bar.querySelectorAll("[data-pss-pop]").forEach(function (pop) {
      if (pop === except) return;
      pop.hidden = true;
      var btn = bar.querySelector('[aria-controls="' + pop.id + '"]');
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  bar.addEventListener("click", function (e) {
    var toggle = e.target.closest("[aria-controls]");
    if (toggle && bar.contains(toggle)) {
      var pop = document.getElementById(toggle.getAttribute("aria-controls"));
      if (pop && pop.hasAttribute("data-pss-pop")) {
        e.preventDefault();
        var willOpen = pop.hidden;
        closeAll(pop);
        pop.hidden = !willOpen;
        toggle.setAttribute("aria-expanded", String(willOpen));
        if (willOpen) {
          var first = pop.querySelector("a, button");
          if (first) first.focus({ preventScroll: true });
        }
        return;
      }
    }
    // A click anywhere else inside the bar that isn't in an open popover closes them.
    if (!e.target.closest("[data-pss-pop]")) closeAll(null);
  });

  document.addEventListener("click", function (e) {
    if (!bar.contains(e.target)) closeAll(null);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = bar.querySelector("[data-pss-pop]:not([hidden])");
    if (!open) return;
    var btn = bar.querySelector('[aria-controls="' + open.id + '"]');
    closeAll(null);
    if (btn) btn.focus({ preventScroll: true });
  });

  /* ---------- app switcher: drop the duplicate of the current app ----------
     The switcher list is copied verbatim into every app, so it always contains
     an entry for the app you are already in, on top of the "is-current" row.
     Removing it here keeps the template identical everywhere — an app that
     hand-edited its own list out would drift the moment a new app is added. */
  (function dedupeSwitcher() {
    var current = bar.querySelector(".pss-pop a.is-current");
    if (!current) return;
    var label = (current.textContent || "").trim().toLowerCase();
    if (!label) return;
    current.parentNode.querySelectorAll("a:not(.is-current)").forEach(function (a) {
      if ((a.textContent || "").trim().toLowerCase() === label) a.remove();
    });
  })();

  /* ---------- mobile menu ---------- */

  var burger = bar.querySelector("[data-pss-burger]");
  var mobile = bar.querySelector("[data-pss-mobile]");
  if (burger && mobile) {
    burger.addEventListener("click", function () {
      var open = mobile.hidden;
      mobile.hidden = !open;
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- signed-in / signed-out ---------- */

  function initials(name, email) {
    var src = (name || "").trim() || (email || "").trim();
    if (!src) return "??";
    var parts = src.split(/\s+/);
    var s = parts.length > 1
      ? parts[0].charAt(0) + parts[1].charAt(0)
      : src.slice(0, 2);
    return s.toUpperCase();
  }

  function applyUser(user) {
    if (!user) return;
    var out = bar.querySelectorAll("[data-pss-when='out']");
    var inn = bar.querySelectorAll("[data-pss-when='in']");
    out.forEach(function (el) { el.hidden = true; });
    inn.forEach(function (el) { el.hidden = false; });

    var name = user.name || user.full_name ||
      (user.user_metadata && user.user_metadata.full_name) || "";
    var email = user.email || "";
    var first = (name || email).split(/[\s@]/)[0];

    bar.querySelectorAll("[data-pss-avatar]").forEach(function (el) {
      el.textContent = initials(name, email);
    });
    bar.querySelectorAll("[data-pss-firstname]").forEach(function (el) {
      el.textContent = first;
    });
    bar.querySelectorAll("[data-pss-name]").forEach(function (el) {
      el.textContent = name || first;
    });
    bar.querySelectorAll("[data-pss-email]").forEach(function (el) {
      el.textContent = email;
    });
  }

  // Ask the shared auth helper, if this app ships one. Anything that throws or
  // is missing simply leaves the bar signed-out, which is a valid state.
  function detectUser() {
    try {
      var A = window.PSSAuth;
      if (!A) return;
      if (typeof A.getUser === "function") {
        var r = A.getUser();
        if (r && typeof r.then === "function") r.then(applyUser).catch(function () {});
        else applyUser(r);
      } else if (A.user) {
        applyUser(A.user);
      }
      if (typeof A.onChange === "function") A.onChange(applyUser);
    } catch (_) { /* stay signed-out */ }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", detectUser);
  } else {
    detectUser();
  }

  // Let an app hand the bar a user directly (useful in SPAs that resolve auth
  // after their own boot).
  window.PSSTopbar = { setUser: applyUser };
})();
