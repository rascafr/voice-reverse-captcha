import fs from 'fs';
import wav from 'node-wav';
import { CLASSIFIED_AUDIO_PATH, getAudioParts, INPUT_AUDIO_PATH, UNCLASSIFIED_AUDIO_PATH } from './common.js';

const sounds = fs.readdirSync(INPUT_AUDIO_PATH).filter(i => i.endsWith('.wav'));

for (const sound of sounds) {
    const wavData = wav.decode(fs.readFileSync(INPUT_AUDIO_PATH + sound));
    const audioData = Array.prototype.slice.call(wavData.channelData[0]);

    const parts = getAudioParts(audioData);
    console.log('Found', parts.length, 'audio parts in WAV file');

    const fileAlphaName = sound.split('.')[0];
    const canSuggest = parts.length === fileAlphaName.length;

    parts.forEach((part, index) => {
        const subData = audioData.slice(part[0], part[1]);
        const fileName = !canSuggest ?
            UNCLASSIFIED_AUDIO_PATH + fileAlphaName + '-' + index + '.wav' :
            CLASSIFIED_AUDIO_PATH + fileAlphaName.charAt(index) + '-' + Math.round(Math.random() * 1000 + 1000) + '.wav';
        fs.writeFileSync(fileName, wav.encode([subData], { sampleRate: wavData.sampleRate }));
    });
}
