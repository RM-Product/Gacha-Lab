// Number formatting for the page, the CSV and the post image.

const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const compactUsd = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const int = (n) => whole.format(Math.round(n));

// Dollars from cents. Under $1,000 shows cents; above, whole dollars; `wholeDollars` always whole dollars (the parts
// of a total that shows whole dollars); `compact` shortens six figures and up.
export function usd(cents, { compact = false, wholeDollars = false } = {}) {
  const d = cents / 100;
  const sign = d < 0 ? '-' : '';
  const a = Math.abs(d);
  if (compact && a >= 100000) return `${sign}$${compactUsd.format(a)}`;
  if (a < 1000 && !wholeDollars) return `${sign}$${a.toFixed(2)}`;
  return `${sign}$${whole.format(Math.round(a))}`;
}

// The amounts to show for the parts of one total, in cents, so the shown parts add up to the shown total. A total
// of $1,000 or more shows whole dollars, so then every part does too, rounded together (largest remainder) to the
// rounded total: $2,319.60 + $1,246.80 = $3,566.40 shows as $2,319 + $1,247 = $3,566 (on their own they'd round to
// $2,320 + $1,247 = $3,567). A smaller total keeps every part's cents. `whole` says which it is, for `usd()`.
export function shownParts(parts) {
  const total = parts.reduce((a, b) => a + b, 0);
  if (Math.abs(total) < 100000) return { cents: parts.slice(), whole: false };
  const dollars = parts.map((c) => c / 100);
  const floor = dollars.map((d) => Math.floor(d + 1e-9));
  let left = Math.round(total / 100) - floor.reduce((a, b) => a + b, 0);
  dollars
    .map((d, k) => [d - floor[k], k])
    .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .forEach(([, k]) => {
      if (left > 0) {
        floor[k] += 1;
        left -= 1;
      }
    });
  return { cents: floor.map((d) => d * 100), whole: true };
}

export function pct(x, digits = 0) {
  if (!Number.isFinite(x)) return '–';
  return `${(x * 100).toFixed(digits)}%`;
}

// Like pct, but a share that isn't zero never shows as 0%: one player in a thousand reads "<1%".
export function pctSome(x, digits = 0) {
  if (!Number.isFinite(x)) return '–';
  if (x > 0 && Number((x * 100).toFixed(digits)) === 0) return `<${(1 / 10 ** digits).toFixed(digits)}%`;
  return pct(x, digits);
}

// Percentages of a whole, rounded so they add up to exactly 100 (largest remainder), with `digits` decimals.
// All zero gives all zero.
export function sharesOf(values, digits = 0) {
  const total = values.reduce((a, b) => a + b, 0);
  if (!(total > 0)) return values.map(() => 0);
  const unit = 10 ** digits;
  const raw = values.map((v) => ((v / total) * 100 * unit));
  const floor = raw.map((r) => Math.floor(r + 1e-9));
  let left = 100 * unit - floor.reduce((a, b) => a + b, 0);
  raw
    .map((r, k) => [r - floor[k], k])
    .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .forEach(([, k]) => {
      if (left > 0) {
        floor[k] += 1;
        left -= 1;
      }
    });
  return floor.map((f) => f / unit);
}

// Each paying type's share of revenue (whales, dolphins, pass buyers), rounded together so they add up to
// 100%. Every place that shows one uses these, so the tiles, the bar's key and the dot labels agree.
export function revenueShares(totals) {
  const cents = [0, 1, 2].map((t) => totals.byType[t].spendCents);
  const whole = sharesOf(cents);
  return { whole, text: whole.map((w, t) => (cents[t] > 0 && w === 0 ? '<1%' : `${w}%`)) };
}

// A sign only when the rounded number isn't zero, so a tiny change reads ±0.0% rather than −0.0%.
function signed(x, digits) {
  const v = Math.abs(x * 100).toFixed(digits);
  return `${Number(v) === 0 ? '±' : x > 0 ? '+' : '−'}${v}`;
}

export function signedPct(x, digits = 1) {
  return Number.isFinite(x) ? `${signed(x, digits)}%` : '–';
}

// Percentage points, for differences between two shares.
export function signedPts(x, digits = 1) {
  return Number.isFinite(x) ? `${signed(x, digits)} pts` : '–';
}

export function plural(n, one, many = `${one}s`) {
  return `${int(n)} ${n === 1 ? one : many}`;
}

// Copies of the featured unit. Games name the levels differently (Genshin C0 to C6, Star Rail E0 to E6,
// Fate/Grand Order NP1 to NP5), but every one of them counts copies, so Gacha Lab does too.
export function copies(n) {
  return plural(n, 'copy', 'copies');
}
