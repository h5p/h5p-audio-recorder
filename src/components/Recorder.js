import RecorderWorker from './RecorderWorker'

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
      numChannels: 1
    }

    this.state = RecorderState.inactive;

    // Create a worker. This is normaløly done using a URL to the js-file
    let workerBlob = new Blob(
      [RecorderWorker.toString().replace(/^function .+\{?|\}$/g, '')],
      {type:'text/javascript'}
    );
    var workerBlobUrl = URL.createObjectURL(workerBlob);
    this.worker = new Worker(workerBlobUrl);

    var self = this;
    this.worker.onmessage = function (e) {
      self.trigger(e.data.command, e.data.blob);
    };
  }

  getWavURL() {
    this.stop();
    this.worker.postMessage({
      command: 'exportWAV',
      type: 'audio/wav'
    });

    return new Promise((resolve, reject) => {
      this.on('wav-delivered', (e) => {
        resolve(URL.createObjectURL(e.data));
      });
    });
  }

  getMP3Url() {
    // TODO
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
        this.config.numChannels,
        this.config.numChannels);
      this.scriptProcessorNode.onaudioprocess = function(e) {
        if (self.state === RecorderState.recording) {
          self.worker.postMessage({
            command: 'record',
            buffer: [e.inputBuffer.getChannelData(0)]
          });
        }
      };

      navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
        this.sourceNode = this.audioContext.createMediaStreamSource(stream);

        this.worker.postMessage({
          command: 'init',
          config: {
            sampleRate: this.sourceNode.context.sampleRate,
            numChannels: this.config.numChannels
          }
        });

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
      .catch((e) => {
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

  reset() {
    this._setState(RecorderState.inactive);
    this.worker.postMessage({
      command: 'clear'
    });
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
