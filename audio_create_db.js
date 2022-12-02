import fs from 'fs';
import clc from 'cli-color';
import { CLASSIFIED_AUDIO_PATH, extractDataFromWAV, getFFTanalysis } from './common.js';
const blue = clc.blueBright;
const red = clc.redBright;

const { version } = JSON.parse(fs.readFileSync('./package.json'));
const ts = new Date();
const TRAINING_LIMITS_FFT = {min: 8000, max: 11000};
const OUTPUT_TRAINING_DB_PATH = './fft_database.json';
const CHARSET_DB = [...'0123456789abcdefghijklmnopqrstuvwxyz'];
const ALL_SOUNDS_WAV = fs.readdirSync(CLASSIFIED_AUDIO_PATH).filter(s => s.endsWith('.wav'));

const db = {
    metadata: {
        version,
        generated: new Date(),
        duration: -1,
        charset: '',
        missing: ''
    },
    data: []
};

const statsRows = [['Character', 'WAV files count']];

CHARSET_DB.forEach(char => {
    const targetSounds = ALL_SOUNDS_WAV.filter(s => s.startsWith(char));
    if (!targetSounds.length) {
        console.log(red('CHARACTER "', char, '" HAS NO WAV TRAINING FILES, SKIPPING...'));
        db.metadata.missing += char;
        return;
    }
    console.log(blue('Character "', char, '" has', targetSounds.length, 'training wav files, processing...'));
    statsRows.push([char, targetSounds.length]);

    const fft_peaks = [];

    for (const sound of targetSounds) {
        const input = extractDataFromWAV(CLASSIFIED_AUDIO_PATH + sound);
        const output = getFFTanalysis(input);
        const targetPeaks = output.map((o,i) => [i,o]).sort((a, b) => b[1] - a[1]).filter(x => x[0] > TRAINING_LIMITS_FFT.min && x[0] < TRAINING_LIMITS_FFT.max) //.slice(0, 20);
        fft_peaks.push({source: sound, peaks: targetPeaks});
    }

    db.metadata.charset += char;
    db.data.push({
        char,
        fft_peaks
    });
});

const diffT = new Date() - ts;
console.log('Task finished in', diffT, 'ms');
db.metadata.duration = diffT;
const dbData = JSON.stringify(db, null, 2);
fs.writeFileSync(OUTPUT_TRAINING_DB_PATH, dbData);
console.log('Database saved as', OUTPUT_TRAINING_DB_PATH, ', size =', Math.round(dbData.length / 1024), 'kiB');
fs.writeFileSync('./charset_training_stats.csv', statsRows.map(r => r.join(';')).join('\n'));
