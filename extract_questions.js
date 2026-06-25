/**
 * Extracts quiz question data from the original HTML file and writes
 * a PHP seed array to api/seed/questions_data.php.
 *
 * Run once: node extract_questions.js
 */

const fs   = require('fs');
const path = require('path');

const htmlPath = 'C:/Users/SPR/OneDrive - Exeter College/exam_QC_needed_t18_updated.html';
const outPath  = path.join(__dirname, 'api/seed/questions_data.php');

const html = fs.readFileSync(htmlPath, 'utf8');

// Extract the quizzes object literal from the script block
const start = html.indexOf('const quizzes = {');
if (start === -1) throw new Error('Could not find quizzes object');

// Find matching closing brace
let depth = 0;
let i = html.indexOf('{', start);
const objStart = i;
for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
        depth--;
        if (depth === 0) break;
    }
}
const objEnd = i + 1;
const objSrc = html.slice(objStart, objEnd);

// Evaluate the object in a sandboxed way using Function
// eslint-disable-next-line no-new-func
const quizzes = new Function(`"use strict"; return (${objSrc})`)();

// Topic metadata — paper assignment derived from original HTML
const paperMap = {
    topic1: 2, topic2: 2, topic3: 2,
    topic4: 1, topic5: 1, topic6: 1, topic7: 1, topic8: 1, topic9: 1,
    topic10: 2, topic11: 2, topic12: 2, topic13: 2,
    topic14: 2, topic15: 2, topic16: 2, topic17: 2,
};

// Content corrections per scope document:
// Topic 7 tachometer: option 0 "Tachometer" -> "Oscilloscope"
// Topic 1 throughput: reword to ask total throughput
const CORRECTIONS = {
    topic7: {
        // "Which device measures rotational speed?" — option 0 was also "Tachometer"
        'Which device measures rotational speed?': {
            options: ['Oscilloscope', 'Stroboscope/Tachometer', 'Voltmeter', 'Caliper'],
            answer: 1,
        },
    },
    topic1: {
        // Throughput question — reword to total throughput
        'A small assembly line produces 1,200 units in 8 hours. What is the throughput per machine (3 machines) per minute?': {
            q: 'A small assembly line produces 1,200 units in 8 hours across 3 machines. What is the total line throughput per minute?',
            options: ['2.5 units/min', '4.17 units/min', '6.67 units/min', '0.83 units/min'],
            answer: 0,
        },
    },
};

// PHP output builder
let php = `<?php
/**
 * Seed data — all 17 topic question banks converted from the original HTML.
 *
 * Content corrections applied per QC notes:
 *  - Topic 1: throughput question reworded to ask for total line throughput.
 *  - Topic 7: tachometer question option 0 changed from "Tachometer" to
 *             "Oscilloscope" to remove duplicate-correct-answer ambiguity.
 *
 * @package TLevelQuiz\\Seed
 * @license CC BY-NC-SA 4.0
 */

return [\n`;

let topicSort = 0;
for (const [key, bank] of Object.entries(quizzes)) {
    topicSort++;
    const paper = paperMap[key] ?? 2;

    php += `    // ${bank.title}\n`;
    php += `    [\n`;
    php += `        'code'       => '${phpStr(key)}',\n`;
    php += `        'title'      => '${phpStr(bank.title)}',\n`;
    php += `        'paper'      => ${paper},\n`;
    php += `        'sort_order' => ${topicSort},\n`;
    php += `        'questions'  => [\n`;

    for (let q of bank.questions) {
        // Apply corrections if any
        const topicFix = CORRECTIONS[key];
        if (topicFix) {
            const qText = q.q;
            if (topicFix[qText]) {
                const fix = topicFix[qText];
                if (fix.q)       q = { ...q, q: fix.q };
                if (fix.options) q = { ...q, options: fix.options };
                if (fix.answer !== undefined) q = { ...q, answer: fix.answer };
            }
        }

        php += `            [\n`;
        php += `                'question_text' => '${phpStr(q.q)}',\n`;
        php += `                'option_a'      => '${phpStr(q.options[0])}',\n`;
        php += `                'option_b'      => '${phpStr(q.options[1])}',\n`;
        php += `                'option_c'      => '${phpStr(q.options[2])}',\n`;
        php += `                'option_d'      => '${phpStr(q.options[3])}',\n`;
        php += `                'correct_index' => ${q.answer},\n`;
        php += `            ],\n`;
    }

    php += `        ],\n`;
    php += `    ],\n`;
}

php += `];\n`;

fs.writeFileSync(outPath, php, 'utf8');
console.log(`Written ${outPath}`);

// Count questions
let total = 0;
for (const bank of Object.values(quizzes)) total += bank.questions.length;
console.log(`Topics: ${Object.keys(quizzes).length}, Questions: ${total}`);

function phpStr(s) {
    return String(s)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
}
