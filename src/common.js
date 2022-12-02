import wav from 'node-wav';
import FFT from 'fft.js';
import fs from 'fs';

export const CLASSIFIED_AUDIO_PATH = `../output_audio_clips/classified/`;
export const UNCLASSIFIED_AUDIO_PATH = `../output_audio_clips/`;
export const INPUT_AUDIO_PATH = `../input_audios/`;

export function getNearestPowerOfTwo(x) {
    const isPow2 = (n) => (n !== 0) && (n & (n - 1)) === 0;
    while (!isPow2(x)) x++;
    return x;
}

export function extractDataFromWAV(sound) {
    const wavData = wav.decode(fs.readFileSync(sound));
    const audioDataShort = Array.prototype.slice.call(wavData.channelData[0]);
    const size = 16384; // getNearestPowerOfTwo(audioDataShort.length); //fft size
    //console.log(sound, '-> size:', audioDataShort.length, 'adjusted to', size);
    const audioData = audioDataShort.concat(new Array(size - audioDataShort.length).fill(0));
    const realInput = audioData.slice(0, size);
    return realInput;
}

export function getFFTanalysis(input) {
    const fft = new FFT(input.length); //create fft object
    const realOutput = new Array(input.length); // to store final result
    const complexOutput = fft.createComplexArray(); // to store fft output
    fft.realTransform(complexOutput, input); // compute fft
    // fft.completeSpectrum(complexOutput);
    fft.fromComplexArray(complexOutput, realOutput); // get rid of the complex value and keep only real
    return realOutput;
}

export function getAudioAverage(audioData) {
    return audioData.reduce((p, c) => p + c, 0) / audioData.length;
}

export function getAudioMax(audioData) {
    let max = 0;
    for (let i=0;i<audioData.length;i++) if (audioData[i] > max) max = audioData[i];
    return max;
}

export function getAudioMin(audioData) {
    let min = 0;
    for (let i=0;i<audioData.length;i++) if (audioData[i] < min) min = audioData[i];
    return min;
}

export function getSquared(audioData) {
    let dValue = 0;
    const DIODE_RC_TAU = 0.9999;
    return audioData.map(v => {
        if (v > dValue) dValue = v;
        else if (dValue > 0) dValue *= DIODE_RC_TAU;
        return dValue;
    });
}

// returns [[startIndex, endIndex], [start, end], ...]
export function getAudioParts(audioData) {
    const squaredData = getSquared(audioData);
    const avg = getAudioAverage(audioData);
    const max = getAudioMax(audioData);
    const min = getAudioMin(audioData);
    const THRESHOLD_LEVEL = 0.5;
    const thresH = max * THRESHOLD_LEVEL; //(max - avg) / 5 + avg;
    const thresL = (max - avg) * 0.4 + avg; //min * THRESHOLD_LEVEL;

    console.log('Waveform stats:', 'thresH='+thresH, 'thresL='+thresL, 'avg='+avg);

    const parts = [];
    let hasFoundEdge = false;
    let currentStartPart = 0;

    for (let i=0;i<squaredData.length;i++) {
        if (!hasFoundEdge && squaredData[i] > thresH) {
            hasFoundEdge = true;
            currentStartPart = i;
        }

        else if (hasFoundEdge && squaredData[i] < thresL) {
            hasFoundEdge = false;
            parts.push([currentStartPart, i]);
        }
    }

    const minSamplesSplit = 4000;
    parts.forEach((part, pi) => {
        if (pi > 0) {
            if (part[0] - parts[pi - 1][1] < minSamplesSplit) {
                part[0] = parts[pi - 1][0];
                parts[pi - 1].push(-1); // ugly flag delete
            }
        }
    })

    return parts.filter(p => p.length === 2);
}
