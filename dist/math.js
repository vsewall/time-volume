export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=a=>{const n=Math.hypot(...a);return a.map(x=>x/n);};
export function basis(rx,ry,rz){const [x,y,z]=[rx,ry,rz].map(v=>v*Math.PI/180);const cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);return [cz*cy,sz*cy,-sy,cz*sy*sx-sz*cx,sz*sy*sx+cz*cx,cy*sx,cz*sy*cx+sz*sx,sz*sy*cx-cz*sx,cy*cx];}
export function extent(b,h){return [0,1,2].map(j=>h.reduce((s,x,i)=>s+Math.abs(b[j*3+i])*x,0));}
export function dimensions(width,height,longEdge){const scale=Math.min(1,longEdge/Math.max(width,height));return [Math.max(2,Math.round(width*scale)),Math.max(2,Math.round(height*scale))];}
export function outputDimensions(ar,longEdge){return ar>=1?[longEdge,Math.max(2,Math.round(longEdge/ar/2)*2)]:[Math.max(2,Math.round(longEdge*ar/2)*2),longEdge];}
export function outputSpan(ext,ar,mode,half,zoom=1){let w=ext[0]*2,h=ext[1]*2;if(mode==='fixed'){w=half[0]*2;h=half[1]*2;}if((w/h<ar)===(mode!=='fill'))w=h*ar;else h=w/ar;return[w/zoom,h/zoom];}
