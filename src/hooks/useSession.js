/**
 * Provides a stable anonymous session UUID.
 *
 * Generated once on first visit and persisted in localStorage as
 * `tlevel_session`. Used as the identifier for server-side score storage
 * without requiring student login.
 *
 * @module hooks/useSession
 * @license CC BY-NC-SA 4.0
 */

import { useState } from 'react';

const STORAGE_KEY = 'tlevel_session';

/**
 * Returns the session UUID, creating and storing it if it doesn't exist.
 *
 * @returns {string} UUID v4
 */
export function useSession() {
    const [sessionKey] = useState(() => {
        let key = localStorage.getItem(STORAGE_KEY);
        if (!key) {
            key = crypto.randomUUID();
            localStorage.setItem(STORAGE_KEY, key);
        }
        return key;
    });
    return sessionKey;
}
