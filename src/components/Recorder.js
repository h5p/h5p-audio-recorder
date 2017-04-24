import RecorderWorker from './RecorderWorker'

const RecorderState = {
  inactive: 'inactive',
  recording: 'recording'
};

const errorMessageToCodeMap = {
  PermissionDeniedError: 'permission-denied',
  NotAllowedError: 'permission-denied'
};

/**
 * Event triggered when recorder goes from recording to inactive
 *
 * @event Recorder#inactive
 * @type {Object}
 */

/**
 * Event triggered when recording is started
 *
 * @event Recorder#recording
 * @type {Object}
 */

/**
 * Event triggered when microphone access is denied
 *
 * @event Recorder#blocked
 * @type {Object}
 */

/**
 * The recorder class
 *
 * @fires Recorder#inactive
 * @fires Recorder#recording
 * @fires Recorder#blocked
 */
export default class Recorder extends H5P.EventDispatcher{

  /**
   * @constructor
   */
  constructor() {
    super();

    this.config = {
      bufferLength: 4096,
      numChannels: 1
    }

    this.state = RecorderState.inactive;

    // Create a worker. This is normally done using a URL to the js-file
    const workerBlob = new Blob(
      [RecorderWorker.toString().replace(/^function .+\{?|\}$/g, '')],
      {type:'text/javascript'}
    );
    const workerBlobUrl = URL.createObjectURL(workerBlob);
    this.worker = new Worker(workerBlobUrl);

    this.worker.onmessage = e => {
      this.trigger(e.data.command, e.data.blob);
    };

    this.worker.onerror = e => {
      this.trigger('worker-error', e);
    };

    this.init();
  }

  /**
   * Creates a URL to a wav blob
   *
   * @return {Promise}
   */
  getWavURL() {
    this.stop();

    const loadAudioUrl = new Promise((resolve, reject) => {
      this.once('wav-delivered', e => {
        resolve(URL.createObjectURL(e.data));
      });

      this.once('worker-error', e => {
        reject(e);
      });
    });

    this.worker.postMessage({
      command: 'export-wav'
    });

    return loadAudioUrl;
  }

  /**
   * Initialize
   */
  init() {
    if (!this.supported()) {
      return;
    }

    // Create the audio context
    this.audioContext = new AudioContext();
    this.scriptProcessorNode = this.audioContext.createScriptProcessor(
      this.config.bufferLength,
      this.config.numChannels,
      this.config.numChannels);

    // Handle the actual input
    // If in recording mode, sends the recorded data to the worker
    this.scriptProcessorNode.onaudioprocess = e => {
      if (this.state === RecorderState.recording) {
        this.worker.postMessage({
          command: 'record',
          buffer: [e.inputBuffer.getChannelData(0)]
        });
      }
    };
  }

  /**
   * Grab the mic
   *
   * @return {Promise}
   */
  grabMic() {
    if (this.userMedia === undefined) {
      this.userMedia = new Promise((resolve, reject) => {
        // Ask for access to the user's microphone
        navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
          // Creates the media stream, and connects the mic source to the
          // processor node
          this.sourceNode = this.audioContext.createMediaStreamSource(stream);
          this.sourceNode.connect(this.scriptProcessorNode);
          this.scriptProcessorNode.connect(this.audioContext.destination);

          // Initialize the worker
          this.worker.postMessage({
            command: 'init',
            config: {
              sampleRate: this.sourceNode.context.sampleRate,
              numChannels: this.config.numChannels
            }
          });

          resolve();
        }).catch(e => {
          // Typically this means user has no mic, or user has not approved
          // microphone access
          reject({
            code: this._errorToCode(e),
            error: e
          });
        });
      });
    }

    return this.userMedia;
  }

  /**
   * Start or resume a recording
   */
  start() {
    this.grabMic()
      .then(() => {
        this._setState(RecorderState.recording);
      })
      .catch(e => {
        this.trigger('blocked');
      });
  }

  /**
   * Stop/pause a recording
   */
  stop() {
    this._setState(RecorderState.inactive);
  }

  /**
   * Check if browser supports recording
   * @return {boolean}
   */
  supported() {
    return window.AudioContext !== undefined &&
           navigator.mediaDevices &&
           navigator.mediaDevices.getUserMedia;
  }

  /**
   * Reset previous recording
   */
  reset() {
    this._setState(RecorderState.inactive);
    this.worker.postMessage({
      command: 'clear'
    });
  }

  /**
   * Maps different browsers error codes to a common one
   *
   * @param {Object} e Error object from browser
   * @private
   * @return {string}
   */
  _errorToCode(e) {
    if (e.name && errorMessageToCodeMap[e.name]) {
      return errorMessageToCodeMap[e.name];
    }
    return 'unknown';
  }

  /**
   * Set state
   *
   * @private
   * @param {string} state
   */
  _setState(state) {
    this.state = state;
    this.trigger(this.state);
  }
}
