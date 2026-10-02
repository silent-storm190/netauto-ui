(function () {
  "use strict";
  const review = window.PowerMonitoringReview;
  const names = Object.keys(review.CASES);
  let current = 0;

  function switcher() {
    return `<div class="mockup-note">Bản duyệt tĩnh cho FE/DevNet — không gọi API hoặc thiết bị thật. Selector: <code>${review.API.oltOptions}</code> · Allocate: <code>${review.API.allocate}</code></div><div class="case-switcher">${names.map((name, index) => `<button data-case="${index}" class="${index === current ? "active" : ""}">${index + 1}. ${review.CASES[name].title}</button>`).join("")}</div>`;
  }

  function paint() {
    review.renderCase(review.CASES[names[current]], {
      switcher: switcher(),
      interactive: true,
      onOltChange: paint
    });
    document.querySelectorAll("[data-case]").forEach(button => button.addEventListener("click", () => {
      current = Number(button.dataset.case);
      paint();
    }));
  }

  document.addEventListener("DOMContentLoaded", paint);
})();
