/**
 * Fisher-Yates in-place shuffle.
 *
 * @module utils/shuffle
 * @license CC BY-NC-SA 4.0
 */

/**
 * Shuffles an array in place and returns it.
 *
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
export function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
