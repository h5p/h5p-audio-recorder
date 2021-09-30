import recorderWorker from 'raw-loader!./RecorderWorker.js.txt';

const RecorderState = {
  inactive: 'inactive',
  recording: 'recording'
};

/**
 * Frequency analyser settings
 */
const frequencyAnalyserSettings = {
  minDecibels: -90,
  maxDecibels: -10,
  smoothingTimeConstant: 0.85,
  fftSize: 256
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
 * The recorder class.
 *
 * Note: When using this class, supported() should be invoked
 * before start(). Example:
 *
 * const recorder = new Recorder();
 * if (recorder.supported()) {
 *   recorder.start();
 * }
 *
 * @fires Recorder#inactive
 * @fires Recorder#recording
 * @fires Recorder#blocked
 */
export default class Recorder extends H5P.EventDispatcher {

  /**
   * @constructor
   */
  constructor() {
    super();

    this.config = {
      bufferLength: 4096,
      numChannels: 1
    };

    this.state = RecorderState.inactive;

    // Create a worker. This is normally done using a URL to the js-file
    const workerBlob = new Blob(
      [recorderWorker],
      {type: 'text/javascript'}
    );
    this.worker = new Worker(URL.createObjectURL(workerBlob));

    this.worker.onmessage = e => {
      this.trigger(e.data.command, e.data.blob);
    };

    this.worker.onerror = e => {
      this.trigger('worker-error', e);
    };
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
   *
   * @private
   * @param {MediaStream} stream
   */
  _setupAudioProcessing(stream) {
    this.stream = stream;

    // Create the audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
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

    // Create analyzer for extracting audio data and configure it
    const freqAnalyser = this.audioContext.createAnalyser();
    freqAnalyser.minDecibels = frequencyAnalyserSettings.minDecibels;
    freqAnalyser.maxDecibels = frequencyAnalyserSettings.maxDecibels;
    freqAnalyser.smoothingTimeConstant = frequencyAnalyserSettings.smoothingTimeConstant;
    freqAnalyser.fftSize = frequencyAnalyserSettings.fftSize;
    this.freqBufferLength = freqAnalyser.frequencyBinCount;
    this.freqDataArray = new Uint8Array(this.freqBufferLength);
    this.freqAnalyser = freqAnalyser;

    // Creates the media stream, and connects the mic source to the
    // processor node
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.sourceNode.connect(this.freqAnalyser);
    this.freqAnalyser.connect(this.scriptProcessorNode);
    this.scriptProcessorNode.connect(this.audioContext.destination);
  }

  /**
   * Get average microphone frequency
   *
   * @return {number} Average frequency of microphone input
   */
  getAverageMicFrequency() {
    this.freqAnalyser.getByteFrequencyData(this.freqDataArray);
    const sum = this.freqDataArray.reduce((prev, curr) => {
      return prev + curr;
    }, 0);

    // Average the frequency
    return sum / this.freqBufferLength;
  }

  /**
   * Grab the mic
   *
   * @return {Promise}
   */
  grabMic() {
    if (!this.supported()) {
      return Promise.reject();
    }

    if (this.userMedia === undefined) {
      // Ask for access to the user's microphone
      this.userMedia = navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {

        this._setupAudioProcessing(stream);

        // Initialize the worker
        this.worker.postMessage({
          command: 'init',
          config: {
            sampleRate: this.sourceNode.context.sampleRate,
            numChannels: this.config.numChannels
          }
        });
      }).catch(e => {
        let reason = 'blocked';
        if (e.name && ['NotSupportedError', 'NotSupportedError', 'NotAllowedError'].indexOf(e.name) !== -1) {
          reason = 'insecure-not-allowed';
        }
        delete this.userMedia;
        return Promise.reject(reason);
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
        this.trigger(e);
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
    return (window.AudioContext !== undefined || window.webkitAudioContext !== undefined)
      && navigator.mediaDevices
      && navigator.mediaDevices.getUserMedia;
  }

  /**
   * Release the MIC
   */
  releaseMic() {
    this._setState(RecorderState.inactive);
    // Clear the buffers:
    this.worker.postMessage({
      command: 'clear'
    });

    this.stream.getAudioTracks().forEach(track => track.stop());
    this.sourceNode.disconnect();
    this.scriptProcessorNode.disconnect();
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    delete this.userMedia;
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
