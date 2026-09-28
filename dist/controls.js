export const speedMultiplier=value=>2**value;
export function snapValue(value,{anchor,threshold=0,ctrl=false,angle=false,fine=false}){
 if(ctrl&&angle)return Math.round(value/5)*5;
 return !fine&&anchor!==undefined&&Math.abs(value-anchor)<=threshold?anchor:value;
}
// Reflect at the endpoints without losing elapsed time, even after a slow frame.
export function advanceScan(position,direction,elapsed,duration,rate){
 const travel=(direction>0?position+1:3-position)+2*elapsed*rate/Math.max(.001,duration);
 const phase=((travel%4)+4)%4;
 return phase<2?{position:phase-1,direction:1}:{position:3-phase,direction:-1};
}
let ctrl=false;
if(typeof document!=='undefined'){
 document.addEventListener('keydown',e=>ctrl=e.ctrlKey);
 document.addEventListener('keyup',e=>ctrl=e.ctrlKey);
 document.addEventListener('pointerdown',e=>ctrl=e.ctrlKey,true);
 document.addEventListener('pointermove',e=>ctrl=e.ctrlKey,true);
 window.addEventListener('blur',()=>ctrl=false);
}
export function bindRange(input,{anchor,threshold=0,angle=false,onChange}){
 const min=Number(input.min),max=Number(input.max),step=Number(input.step);
 const apply=(raw,options={})=>{const value=snapValue(raw,{anchor,threshold,angle,ctrl,...options});input.value=String(Math.max(min,Math.min(max,value)));onChange(Number(input.value));};
 input.addEventListener('input',()=>apply(Number(input.value)));
 // Plain wheel always scrolls the inspector, including over a focused range.
 input.addEventListener('wheel',e=>{if(!e.ctrlKey||input.disabled)return;e.preventDefault();ctrl=true;const delta=angle?5:step;apply(Number(input.value)+(e.deltaY<0?delta:-delta),{fine:!angle});},{passive:false});
 input.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
  e.preventDefault();ctrl=e.ctrlKey;const delta=angle&&ctrl?5:step;
  const raw=e.key==='Home'?min:e.key==='End'?max:Number(input.value)+(['ArrowRight','ArrowUp'].includes(e.key)?delta:-delta);
  apply(raw,{fine:!ctrl});
 });
}
