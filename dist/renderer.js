import {basis,extent,cross,norm,outputSpan,outputDimensions} from './math.js';
const vertex=`#version 300 es
out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0,1);}`;
const common=`
precision highp float;precision highp sampler3D;
in vec2 uv;out vec4 frag;
uniform sampler3D videoTex;uniform vec3 halfBox;uniform mat3 plane;uniform float offset;
uniform int effect;uniform float amplitude,frequency,phase,decay,waveAngle;uniform vec2 center;
uniform float count,capacity,head;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float deform(vec2 p){if(effect==0)return 0.;float angle=radians(waveAngle);if(effect==1)return amplitude*sin(dot(p,vec2(sin(angle),cos(angle)))*frequency*3.14159265+phase);if(effect==2)return amplitude*(2.*noise(p*frequency+vec2(cos(phase),sin(phase))*.8)-1.);float r=length(p-center);return amplitude*sin(r*frequency*3.14159265-phase)*exp(-r*decay);}
float field(vec3 p){vec3 q=transpose(plane)*p;return q.z-offset-deform(q.xy);}
bool inside(vec3 p){return all(lessThanEqual(abs(p),halfBox+0.00001));}
vec3 sampleVideo(vec3 p){vec3 tc=p/(2.*halfBox)+.5;float f=clamp(tc.z,0.,1.)*max(0.,count-1.);float a=floor(f),b=min(a+1.,count-1.);float ia=mod(head+a,capacity),ib=mod(head+b,capacity);vec3 ca=texture(videoTex,vec3(tc.xy,(ia+.5)/capacity)).rgb;vec3 cb=texture(videoTex,vec3(tc.xy,(ib+.5)/capacity)).rgb;return mix(ca,cb,fract(f));}
`;
const outputShader=`#version 300 es
${common}
uniform vec2 span;
void main(){vec2 q=(uv-.5)*span;vec3 p=plane*vec3(q,offset+deform(q));frag=vec4(inside(p)?sampleVideo(p):vec3(.012,.017,.019),1);}`;
const volumeShader=`#version 300 es
${common}
uniform vec3 camera,right,up,forward;uniform float viewAR,tanFov,density;uniform int layers,clipMode;
void over(inout vec4 acc,vec3 c,float a){acc.rgb+=(1.-acc.a)*c*a;acc.a+=(1.-acc.a)*a;}
void main(){vec2 screen=uv*2.-1.;vec3 rd=normalize(forward+right*screen.x*viewAR*tanFov+up*screen.y*tanFov);
vec3 inv=1./(rd+vec3(1e-8));vec3 t0=(-halfBox-camera)*inv,t1=(halfBox-camera)*inv;vec3 mn=min(t0,t1),mx=max(t0,t1);float enter=max(0.,max(mn.x,max(mn.y,mn.z))),leave=min(mx.x,min(mx.y,mx.z));
vec3 bg=mix(vec3(.018,.025,.029),vec3(.065,.083,.092),exp(-dot(screen,screen)*.9));if(enter>leave){frag=vec4(bg,1);return;}
float hit=-1.;
if(effect==0){float denom=dot(plane[2],rd);if(abs(denom)>1e-6){float t=(offset-dot(plane[2],camera))/denom;if(t>=enter&&t<=leave)hit=t;}}
else{float prevT=enter,prev=field(camera+rd*enter);for(int i=1;i<=128;i++){float t=mix(enter,leave,float(i)/128.);float f=field(camera+rd*t);if(f*prev<=0.){float a=prevT,b=t;for(int j=0;j<7;j++){float m=(a+b)*.5;float fm=field(camera+rd*m);if(fm*prev<=0.)b=m;else a=m;}hit=(a+b)*.5;break;}prev=f;prevT=t;}}
vec4 acc=vec4(0);bool drawn=false;
// One bounded volume integration at every angle. Switching between frame
// intersections and ray samples near rd.z == 0 caused a camera-following band.
float stepLength=(leave-enter)/128.;
for(int i=0;i<128;i++){float t=enter+(float(i)+.5)*stepLength;
if(!drawn&&hit>=0.&&hit<=t){over(acc,sampleVideo(camera+rd*hit),.97);drawn=true;}
vec3 p=camera+rd*t;float side=field(p);if((clipMode==1&&side>0.)||(clipMode==2&&side<0.))continue;
// Frame bands are fixed in object/time coordinates, never camera coordinates.
float layer=clamp(floor((p.z/(2.*halfBox.z)+.5)*float(layers)),0.,float(layers-1));
p.z=((layer+.5)/float(layers)-.5)*2.*halfBox.z;
vec3 c=sampleVideo(p);float lum=dot(c,vec3(.2126,.7152,.0722));float a=1.-exp(-density*(.32+.68*lum)*stepLength/(2.*halfBox.z));over(acc,c,a);
}
if(!drawn&&hit>=0.)over(acc,sampleVideo(camera+rd*hit),.97);
vec3 col=acc.rgb+(1.-acc.a)*bg;frag=vec4(col,1);}`;
function program(gl,vs,fs){const p=gl.createProgram();for(const[type,src]of[[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);gl.deleteShader(s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
export class Renderer{
 constructor(canvas,output){this.canvas=canvas;this.output=output;this.gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});if(!this.gl)throw Error('WebGL 2 and hardware acceleration are required.');const g=this.gl;this.volumeProgram=program(g,vertex,volumeShader);this.outputProgram=program(g,vertex,outputShader);this.vao=g.createVertexArray();g.bindVertexArray(this.vao);this.uniforms=new Map();this.out2d=output.getContext('2d',{alpha:false});this.fbo=g.createFramebuffer();this.outTexture=g.createTexture();this.half=[1,.5625,.85];this.count=0;this.head=0;this.capacity=1;this.readback=null;this.yaw=.62;this.pitch=.20;this.distance=4.2;this.resizeOutput(960,540);}
 alloc(w,h,n){const g=this.gl;const max=g.getParameter(g.MAX_3D_TEXTURE_SIZE);if(Math.max(w,h,n)>max)throw Error('The volume exceeds this browser’s 3D texture limit. Choose a smaller buffer.');if(this.tex)g.deleteTexture(this.tex);this.tex=g.createTexture();g.bindTexture(g.TEXTURE_3D,this.tex);g.texStorage3D(g.TEXTURE_3D,1,g.RGBA8,w,h,n);for(const key of[g.TEXTURE_MIN_FILTER,g.TEXTURE_MAG_FILTER])g.texParameteri(g.TEXTURE_3D,key,g.LINEAR);for(const key of[g.TEXTURE_WRAP_S,g.TEXTURE_WRAP_T,g.TEXTURE_WRAP_R])g.texParameteri(g.TEXTURE_3D,key,g.CLAMP_TO_EDGE);if(g.getError()!==g.NO_ERROR)throw Error('GPU allocation failed. Choose a smaller frame buffer.');this.w=w;this.h=h;this.capacity=n;this.count=0;this.head=0;this.half=[w/Math.max(w,h),h/Math.max(w,h),.85];}
 upload(canvas,index){const g=this.gl;g.bindTexture(g.TEXTURE_3D,this.tex);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);g.texSubImage3D(g.TEXTURE_3D,0,0,0,index,this.w,this.h,1,g.RGBA,g.UNSIGNED_BYTE,canvas);if(g.getError()!==g.NO_ERROR)throw Error('Could not upload a frame to the GPU.');}
 resizeOutput(w,h){if(this.output.width===w&&this.output.height===h&&this.ow)return;this.output.width=w;this.output.height=h;this.ow=w;this.oh=h;const g=this.gl;g.bindTexture(g.TEXTURE_2D,this.outTexture);g.texImage2D(g.TEXTURE_2D,0,g.RGBA8,w,h,0,g.RGBA,g.UNSIGNED_BYTE,null);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.bindFramebuffer(g.FRAMEBUFFER,this.fbo);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.outTexture,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Output framebuffer unavailable');g.bindFramebuffer(g.FRAMEBUFFER,null);this.readback=new Uint8Array(w*h*4);this.imageData=new ImageData(w,h);}
 u(p,name,type,...v){const g=this.gl;let map=this.uniforms.get(p);if(!map){map={};this.uniforms.set(p,map);}const loc=map[name]??(map[name]=g.getUniformLocation(p,name));g[type](loc,...v);}
 setup(p,s,b,ex){const g=this.gl;g.useProgram(p);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_3D,this.tex);this.u(p,'videoTex','uniform1i',0);this.u(p,'halfBox','uniform3fv',this.half);this.u(p,'plane','uniformMatrix3fv',false,b);this.u(p,'offset','uniform1f',s.position*ex[2]);this.u(p,'effect','uniform1i',s.effect);for(const name of['amplitude','frequency','phase','decay','waveAngle'])this.u(p,name,'uniform1f',name==='phase'?s[name]*Math.PI*2:(s[name]??0));this.u(p,'center','uniform2f',s.centerX,s.centerY);for(const name of['count','capacity','head'])this.u(p,name,'uniform1f',this[name]);}
 render(s,{volume=true,output=true,locked=false}={}){if(!this.count)return;const g=this.gl;this.half[2]=s.depth;const b=basis(s.rx,s.ry,s.rz),ex=extent(b,this.half);const sourceAR=this.w/this.h;let ar=s.outputAR==='source'?sourceAR:s.outputAR==='slice'?ex[0]/ex[1]:Number(s.outputAR);if(locked)ar=this.ow/this.oh;const dims=outputDimensions(ar,s.outputRes);if(!locked)this.resizeOutput(...dims);g.bindVertexArray(this.vao);
 if(output){g.bindFramebuffer(g.FRAMEBUFFER,this.fbo);g.viewport(0,0,this.ow,this.oh);this.setup(this.outputProgram,s,b,ex);this.u(this.outputProgram,'span','uniform2fv',outputSpan(ex,this.ow/this.oh,s.fit,this.half,s.zoom));g.drawArrays(g.TRIANGLES,0,3);g.readPixels(0,0,this.ow,this.oh,g.RGBA,g.UNSIGNED_BYTE,this.readback);const row=this.ow*4;for(let y=0;y<this.oh;y++)this.imageData.data.set(this.readback.subarray(y*row,(y+1)*row),(this.oh-1-y)*row);this.out2d.putImageData(this.imageData,0,0);}
 if(volume){const rect=this.canvas.getBoundingClientRect();const scale=Math.min(devicePixelRatio,1.5)*s.renderQuality;const w=Math.max(2,Math.round(rect.width*scale)),h=Math.max(2,Math.round(rect.height*scale));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}g.bindFramebuffer(g.FRAMEBUFFER,null);g.viewport(0,0,w,h);this.setup(this.volumeProgram,s,b,ex);const ro=[Math.sin(this.yaw)*Math.cos(this.pitch)*this.distance,Math.sin(this.pitch)*this.distance,Math.cos(this.yaw)*Math.cos(this.pitch)*this.distance];const f=norm(ro.map(v=>-v)),r=[Math.cos(this.yaw),0,-Math.sin(this.yaw)],u=cross(r,f);for(const[name,val]of[['camera',ro],['forward',f],['right',r],['up',u]])this.u(this.volumeProgram,name,'uniform3fv',val);this.u(this.volumeProgram,'viewAR','uniform1f',w/h);this.u(this.volumeProgram,'tanFov','uniform1f',.4142);this.u(this.volumeProgram,'density','uniform1f',s.density);this.u(this.volumeProgram,'layers','uniform1i',s.layers);this.u(this.volumeProgram,'clipMode','uniform1i',s.clip);g.drawArrays(g.TRIANGLES,0,3);}
 return {b,ex};}
}

