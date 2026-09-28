# Time Volume

[Open the studio](https://vsewall.github.io/time-volume/)

A browser studio for exploring video as an X/Y/time volume. Rotate the volume, sample planar or curved surfaces, and record the resulting 2D image as MP4.

## Privacy and hosting

GitHub Pages serves static HTML, JavaScript, CSS and the sample clip. Imported videos and webcam frames stay in browser memory on your device. There is no upload endpoint, backend, analytics or external runtime dependency. Webcam access requires permission and HTTPS (or localhost).

## Controls

- Drag the volume to orbit; scroll to zoom. Hold Shift when releasing a drag to keep rotating.
- Plain scrolling moves the settings panel. Ctrl + wheel adjusts a slider; angles step by 5 degrees. Arrow keys give fine adjustment. Each slider has a reset button.
- Scan speed 1x traverses the selected clip duration in real time. The center has a narrow snap zone.
- Sine has a direction angle in surface XY. Noise animation loops continuously. Phase is measured in turns; animation speed in cycles per second.
- The outlined output frame is the exported image, with an independent aspect ratio and resolution. Black pixels outside the sampled volume are part of the export.
- MP4 recording is silent, targeting 30 fps, and requires browser H.264 MediaRecorder support. Ready output frames are explicitly submitted where supported. During recording, 3D preview is capped at a 640-pixel long edge and 15 fps; output resolution is unchanged. The submitted FPS counter measures capture requests, not encoder-confirmed frames. Real-time capture can still drop frames under load. Output dimensions are locked while recording; recording stops after three minutes or when the tab is hidden.

## Run locally

Requires Node.js. No package installation is needed.

```sh
npm start
npm test
```

Open http://127.0.0.1:5186/. Browser GPU checks are at `/__gpu-test.html`; MP4 checks at `/__record-test.html`. These diagnostic pages are excluded from the published website.

## Limits

WebGL 2 is required. The default buffer holds 192 sampled frames at a 960-pixel long edge (about 380 MiB for 16:9); larger settings need more GPU memory. Sampling a long clip into a fixed frame count reduces temporal detail. Uploaded sources must be decodable by the browser. Frame import is asynchronous and can take several seconds.

## Demo credit

Dance clip by SHVETS production, [Pexels video 7198406](https://www.pexels.com/video/medium-close-up-of-woman-dancing-7198406/). The bundled clip is used as the interactive demo; user videos are never added to this repository.
