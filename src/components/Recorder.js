export default class Recorder extends H5P.EventDispatcher {
  // Record logic API goes here
  constructor() {
    super();
    navigator.getUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
    this.isInited = false;
  }

  init() {
    this.chunks = [];

    this.userMedia = new Promise((resolve, reject) => {
      navigator.getUserMedia(
        {
          audio: true
        }, (stream) => {
          // Get user media was accepted
          this.recorder = new MediaRecorder(stream);

          this.recorder.ondataavailable = function (event) {
            this.chunks.push(event.data);
          };

          // Need to trigger events, eg:
          // this.recorder.onstop

          resolve(this.recorder);
        },
        (err) => {
          // TODO - Trigger event here
          reject(err);
        }
      );
    });
    return this.userMedia;
  }

  start() {
    // Initialize user media stream if not initialized
    if (!this.isInited) {
      this.init();
    }

    // Start recording when user media is ready
    this.userMedia.then(recorder => {
      this.trigger('recording-started');
      recorder.start();
    }).catch(() => {
      this.trigger('recording-blocked');
    });
  }

  stop() {
    this.recorder.stop();
  }

  pause() {
    this.recorder.pause();
  }

  resume() {
    this.recorder.resume();
  }

  supported() {
    return true;
  }

  getData() {
    return this.chunks;
  }

  reset() {
    // TODO
  }
}
