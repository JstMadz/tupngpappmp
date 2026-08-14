// Site-visit counter: increments a shared count in Supabase on every load,
// with a per-browser localStorage counter as a fallback if that request fails.
window.PPMP = window.PPMP || {};

window.PPMP.visitorCounter = (function () {
  function animateVisitorCount(target) {
    const el = document.getElementById("visitorCount");
    if (!el) return;
    const start = 0;
    const duration = 1200;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + (target - start) * eased);
      el.textContent = value.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString();
        el.classList.add("is-counting");
        setTimeout(() => el.classList.remove("is-counting"), 250);
      }
    }
    requestAnimationFrame(step);
  }

  function trackVisitorLocally() {
    const count =
      (parseInt(localStorage.getItem("ppmpVisitorCount"), 10) || 0) + 1;
    localStorage.setItem("ppmpVisitorCount", String(count));
    animateVisitorCount(count);
  }

  function init() {
    const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_COUNTER_KEY } =
      window.PPMP.config;

    fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_counter`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ counter_key: SUPABASE_COUNTER_KEY }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Supabase request failed");
        return res.json();
      })
      .then((value) => animateVisitorCount(value))
      .catch(() => trackVisitorLocally());
  }

  return { init };
})();
