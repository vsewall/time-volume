import {dot,cross,norm} from './math.js';
// A separate high-DPI vector overlay gives edges screen-space widths and native
// coverage antialiasing, independent of the volume preview's render resolution.
export class VolumeFrame{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.sample=document.createElement('canvas');this.sample.width=this.sample.height=12;this.sampleCtx=this.sample.getContext('2d',{willReadFrequently:true});this.color=[150,130,175];this.samples=0;}
 reset(){this.samples=0;}
 observe(source,live=false){const c=this.sampleCtx;c.drawImage(source,0,0,12,12);const data=c.getImageData(0,0,12,12).data;const sum=[0,0,0];for(let i=0;i<data.length;i+=4)for(let j=0;j<3;j++)sum[j]+=data[i+j];const avg=sum.map(x=>x/144);const weight=this.samples===0?1:live?.05:1/(this.samples+1);this.color=this.color.map((x,i)=>x+(avg[i]-x)*weight);this.samples++;}
 draw(renderer){const canvas=this.canvas,ctx=this.ctx,rect=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio,2);const w=rect.width,h=rect.height;if(!w||!h)return;if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);if(!renderer.count)return;
 const {yaw,pitch,distance,half}=renderer;const camera=[Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance],forward=norm(camera.map(x=>-x)),right=[Math.cos(yaw),0,-Math.sin(yaw)],up=cross(right,forward);const vertices=[];for(let i=0;i<8;i++)vertices.push(half.map((x,j)=>x*((i>>j)&1?1:-1)));
 const project=p=>{const v=p.map((x,i)=>x-camera[i]),z=dot(v,forward);return [w*.5+dot(v,right)/z*h/(2*.4142),h*.5-dot(v,up)/z*h/(2*.4142)];};
 const color=this.color.map(x=>Math.round(x*.88+24));ctx.strokeStyle=`rgb(${color.join(' ')})`;ctx.lineCap='round';ctx.lineJoin='round';
 const edges=[];for(let i=0;i<8;i++)for(let axis=0;axis<3;axis++){const j=i^(1<<axis);if(j<=i)continue;const fixed=[0,1,2].filter(k=>k!==axis);const front=fixed.some(k=>camera[k]*vertices[i][k]>half[k]*half[k]);edges.push({a:project(vertices[i]),b:project(vertices[j]),front});}
 // Back edges first; restrained opacity keeps them behind the readable content.
 edges.sort((a,b)=>Number(a.front)-Number(b.front));for(const edge of edges){ctx.globalAlpha=edge.front?.34:.105;ctx.lineWidth=edge.front?.8:.65;ctx.beginPath();ctx.moveTo(...edge.a);ctx.lineTo(...edge.b);ctx.stroke();}ctx.globalAlpha=1;
 }
}
