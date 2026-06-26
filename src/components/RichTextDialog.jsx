/**
 * Modal dialog wrapping the RichTextEditor.
 *
 * Opens above all other content; closes on Escape or overlay click.
 * The caller receives the final HTML only when the user explicitly
 * clicks Save, so cancelled edits are never propagated.
 *
 * @module components/RichTextDialog
 * @license CC BY-NC-SA 4.0
 */

import { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';

/**
 * @param {{
 *   label:   string,
 *   value:   string,
 *   onSave:  (html: string) => void,
 *   onClose: () => void,
 * }} props
 */
export default function RichTextDialog({ label, value, onSave, onClose }) {
    const [html, setHtml] = useState(value || '');

    useEffect(() => {
        function onKey(e) { if (e.key === 'Escape') onClose(); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="rich-dialog-overlay" onClick={onClose}>
            <div className="rich-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Edit ${label}`}>
                <div className="rich-dialog-header">
                    <h3>{label}</h3>
                    <button className="rich-dialog-close" type="button" onClick={onClose} aria-label="Close dialog">&#xD7;</button>
                </div>
                <div className="rich-dialog-body">
                    <RichTextEditor content={value} onChange={setHtml} />
                </div>
                <div className="rich-dialog-footer">
                    <button type="button" className="save-btn" onClick={() => onSave(html)}>Save</button>
                    <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
}
