// Shared by the browser game and Node.js unit tests.
(function (root) {
  "use strict";

  function calculateRemainingPoints(points, reward) {
    if (reward.type === "flat") {
      return Math.max(0, points - reward.value);
    }
    if (reward.type === "percent") {
      return Math.max(0, Math.round(points * (1 - reward.value / 100)));
    }
    return points;
  }

  const api = { calculateRemainingPoints };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PlinkoScoring = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
