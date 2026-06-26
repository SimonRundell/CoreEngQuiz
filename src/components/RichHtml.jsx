/**
 * Renders stored rich-text HTML for student-facing views.
 *
 * Content is created by authenticated admins via TipTap, so
 * dangerouslySetInnerHTML is acceptable here.
 *
 * @module components/RichHtml
 * @license CC BY-NC-SA 4.0
 */

/**
 * @param {{ html: string, className?: string }} props
 */
export default function RichHtml({ html, className = '' }) {
    if (!html) return null;
    return (
        <div
            className={['rich-html', className].filter(Boolean).join(' ')}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
