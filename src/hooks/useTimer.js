/**
 * Elapsed-time timer hook.
 *
 * Counts up in seconds from zero. Exposes start, stop and reset controls.
 *
 * @module hooks/useTimer
 * @license CC BY-NC-SA 4.0
 */

import { useState, useRef, useCallback } from 'react';

/**
 * @returns {{ elapsed: number, start: Function, stop: Function, reset: Function }}
 */
export function useTimer() {
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef(null);

    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        stop();
        setElapsed(0);
    }, [stop]);

    const start = useCallback(() => {
        stop();
        setElapsed(0);
        intervalRef.current = setInterval(() => {
            setElapsed((s) => s + 1);
        }, 1000);
    }, [stop]);

    return { elapsed, start, stop, reset };
}

/**
 * Formats elapsed seconds as MM:SS.
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
}
