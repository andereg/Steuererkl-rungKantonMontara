// umami-events.js — gemeinsame Tracking-Events für alle Montara HTML-Seiten.
//
// Wird in jeder HTML-Datei eingebunden via:
//   <script defer src="https://analytics.lucasreitmann.me/script.js"
//           data-website-id="bb085154-e170-4b29-9579-e566ca8c9c13"></script>
//   <script defer src="umami-events.js"></script>
//
// Erwartet, dass das Umami-Script bereits geladen ist (window.umami).
// Alle Events sind DSG-konform: keine Cookies, keine PII, keine User-IDs.

(function () {
  "use strict";

  // ------------------------------------------------------------
  // 1) page_load_time — auf JEDER Seite
  // Misst Performance-Timing (loadEventEnd - navigationStart)
  // und schickt einen Custom-Event an Umami.
  // ------------------------------------------------------------
  window.addEventListener("load", function () {
    var tries = 0;
    var iv = setInterval(function () {
      if (window.umami && window.performance) {
        clearInterval(iv);
        var t = performance.timing;
        umami.track("page_load_time", {
          path: location.pathname,
          ms: t.loadEventEnd - t.navigationStart,
        });
      } else if (++tries > 20) {
        clearInterval(iv);
      }
    }, 100);
  });

  // ------------------------------------------------------------
  // 2) article_engaged — NUR auf article.html und themes.html
  // Feuert einmal pro Pageview, sobald der User >=60s geblieben
  // UND ans Ende der Seite gescrollt ist. Signal für CEI / CPI /
  // DTI / STI / SPI / DPI.
  // ------------------------------------------------------------
  if (/article\.html|themes\.html/.test(location.pathname)) {
    var reachedBottom = false;
    var stayedOneMinute = false;
    var eventSent = false;

    setTimeout(function () {
      stayedOneMinute = true;
      maybeTrackArticleEngaged();
    }, 60000);

    window.addEventListener("scroll", function () {
      var scrollBottom = window.scrollY + window.innerHeight;
      var pageHeight = document.documentElement.scrollHeight;
      if (scrollBottom >= pageHeight - 10) {
        reachedBottom = true;
        maybeTrackArticleEngaged();
      }
    });

    function maybeTrackArticleEngaged() {
      if (eventSent || !reachedBottom || !stayedOneMinute) return;
      if (!window.umami) return;
      eventSent = true;
      umami.track("article_engaged", {
        action: "read_full_article",
        time_on_page_seconds: 60,
        path: location.pathname,
      });
    }
  }

  // ------------------------------------------------------------
  // 3) link_click — auf JEDER Seite
  // Fängt jeden Click auf <a>-Elemente und meldet ihn als
  // internen oder externen Link-Click. Capture-Phase (true),
  // damit der Event auch dann zählt, wenn ein anderer Handler
  // stopPropagation() macht.
  // ------------------------------------------------------------
  document.addEventListener(
    "click",
    function (e) {
      var link = e.target.closest("a");
      if (!link || !link.href) return;
      try {
        var url = new URL(link.href, location.href);
        if (!window.umami) return;
        var isInternal = url.hostname === location.hostname;
        umami.track("link_click", {
          target: link.href,
          target_host: url.hostname,
          from_path: location.pathname,
          type: isInternal ? "internal" : "external",
        });
      } catch (_) {
        /* ignore malformed URLs (mailto:, tel:, etc.) */
      }
    },
    true,
  );

  // ------------------------------------------------------------
  // 4) form_submitted — Conversion-Goal beim Submit
  // Hookt sich auf jedes <form data-umami-form="..."> Element.
  // Der Wert von data-umami-form wird als 'form'-Property mitgeschickt.
  // ------------------------------------------------------------
  document.addEventListener(
    "submit",
    function (e) {
      var form = e.target;
      if (!form || !form.matches || !form.matches("form[data-umami-form]"))
        return;
      if (!window.umami) return;
      umami.track("form_submitted", {
        form: form.dataset.umamiForm,
        path: location.pathname,
      });
    },
    true,
  );
})();
