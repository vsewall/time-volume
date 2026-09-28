import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceScan,speedMultiplier,snapValue} from '../dist/controls.js';
test('1x traverses a six-second source in six seconds independent of render FPS',()=>{
 for(const fps of [7,24,30,60]){let state={position:-1,direction:1};for(let i=0;i<fps*6;i++)state=advanceScan(state.position,state.direction,1/fps,6,1);assert.ok(Math.abs(state.position-1)<1e-10);}
});
test('2x halves time; reflection preserves large frame overshoot',()=>{
 assert.equal(advanceScan(-1,1,3,6,2).position,1);
 const a=advanceScan(.8,1,1,6,1);assert.ok(Math.abs(a.position-.8666666667)<1e-8);assert.equal(a.direction,-1);
 const b=advanceScan(-1,1,30,6,1);assert.equal(b.position,1);
});
test('speed center is 1x, with a narrow magnet and fine escape',()=>{
 assert.equal(speedMultiplier(0),1);assert.equal(speedMultiplier(-2),.25);assert.equal(speedMultiplier(2),4);
 const o={anchor:0,threshold:.007};assert.equal(snapValue(.006,o),0);assert.equal(snapValue(.006,{...o,fine:true}),.006);
 for(const rate of [.99,1.01])assert.equal(snapValue(Math.log2(rate),o),Math.log2(rate));
});
test('Ctrl rounds angles to five degrees, while fine adjustments can leave zero',()=>{
 assert.equal(snapValue(13,{ctrl:true,angle:true}),15);assert.equal(snapValue(-13,{ctrl:true,angle:true}),-15);
 assert.equal(snapValue(.4,{anchor:0,threshold:.7}),0);assert.equal(snapValue(.1,{anchor:0,threshold:.7,fine:true}),.1);
});
import {bindRange} from '../dist/controls.js';
test('plain wheel leaves slider unchanged and scrollable; Ctrl adjusts angles by 5 degrees',()=>{
 const handlers={};const input={min:'-180',max:'180',step:'.1',value:'0',disabled:false,addEventListener:(name,handler)=>handlers[name]=handler};let changes=0,prevented=0;
 bindRange(input,{angle:true,onChange:()=>changes++});
 handlers.wheel({ctrlKey:false,deltaY:100,preventDefault:()=>prevented++});assert.equal(input.value,'0');assert.equal(changes,0);assert.equal(prevented,0);
 handlers.wheel({ctrlKey:true,deltaY:-100,preventDefault:()=>prevented++});assert.equal(input.value,'5');assert.equal(changes,1);assert.equal(prevented,1);
 input.disabled=true;handlers.wheel({ctrlKey:true,deltaY:-100,preventDefault:()=>prevented++});assert.equal(input.value,'5');
});
