// JLS Video Agency — shared site behavior (nav, marquee, accordion, lightbox, scroll-reveal)

document.addEventListener("DOMContentLoaded", function () {
  initNav();
  initMarquee();
  initAccordion();
  initLightbox();
  initReveal();
  initPosterSequence();
  initPosterFit();
  initContactForm();
  initDragScroll();
  initYtFacades();
  initVideoLightbox();
  initExternalLinks();
  initSocialReelLazy();
  initChapterVideosLazy();
});

function initDragScroll() {
  var sel = ".pod-gallery-scroll, .social-reel-scroll, .results-scroll-inner, .reel-yt-grid, .reel-strip";
  document.querySelectorAll(sel).forEach(function(el) {
    var isDown = false, startX, scrollLeft;
    el.addEventListener("mousedown", function(e) { isDown = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; el.style.cursor = "grabbing"; });
    el.addEventListener("mouseleave", function() { isDown = false; el.style.cursor = ""; });
    el.addEventListener("mouseup", function() { isDown = false; el.style.cursor = ""; });
    el.addEventListener("mousemove", function(e) { if (!isDown) return; e.preventDefault(); el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX); });
  });
}

function initNav() {
  var nav = document.querySelector(".site-nav");
  if (!nav) return;
  var toggle = nav.querySelector(".nav-toggle");
  var links = nav.querySelector(".nav-links");

  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("mobile-open");
      document.body.classList.toggle("nav-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("mobile-open");
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }
}

function initMarquee() {
  document.querySelectorAll(".marquee-track").forEach(function (track) {
    if (track.dataset.duplicated) return;
    track.innerHTML += track.innerHTML;
    track.dataset.duplicated = "true";
  });
}

function initAccordion() {
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var question = item.querySelector(".faq-question");
    var answer = item.querySelector(".faq-answer");
    if (!question || !answer) return;
    question.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      item.closest(".faq-list").querySelectorAll(".faq-item").forEach(function (other) {
        other.classList.remove("is-open");
        var otherAnswer = other.querySelector(".faq-answer");
        if (otherAnswer) otherAnswer.style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("is-open");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
}

function initLightbox() {
  var lightbox = document.querySelector(".lightbox");
  if (!lightbox) return;
  var img = lightbox.querySelector("img");
  var closeBtn = lightbox.querySelector(".lightbox-close");

  document.querySelectorAll(".gallery-item img").forEach(function (thumb) {
    thumb.addEventListener("click", function () {
      img.src = thumb.dataset.full || thumb.src;
      img.alt = thumb.alt;
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    });
  });

  function close() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  closeBtn.addEventListener("click", close);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
}

function initReveal() {
  // Exclude elements handled by initPosterSequence
  var POSTER_MANAGED = ["cinema-card", "scroll-cue"];
  var items = Array.prototype.filter.call(
    document.querySelectorAll(".reveal"),
    function (el) {
      return !POSTER_MANAGED.some(function (cls) { return el.classList.contains(cls); });
    }
  );

  if (!("IntersectionObserver" in window) || items.length === 0) {
    items.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach(function (el) { observer.observe(el); });
}

function initPosterSequence() {
  // Coordinates the cinema-card and scroll-cue so they only appear
  // after all 4 poster lines have finished animating.
  // Line delays: 0.1s, 1.1s, 2.1s, 3.1s, 4.1s, 5.1s + 0.9s duration = done at 6.0s
  var POSTER_DONE  = 6100;  // ms — small buffer past last line end
  var SCROLL_EXTRA = 350;   // ms — scroll-cue appears slightly after card

  var trigger    = document.querySelector(".poster-trigger");
  var cinemaCard = document.querySelector(".cinema-card");
  var scrollCue  = document.querySelector(".scroll-cue");

  if (!trigger || (!cinemaCard && !scrollCue)) return;

  var posterStartedAt = null;

  function revealEl(el, delay) {
    if (!el) return;
    setTimeout(function () { el.classList.add("is-visible"); }, delay);
  }

  // Observe the poster trigger; when it enters the viewport, start the countdown
  var po = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting || posterStartedAt !== null) return;
      posterStartedAt = Date.now();
      revealEl(cinemaCard, POSTER_DONE);
      revealEl(scrollCue,  POSTER_DONE + SCROLL_EXTRA);
      po.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  po.observe(trigger);

  // Edge case: if cinema-card / scroll-cue scroll into view AFTER the poster
  // animation is already complete, reveal them immediately.
  if (!("IntersectionObserver" in window)) return;
  var fallback = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var elapsed = posterStartedAt ? Date.now() - posterStartedAt : 0;
      if (elapsed >= POSTER_DONE) {
        el.classList.add("is-visible");
        fallback.unobserve(el);
      }
    });
  }, { threshold: 0.15 });

  if (cinemaCard) fallback.observe(cinemaCard);
  if (scrollCue)  fallback.observe(scrollCue);
}

function initPosterFit() {
  var headings = document.querySelectorAll(".poster-heading");
  if (!headings.length) return;

  var BASE_PX = 100;
  var MIN_PX  = 24;
  var MAX_PX  = 340;

  var instances = [];
  headings.forEach(function (heading) {
    var lines = heading.querySelectorAll(".poster-line");
    var wrap  = heading.closest(".poster-trigger");
    if (lines.length && wrap) instances.push({ heading: heading, lines: lines, wrap: wrap });
  });

  function fitOne(inst) {
    var availableWidth = inst.wrap.clientWidth;
    if (!availableWidth) return;
    inst.heading.style.fontSize = BASE_PX + "px";
    var widest = 0;
    inst.lines.forEach(function (line) { widest = Math.max(widest, line.scrollWidth); });
    if (!widest) return;
    /* On mobile, use 0.92 instead of 1.08 so the text stays safely within
       the side-padded container and never overflows the viewport edge. */
    var overdrive = window.innerWidth <= 768 ? 0.88 : 0.94;
    var size = Math.floor((availableWidth / widest) * BASE_PX * overdrive);
    size = Math.max(MIN_PX, Math.min(MAX_PX, size));
    inst.heading.style.fontSize = size + "px";
  }

  function fitAll() { instances.forEach(fitOne); }

  fitAll();
  window.addEventListener("resize", debounce(fitAll, 150));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      instances.forEach(function (inst) {
        var wasVisible = inst.wrap.classList.contains('is-visible');
        if (wasVisible) {
          /* Hide for one frame while refitting so the size change isn't visible */
          inst.wrap.style.visibility = 'hidden';
          fitOne(inst);
          requestAnimationFrame(function () { inst.wrap.style.visibility = ''; });
        } else {
          fitOne(inst);
        }
      });
    });
  }
}

function debounce(fn, wait) {
  var t;
  return function () { clearTimeout(t); t = setTimeout(fn, wait); };
}

function initContactForm() {
  var form = document.getElementById("contactForm");
  if (!form) return;

  // Replace with your GoHighLevel webhook endpoint:
  // GHL > Sites > Webhooks > Create Webhook, paste the URL below.
  var GHL_WEBHOOK_URL = "GHL_WEBHOOK_URL";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn     = form.querySelector(".contact-form-btn");
    var success = document.getElementById("contactSuccess");

    var payload = {
      firstName: (document.getElementById("contactFirstName") || {}).value || "",
      lastName:  (document.getElementById("contactLastName")  || {}).value || "",
      email:     (document.getElementById("contactEmail")     || {}).value || "",
      phone:     (document.getElementById("contactPhone")     || {}).value || "",
      message:   (document.getElementById("contactMessage")   || {}).value || ""
    };

    btn.disabled    = true;
    btn.textContent = "Sending…";

    fetch(GHL_WEBHOOK_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload)
    })
      .then(function ()  { if (success) success.style.display = "block"; form.reset(); })
      .catch(function () { if (success) success.style.display = "block"; form.reset(); })
      .finally(function () { btn.disabled = false; btn.textContent = "Send Now"; });
  });
}

function initVideoLightbox() {
  var lightbox  = document.getElementById("videoLightbox");
  if (!lightbox) return;
  var inner     = document.getElementById("videoLightboxInner");
  var closeBtn  = document.getElementById("videoLightboxClose");
  var activeVideo = null;
  var activeCard  = null;
  var dragMoved   = false;

  function open(card) {
    var video = card.querySelector("video");
    if (!video) return;
    activeVideo = video;
    activeCard  = card;
    video.removeAttribute("muted");
    video.removeAttribute("loop");
    video.removeAttribute("autoplay");
    video.setAttribute("controls", "");
    video.muted = false;
    video.style.cssText = "width:100%;height:100%;border-radius:16px;display:block;background:#000;pointer-events:auto;";
    inner.appendChild(video);
    video.currentTime = 0;
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    video.play();
  }

  function close() {
    if (!activeVideo || !activeCard) return;
    var playIcon = activeCard.querySelector(".social-reel-card-play");
    activeVideo.setAttribute("muted", "");
    activeVideo.setAttribute("loop",  "");
    activeVideo.removeAttribute("controls");
    activeVideo.muted    = true;
    activeVideo.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;";
    activeCard.insertBefore(activeVideo, playIcon);
    activeVideo.play();
    activeVideo = null;
    activeCard  = null;
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".social-reel-card").forEach(function(card) {
    card.addEventListener("mousedown", function() { dragMoved = false; });
    card.addEventListener("mousemove", function() { dragMoved = true; });
    card.addEventListener("click",     function() { if (!dragMoved) open(card); });
  });

  closeBtn.addEventListener("click", close);
  lightbox.addEventListener("click", function(e) { if (e.target === lightbox) close(); });
  document.addEventListener("keydown", function(e) { if (e.key === "Escape") close(); });
}

function initYtFacades() {
  document.querySelectorAll(".yt-facade").forEach(function(facade) {
    facade.addEventListener("click", function() {
      var videoId = facade.dataset.video;
      var title   = facade.dataset.title || "";
      var iframe  = document.createElement("iframe");
      iframe.src  = "https://www.youtube.com/embed/" + videoId + "?autoplay=1&rel=0&modestbranding=1";
      iframe.title = title;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.style.cssText   = "position:absolute;inset:0;width:100%;height:100%;border:none;display:block;";
      facade.replaceWith(iframe);
    });
  });
}

function initExternalLinks() {
  // Open external links (Calendly, etc.) in a new tab safely
  document.querySelectorAll('a[href^="https://calendly.com"]').forEach(function(a) {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });
}

function initChapterVideosLazy() {
  var videos = document.querySelectorAll(".chapter-image video[preload='none']");
  if (!videos.length || !("IntersectionObserver" in window)) {
    videos.forEach(function(v) { v.setAttribute("preload", "auto"); v.load(); });
    return;
  }
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var v = entry.target;
      v.setAttribute("preload", "auto");
      v.load();
      observer.unobserve(v);
    });
  }, { rootMargin: "400px 0px" });
  videos.forEach(function(v) { observer.observe(v); });
}

function initSocialReelLazy() {
  // Social reel videos start with preload="none" so they don't compete with the
  // hero video on page load. This observer flips them to auto and plays them
  // when the reel section is about to scroll into view.
  var sections = document.querySelectorAll(".social-reel-section");
  if (!sections.length || !("IntersectionObserver" in window)) {
    // Fallback: load everything immediately if no observer support
    document.querySelectorAll(".social-reel-card video").forEach(function(v) {
      v.setAttribute("preload", "auto");
      v.load();
      v.play().catch(function(){});
    });
    return;
  }
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll("video[preload='none']").forEach(function(v, i) {
        // Stagger loading so first visible videos load first
        setTimeout(function() {
          v.setAttribute("preload", "auto");
          v.load();
          v.play().catch(function(){});
        }, i * 80);
      });
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "300px 0px" }); // start loading 300px before reel enters view

  sections.forEach(function(s) { observer.observe(s); });
}
