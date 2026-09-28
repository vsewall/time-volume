// Prefer AVC for interoperable MP4 playback. Never disguise a WebM as MP4.
export function mp4Type(Recorder=globalThis.MediaRecorder){
 if(!Recorder?.isTypeSupported)return null;
 return ['video/mp4;codecs=avc1','video/mp4;codecs=avc1.420033','video/mp4'].find(m=>Recorder.isTypeSupported(m))??null;
}
