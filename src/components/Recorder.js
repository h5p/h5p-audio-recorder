class RecorderWorker {
  onmessage(e) { }
}

const RecorderState = {
  inactive: 'inactive',
  recording: 'recording',
  paused: 'paused'
};

const errorMessageToCodeMap = {
  PermissionDeniedError: 'permission-denied',
  NotAllowedError: 'permission-denied'
};

export default class Recorder extends H5P.EventDispatcher{
  // Record logic API goes here
  constructor() {
    super();

    this.config = {
      bufferLength: 4096,
      numberOfChannels: 1
    };

    this.state = RecorderState.inactive;
  }

  init() {
    let self = this;
    this.userMedia = new Promise((resolve, reject) => {
      if (!this.supported()) {
        return reject('browser-unsupported');
      }

      this.audioContext = new AudioContext();
      this.scriptProcessorNode = this.audioContext.createScriptProcessor(
        this.config.bufferLength,
        this.config.numberOfChannels,
        this.config.numberOfChannels);
      this.scriptProcessorNode.onaudioprocess = function(e) {
        if (self.state === RecorderState.recording) {
          // TODO - handle actual recording here!
          console.log('.');
        }
      };

      navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
        this.sourceNode = this.audioContext.createMediaStreamSource(stream);
        this.sourceNode.connect(this.scriptProcessorNode);
        resolve();
      }).catch((e) => {
        reject({
          code: this._errorToCode(e),
          error: e
        });
      });
    });
    return this.userMedia;
  }

  start() {
    if (!this.userMedia) {
      this.init();
    }

    this.userMedia
      .then(() => {
        if (this.state === RecorderState.paused) {
          return this.resume();
        }

        if (this._setState(RecorderState.recording, RecorderState.inactive)) {
          this.scriptProcessorNode.connect(this.audioContext.destination);
        }
        this.trigger('recording-started');
      })
      .catch(() => {
        this.trigger('recording-blocked');
      });
  }

  stop() {
    if (this.state !== RecorderState.inactive) {
      this._setState(RecorderState.inactive);
      this.scriptProcessorNode.disconnect();
    }
  }

  pause() {
    this._setState(RecorderState.paused, RecorderState.recording);
  }

  resume() {
    this._setState(RecorderState.resume, RecorderState.paused);
  }

  supported() {
    return AudioContext && navigator.mediaDevices.getUserMedia;
  }

  getData() {
    // TODO
  }

  reset() {
    // TODO
  }

  _errorToCode(e) {
    if (e.name && errorMessageToCodeMap[e.name]) {
      return errorMessageToCodeMap[e.name];
    }
    return 'unknown';
  }

  _setState(state, condition) {
    if (condition === undefined || this.state === condition) {
      this.state = state;
      this.trigger(this.state);

      return true;
    }
    return false;
  }
}
