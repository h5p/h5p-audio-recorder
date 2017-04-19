export default class Recorder {
  // Record logic API goes here
  constructor() {
    this.getUserMedia = navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia;
  }

  init() {
    this.chunks = [];

    this.getUserMedia({
      audio: true
    },
    function(stream) {
      this.recorder = new MediaRecorder(stream);

      this.recorder.ondataavailable = function (event) {
        this.chunks.push(event.data);
      }

      // Need to trigger events, eg:
      // this.recorder.onstop
    },
    function(err) {
      // TODO - Trigger event here
    }
  }

  start() {
    this.recorder.start();
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
