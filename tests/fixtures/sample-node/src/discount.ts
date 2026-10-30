/** Percentage discounts on amounts held in integer cents. */

const HUNDRED = 100;

/** Returns `cents` reduced by `percent`, rounded half up to a whole cent. */
export function applyDiscount(cents: number, percent: number): number {
  if (!Number.isInteger(cents)) {
    throw new RangeError("cents must be an integer");
  }
  if (percent < 0 || percent > HUNDRED) {
    throw new RangeError("percent must be between 0 and 100");
  }
  return Math.round((cents * (HUNDRED - percent)) / HUNDRED);
}
