/**
 * Admin topic management page.
 *
 * Topics are reordered by dragging the handle in the first column.
 * The drag-end handler persists the new sort_order values via PATCH.
 * Sort order is never shown as an editable field.
 *
 * @module pages/admin/TopicManager
 * @license CC BY-NC-SA 4.0
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS }                    from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import client from '../../api/client';

const BLANK = { code: '', title: '', paper: 1 };

/**
 * A single sortable table row.
 * In edit mode the drag handle is disabled; otherwise listeners are
 * attached only to the handle so clicking other cells never triggers a drag.
 *
 * @param {{ topic, editing, onEditStart, onSave, onCancel, updateField }} props
 */
function SortableRow({ topic, editing, onEditStart, onSave, onCancel, updateField }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: topic.id });

    const style = {
        transform:  CSS.Transform.toString(transform),
        transition,
        opacity:    isDragging ? 0.45 : 1,
        zIndex:     isDragging ? 1    : undefined,
        position:   'relative',
    };

    if (editing) {
        return (
            <tr ref={setNodeRef} style={style}>
                <td className="drag-handle-cell">
                    <span className="drag-handle drag-handle--disabled" aria-hidden="true">⠿</span>
                </td>
                <td>{topic.code}</td>
                <td>
                    <input
                        className="tbl-input"
                        value={topic.title}
                        onChange={(e) => updateField(topic.id, 'title', e.target.value)}
                    />
                </td>
                <td>
                    <select className="tbl-select" value={topic.paper}
                        onChange={(e) => updateField(topic.id, 'paper', e.target.value)}>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                    </select>
                </td>
                <td>
                    <select className="tbl-select" value={topic.active}
                        onChange={(e) => updateField(topic.id, 'active', e.target.value)}>
                        <option value={1}>Yes</option>
                        <option value={0}>No</option>
                    </select>
                </td>
                <td>{topic.question_count}</td>
                <td className="topic-actions">
                    <button type="button" className="btn-save" onClick={() => onSave(topic)}>Save</button>
                    <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
                </td>
            </tr>
        );
    }

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={!topic.active ? 'inactive-row' : ''}
            {...attributes}
        >
            <td className="drag-handle-cell">
                <button
                    type="button"
                    className="drag-handle"
                    {...listeners}
                    aria-label="Drag to reorder"
                >
                    ⠿
                </button>
            </td>
            <td>{topic.code}</td>
            <td>{topic.title}</td>
            <td>{topic.paper}</td>
            <td>{topic.active ? 'Yes' : 'No'}</td>
            <td>{topic.question_count}</td>
            <td className="topic-actions">
                <button
                    type="button"
                    className="btn-edit"
                    onClick={() => onEditStart(topic.id)}
                    aria-label="Edit topic"
                >
                    &#9998;
                </button>
            </td>
        </tr>
    );
}

export default function TopicManager() {
    const [topics,  setTopics]  = useState([]);
    const [editing, setEditing] = useState(null);
    const [newForm, setNewForm] = useState(BLANK);
    const [error,   setError]   = useState('');
    const navigate = useNavigate();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    function load() {
        client.get('/admin/topics.php')
            .then((r) => setTopics(r.data))
            .catch((err) => { if (err.response?.status === 401) navigate('/admin/login'); });
    }

    useEffect(load, [navigate]);

    async function saveEdit(t) {
        await client.put(`/admin/topics.php?id=${t.id}`, {
            title:      t.title,
            paper:      Number(t.paper),
            sort_order: Number(t.sort_order),
            active:     Number(t.active),
        }).catch(() => setError('Save failed'));
        setEditing(null);
        load();
    }

    async function createTopic() {
        if (!newForm.code || !newForm.title) { setError('Code and title required'); return; }
        await client.post('/admin/topics.php', {
            code:  newForm.code,
            title: newForm.title,
            paper: Number(newForm.paper),
        }).catch(() => setError('Create failed'));
        setNewForm(BLANK);
        load();
    }

    function updateField(id, field, value) {
        setTopics((ts) => ts.map((t) => t.id === id ? { ...t, [field]: value } : t));
    }

    async function handleDragEnd({ active, over }) {
        if (!over || active.id === over.id) return;

        const oldIndex = topics.findIndex((t) => t.id === active.id);
        const newIndex = topics.findIndex((t) => t.id === over.id);
        const reordered = arrayMove(topics, oldIndex, newIndex);

        setTopics(reordered);

        const order = reordered.map((t, i) => ({ id: t.id, sort_order: i + 1 }));
        try {
            await client.patch('/admin/topics.php', { order });
        } catch {
            setError('Reorder save failed — reloading');
            load();
        }
    }

    return (
        <div className="admin-topics">
            <h1>Topic Manager</h1>
            {error && <p className="form-error">{error}</p>}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
            >
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th className="drag-handle-cell"></th>
                            <th>Code</th><th>Title</th><th>Paper</th>
                            <th>Active</th><th>Questions</th><th></th>
                        </tr>
                    </thead>
                    <SortableContext
                        items={topics.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <tbody>
                            {topics.map((t) => (
                                <SortableRow
                                    key={t.id}
                                    topic={t}
                                    editing={editing === t.id}
                                    onEditStart={(id) => setEditing(id)}
                                    onSave={saveEdit}
                                    onCancel={() => setEditing(null)}
                                    updateField={updateField}
                                />
                            ))}
                        </tbody>
                    </SortableContext>
                </table>
            </DndContext>

            <section className="new-topic">
                <h2>Add New Topic</h2>
                <div className="new-topic-form">
                    <label>Code
                        <input value={newForm.code} onChange={(e) => setNewForm((f) => ({ ...f, code: e.target.value }))} />
                    </label>
                    <label>Title
                        <input value={newForm.title} onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))} />
                    </label>
                    <label>Paper
                        <select value={newForm.paper} onChange={(e) => setNewForm((f) => ({ ...f, paper: e.target.value }))}>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                        </select>
                    </label>
                    <button type="button" onClick={createTopic}>Add Topic</button>
                </div>
            </section>
        </div>
    );
}
