/**
 * TipTap rich text editor with engineering-focused toolbar.
 *
 * Toolbar groups: history | text marks | super/subscript | inline code |
 *   block type | lists
 *
 * Uses onMouseDown+preventDefault on each toolbar button so the editor
 * never loses focus when the user clicks a toolbar control.
 *
 * @module components/RichTextEditor
 * @license CC BY-NC-SA 4.0
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit    from '@tiptap/starter-kit';
import Underline     from '@tiptap/extension-underline';
import Subscript     from '@tiptap/extension-subscript';
import Superscript   from '@tiptap/extension-superscript';

/** Toolbar definition — each inner array is a visual group separated by a divider. */
const GROUPS = [
    [
        { label: '⟲', title: 'Undo',        action: (e) => e.chain().focus().undo().run() },
        { label: '⟳', title: 'Redo',        action: (e) => e.chain().focus().redo().run() },
    ],
    [
        { label: 'B',   title: 'Bold',        action: (e) => e.chain().focus().toggleBold().run(),        isActive: (e) => e.isActive('bold') },
        { label: 'I',   title: 'Italic',      action: (e) => e.chain().focus().toggleItalic().run(),      isActive: (e) => e.isActive('italic') },
        { label: 'U',   title: 'Underline',   action: (e) => e.chain().focus().toggleUnderline().run(),   isActive: (e) => e.isActive('underline') },
        { label: 'S',   title: 'Strike',      action: (e) => e.chain().focus().toggleStrike().run(),      isActive: (e) => e.isActive('strike') },
    ],
    [
        { label: 'x²',  title: 'Superscript', action: (e) => e.chain().focus().toggleSuperscript().run(), isActive: (e) => e.isActive('superscript') },
        { label: 'x₂',  title: 'Subscript',   action: (e) => e.chain().focus().toggleSubscript().run(),  isActive: (e) => e.isActive('subscript') },
    ],
    [
        { label: '<>',  title: 'Code',        action: (e) => e.chain().focus().toggleCode().run(),        isActive: (e) => e.isActive('code') },
    ],
    [
        { label: '¶',   title: 'Paragraph',   action: (e) => e.chain().focus().setParagraph().run(),                          isActive: (e) => e.isActive('paragraph') },
        { label: 'H2',  title: 'Heading 2',   action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),             isActive: (e) => e.isActive('heading', { level: 2 }) },
        { label: 'H3',  title: 'Heading 3',   action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),             isActive: (e) => e.isActive('heading', { level: 3 }) },
    ],
    [
        { label: '•',   title: 'Bullet list',   action: (e) => e.chain().focus().toggleBulletList().run(),  isActive: (e) => e.isActive('bulletList') },
        { label: '1.',  title: 'Numbered list', action: (e) => e.chain().focus().toggleOrderedList().run(), isActive: (e) => e.isActive('orderedList') },
    ],
];

/**
 * @param {{ content: string, onChange: (html: string) => void }} props
 */
export default function RichTextEditor({ content, onChange }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [2, 3] } }),
            Underline,
            Subscript,
            Superscript,
        ],
        content: content || '',
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    if (!editor) return null;

    return (
        <div className="rich-editor">
            <div className="rich-toolbar" role="toolbar" aria-label="Text formatting">
                {GROUPS.map((group, gi) => (
                    <span key={gi} className="rich-toolbar-group">
                        {group.map(({ label, title, action, isActive }) => (
                            <button
                                key={title}
                                type="button"
                                title={title}
                                aria-label={title}
                                aria-pressed={isActive?.(editor) ?? false}
                                className={'rich-tb-btn' + (isActive?.(editor) ? ' active' : '')}
                                onMouseDown={(e) => { e.preventDefault(); action(editor); }}
                            >
                                {label}
                            </button>
                        ))}
                    </span>
                ))}
            </div>
            <EditorContent editor={editor} className="rich-editor-content" />
        </div>
    );
}
