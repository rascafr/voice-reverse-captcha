import fs from 'fs';
import { plot } from 'nodeplotlib';
import { CLASSIFIED_AUDIO_PATH, extractDataFromWAV, getFFTanalysis } from './common.js';

const sounds = fs.readdirSync(CLASSIFIED_AUDIO_PATH).filter(i => i.startsWith('c') && i.endsWith('.wav'));

const wavPlots = [];
const fftPlots = [];

let offset = (sounds.length - 1);
for (const sound of sounds) {
    const input = extractDataFromWAV(CLASSIFIED_AUDIO_PATH + sound);
    const output = getFFTanalysis(input);

    let x =[];
    for(let i=0;i<input.length;i++) x.push(i); //create a simple dumb x axis for the fft plot

    wavPlots.push({
        x: x,
        y: input.map(y => y + offset),
        type: 'line',
        name: 'sound "' + sound.split('.')[0] + '"',
        showlegend: true
    });

    fftPlots.push({
        x: x,
        y: output.map(y => y + offset * 500),
        type: 'line',
        name: 'FFT sound "' + sound.split('.')[0] + '"',
        showlegend: true
    });

    offset--;
}


plot(
    wavPlots,
    {
        title: 'WAV input',
    }
);

plot(
    fftPlots,
    {
        title: 'FFT analysis',
    }
);
