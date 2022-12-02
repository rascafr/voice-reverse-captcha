import fetch from 'node-fetch';
import fs from 'fs';
import { INPUT_AUDIO_PATH } from './common';

for (let i=0;i<20;i++) {
    const response = await fetch('https://teleservices.paris.fr/rdvtitres/JCaptchaSound');
    const data = await response.arrayBuffer();
    const buffer = Buffer.from(data);
    const rid = Math.round(Math.random() * 1000) + 1000;
    fs.writeFileSync(`${INPUT_AUDIO_PATH}${i}-${rid}.wav`, buffer);
}
