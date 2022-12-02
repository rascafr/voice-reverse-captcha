import fs from 'fs';
import { INPUT_AUDIO_PATH } from './common.js';

const sounds = fs.readdirSync(INPUT_AUDIO_PATH).filter(i => i.endsWith('.wav'));
const allChars = sounds.map(str => [...str.replace('.wav', '')]).flat();
const e = [...new Set(allChars)].sort();

console.log(e.join(), e.length);

const total_required = '0123456789abcdefghijklmnopqrstuvwxyz';
const freq = [...total_required].map(char => {
    const targets = allChars.filter(f => f === char);
    return {char, count: targets.length};
}).sort((a, b) => b.count - a.count);

console.log(freq);