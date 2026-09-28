import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nextFrameDeadline,createCapture} from '../dist/recording.js';
test('30 fps cadence survives 60 Hz rAF jitter without falling to 20 fps',()=>{
 let deadline=0,frames=0;for(let i=0;i<600;i++){const now=i*1000/60+(i%3)*.15;if(now>=deadline){frames++;deadline=nextFrameDeadline(deadline,now);}}
 assert.ok(frames>=299&&frames<=301,`${frames} frames`);
 assert.ok(nextFrameDeadline(100,1000)>1000);
});
test('capture requests only completed frames, with an automatic fallback',()=>{
 let requests=0;const rates=[];const track={requestFrame(){requests++;},stop(){}};
 const capture=createCapture({captureStream(rate){rates.push(rate);return {getVideoTracks:()=>[track],getTracks:()=>[track]};}});
 assert.deepEqual(rates,[0]);assert.equal(requests,0);capture.request();assert.equal(requests,1);
 let stopped=0;const fallback=createCapture({captureStream(rate){rates.push(rate);return {getVideoTracks:()=>[{}],getTracks:()=>[{stop(){stopped++;}}]};}});
 assert.equal(fallback.manual,false);assert.equal(stopped,1);assert.deepEqual(rates,[0,0,30]);fallback.request();
});
