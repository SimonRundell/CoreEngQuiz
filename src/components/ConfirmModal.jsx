/**
 * useConfirm — Promise-based confirmation modal hook.
 *
 * Usage:
 *   const { confirmModal, confirm } = useConfirm();
 *
 *   // In JSX: {confirmModal}
 *   // In handlers: if (!await confirm('Sure?')) return;
 *   //              if (!await confirm('Delete?', 'Delete')) return;
 *
 * @module components/ConfirmModal
 * @license CC BY-NC-SA 4.0
 */

import { useState, useCallback } from 'react';

/**
 * @returns {{ confirmModal: JSX.Element|null, confirm: (message: string, confirmLabel?: string) => Promise<boolean> }}
 */
export function useConfirm() {
    const [state, setState] = useState({ open: false, message: '', label: 'Confirm', resolve: null });

    const confirm = useCallback((message, confirmLabel = 'Confirm') => {
        return new Promise((resolve) => {
            setState({ open: true, message, label: confirmLabel, resolve });
        });
    }, []);

    function close(result) {
        state.resolve(result);
        setState({ open: false, message: '', label: 'Confirm', resolve: null });
    }

    const confirmModal = state.open ? (
        <div
            className="confirm-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-msg"
            onClick={(e) => { if (e.target === e.currentTarget) close(false); }}
        >
            <div className="confirm-box">
                <p id="confirm-msg" className="confirm-message">{state.message}</p>
                <div className="confirm-actions">
                    <button type="button" className="btn-secondary" onClick={() => close(false)}>Cancel</button>
                    <button type="button" className="danger-btn"    onClick={() => close(true)}>{state.label}</button>
                </div>
            </div>
        </div>
    ) : null;

    return { confirmModal, confirm };
}
