import fs from 'fs';
import wav from 'node-wav';
import clc from 'cli-color';
import { getAudioParts, getFFTanalysis } from './common.js';
const blue = clc.blueBright;
const red = clc.redBright;
const grn = clc.greenBright;
const emph = clc.bgGreenBright;
const valid = clc.bgRed;
const COLORS = [clc.greenBright, clc.yellowBright, clc.cyanBright, clc.blueBright, clc.redBright];

const ts = new Date();
const OUTPUT_TRAINING_DB_PATH = './fft_database.json';
const TRAINING_LIMITS_FFT = {min: 8000, max: 11000};

const INPUT_FILE = process.argv[2];
if (!INPUT_FILE) {
    console.log(red('Usage: node audio_reverse_captcha.js <file_path>'));
    process.exit(-1);
}

console.log('Processing file', INPUT_FILE, '...');
let totalStr = '';
const dbRaw = fs.readFileSync(OUTPUT_TRAINING_DB_PATH);
const db = JSON.parse(dbRaw);
console.log('Loaded database,', Math.round(dbRaw.length / 1024 / 1024), 'MiB,', db.data.length, 'characters definitions, version', db.metadata.version, '(', db.metadata.generated, ')');
console.log('Available characters:', grn(db.metadata.charset));
console.log('Missing characters:', red(db.metadata.missing));

const wavData = wav.decode(fs.readFileSync(INPUT_FILE));
const audioData = Array.prototype.slice.call(wavData.channelData[0]);
const parts = getAudioParts(audioData);
console.log('Identified', parts.length, 'parts given audio file');

for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    console.log(blue('Working on part #' + i, '...'));
    console.log('Resampling data...');
    const resampled = resampleWav(audioData.slice(part[0], part[1]));
    console.log('Resampled', resampled.length, 'audio points');
    console.log('Extracting FFT points...');
    const output = getFFTanalysis(resampled);
    const filteredPeaks = output.map((o,i) => [i,o]).sort((a, b) => b[1] - a[1]).filter(x => x[0] > TRAINING_LIMITS_FFT.min && x[0] < TRAINING_LIMITS_FFT.max); //.slice(0, 20);
    console.log('Searching in database for distances...');
    const suggestions = seekDatabaseForSample(filteredPeaks);
    console.log(emph('Suggestions:'), ...suggestions.map((s, si) => COLORS[si](s.char)));
    totalStr += suggestions[0].char;
}

console.log(blue('Captcha resolved!', valid('" ' + totalStr + ' "')));

console.log('Task finished in', new Date() - ts, 'ms');

function seekDatabaseForSample(seekPeaks) {
    const distances = [];

    // convert array [freq, value] to 
    // object freq.value in order to drastically improve performances (x15)
    const mapSeekPeaks = seekPeaks.reduce((p, c) => (p[`${c[0]}`] = c[1], p), {});
    db.data.forEach(char => {
        char.fft_peaks.forEach(peaksObj => {
            let distFromChar = 0;
            const { peaks } = peaksObj;
            for (let i = 0; i < peaks.length; i++) {
                const [ cFreq, cLevel ] = peaks[i];
                const targetTuple = mapSeekPeaks[`${cFreq}`]; // seekPeaks.find(sp => sp[0] === cFreq);
                if (targetTuple === undefined) {
                    console.log(red('FATAL ERROR: CAN\'T FIND FREQUENCY', cFreq, 'FROM CHAR "', char.char, '" IN AUDIO SAMPLE'));
                    process.exit(-1);
                }
                const weight = (peaks.length - i) + 1;
                distFromChar += /*weight **/ Math.abs(cLevel - targetTuple);
            }
            distances.push({
                char: char.char, distance: distFromChar
            });
        });
    });

    distances.sort((a, b) => a.distance - b.distance);
    return distances.slice(0, 5);
}

function resampleWav(data) {
    const size = 16384; // getNearestPowerOfTwo(audioDataShort.length); //fft size
    //console.log(sound, '-> size:', audioDataShort.length, 'adjusted to', size);
    const audioData = data.concat(new Array(size - data.length).fill(0));
    const realInput = audioData.slice(0, size);
    return realInput;
}
