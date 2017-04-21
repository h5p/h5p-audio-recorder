import Vue from 'vue';
import RecordingWrapper from './views/RecordingWrapper.vue';
import Timer from './views/Timer.vue';
import Recorder from 'components/Recorder';

export default class {

  /**
   * @typedef {Object} Parameters
   *
   * @property {string} title Title
   * @property {Object} l10n Translations
   * @property {string} l10n.finishedRecording Finished recording audio
   * @property {string} l10n.microphoneInaccessible Microphone blocked
   * @property {string} l10n.downloadRecording Download recording message
   */

  /**
   * @constructor
   *
   * @param {Parameters} params Content type parameters
   * @param {string} contentId
   * @param {object} contentData
   */
  constructor(params, contentId, contentData = {}) {
    const rootElement = document.createElement('div');
    rootElement.classList.add('h5p-audio-recorder');

    const statusMessages = {
      ready: params.l10n.statusReadyToRecord,
      recording: params.l10n.statusRecording,
      paused: params.l10n.statusPaused,
      finished: params.l10n.statusFinishedRecording,
      error: params.l10n.microphoneInaccessible
    };

    this.recorder = new Recorder();

    RecordingWrapper.data = () => ({
      title: params.title,
      state: 'ready',
      statusMessages,
      l10n: params.l10n,
      audioSrc: '',
      audioFilename: ''
    });

    // Create recording wrapper view
    const recordingWrapper = new Vue({
      ...RecordingWrapper,
      components: {
        timer: Timer
      }
    });

    // Start recording when record button is pressed
    recordingWrapper.$on('recording', () => {
      this.recorder.start();
    });

    recordingWrapper.$on('finished', () => {
      this.recorder.stop();
      this.recorder.getWavURL().then((url) => {
        recordingWrapper.audioSrc = url;
        // Create a filename using the title
        let filename = params.title.length > 20 ? params.title.substr(0, 20) : params.title;
        recordingWrapper.audioFilename = filename.toLowerCase().replace(/ /g, '-') + '.wav';
      });
    });

    recordingWrapper.$on('retry', () => {
      this.recorder.reset();
    });

    recordingWrapper.$on('paused', () => {
      this.recorder.pause();
    });

    // Update UI when on recording events
    this.recorder.on('recording-started', () => {
      recordingWrapper.state = 'recording';
    });

    this.recorder.on('recording-blocked', () => {
      recordingWrapper.state = 'error';
    });

    /**
     * Attach library to wrapper
     *
     * @param {jQuery} $wrapper
     */
    this.attach = function ($wrapper) {
      $wrapper.get(0).appendChild(rootElement);
      recordingWrapper.$mount(rootElement);
    };
  }
}
