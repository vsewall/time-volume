// Prefer AVC for interoperable MP4 playback. Never disguise a WebM as MP4.
export function mp4Type(Recorder=globalThis.MediaRecorder){
 if(!Recorder?.isTypeSupported)return null;
 return ['video/mp4;codecs=avc1','video/mp4;codecs=avc1.420033','video/mp4'].find(m=>Recorder.isTypeSupported(m))??null;
}

// Keep the target cadence instead of restarting the interval on each rAF.
// Skip overdue slots, never burst stale frames to catch up.
export function nextFrameDeadline(previous,now,interval=1000/30){
 return previous>0?previous+(Math.floor(Math.max(0,now-previous)/interval)+1)*interval:now+interval;
}
export function createCapture(canvas){
 let stream=canvas.captureStream(0),track=stream.getVideoTracks()[0];
 const manual=typeof track?.requestFrame==='function';
 if(!manual){stream.getTracks().forEach(t=>t.stop());stream=canvas.captureStream(30);track=stream.getVideoTracks()[0];}
 return {stream,manual,request(){if(manual)track.requestFrame();}};
}
