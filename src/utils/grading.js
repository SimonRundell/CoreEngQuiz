/**
 * Grade band calculation.
 *
 * Bands match the T-Level Core Engineering specification:
 *   Pass >= 40%, Merit >= 55%, Distinction >= 70%.
 *
 * @module utils/grading
 * @license CC BY-NC-SA 4.0
 */

/** @typedef {{ label: string, colour: string }} Grade */

/**
 * Returns the grade band for a given percentage.
 *
 * @param {number} pct - Percentage score (0–100).
 * @returns {Grade}
 */
export function gradeFromPercentage(pct) {
    if (pct >= 70) return { label: 'Distinction', colour: '#16a34a' };
    if (pct >= 55) return { label: 'Merit',       colour: '#0284c7' };
    if (pct >= 40) return { label: 'Pass',         colour: '#d97706' };
    return             { label: 'Not Yet',         colour: '#dc2626' };
}
