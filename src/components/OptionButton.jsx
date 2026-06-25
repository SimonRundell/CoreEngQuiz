/**
 * Single answer-option button.
 *
 * Visual state:
 *   - default  : plain clickable
 *   - selected : outlined (exam mode, pre-reveal)
 *   - correct  : green highlight
 *   - incorrect: red highlight
 *
 * @module components/OptionButton
 * @license CC BY-NC-SA 4.0
 */

const LABELS = ['A', 'B', 'C', 'D'];

/**
 * @param {{
 *   index: number,
 *   text: string,
 *   disabled: boolean,
 *   isChosen: boolean,
 *   isCorrect: boolean,
 *   revealed: boolean,
 *   onClick: Function
 * }} props
 */
export default function OptionButton({ index, text, disabled, isChosen, isCorrect, revealed, onClick }) {
    let cls = 'option-btn';
    if (revealed) {
        if (isCorrect)        cls += ' correct';
        else if (isChosen)    cls += ' incorrect';
    } else if (isChosen) {
        cls += ' selected';
    }

    return (
        <button className={cls} onClick={onClick} disabled={disabled} type="button">
            <span className="option-label">{LABELS[index]}</span>
            {text}
        </button>
    );
}
