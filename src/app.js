import Vue from 'vue';
import AudioRecorderView from './views/AudioRecorder.vue';
import VUMeter from './views/VUMeter.vue';
import Timer from './views/Timer.vue';
import Recorder from 'components/Recorder';
import State from 'components/State';
import Util from 'components/Util';

const AUDIO_SRC_NOT_SPECIFIED = '';

export default class {

  /**
   * @typedef {Object} Parameters
   *
   * @property {string} title Title
   * @property {Object} l10n Translations
   * @property {string} l10n.download Download button text
   * @property {string} l10n.retry Retry button text
   * @property {string} l10n.finishedRecording Done recording audio
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
    params = Util.extend({
      l10n: {
        recordAnswer: 'Record',
        pause: 'Pause',
        continue: 'Continue',
        download: 'Download',
        done: 'Done',
        retry: 'Retry',
        microphoneNotSupported: 'Microphone not supported. Make sure you are using a browser that allows microphone recording.',
        microphoneInaccessible: 'Microphone is not accessible. Make sure that the browser microphone is enabled.',
        insecureNotAllowed: 'Access to microphone is not allowed in your browser since this page is not served using HTTPS. Please contact the author, and ask him to make this available using HTTPS',
        statusReadyToRecord: 'Press a button below to record your answer.',
        statusRecording: 'Recording...',
        statusPaused: 'Recording paused. Press a button to continue recording.',
        statusFinishedRecording: 'You have successfully recorded your answer! Listen to the recording below.',
        downloadRecording: 'Download this recording or retry.',
        retryDialogHeaderText: 'Retry recording?',
        retryDialogBodyText: 'By pressing "Retry" you will lose your current recording.',
        retryDialogConfirmText: 'Retry',
        retryDialogCancelText: 'Cancel',
        statusCantCreateTheAudioFile: 'Can\'t create the audio file.'
      }
    }, params);

    const rootElement = document.createElement('div');
    rootElement.classList.add('h5p-audio-recorder');

    const recorder = this.recorder = new Recorder(contentId, contentData);

    const statusMessages = {};
    statusMessages[State.UNSUPPORTED] = params.l10n.microphoneNotSupported;
    statusMessages[State.BLOCKED] = params.l10n.microphoneInaccessible;
    statusMessages[State.READY] = params.l10n.statusReadyToRecord;
    statusMessages[State.RECORDING] = params.l10n.statusRecording;
    statusMessages[State.PAUSED] = params.l10n.statusPaused;
    statusMessages[State.DONE] = params.l10n.statusFinishedRecording;
    statusMessages[State.INSECURE_NOT_ALLOWED] = params.l10n.insecureNotAllowed;
    statusMessages[State.CANT_CREATE_AUDIO_FILE] = params.l10n.statusCantCreateTheAudioFile;

    AudioRecorderView.data = () => ({
      title: params.title,
      state: recorder.supported() ? State.READY : State.UNSUPPORTED,
      statusMessages,
      l10n: params.l10n,
      audioSrc: AUDIO_SRC_NOT_SPECIFIED,
      audioFilename: '',
      avgMicFrequency: 0,
      isSubcontent: !this.isRoot()
    });

    // Create recording wrapper view
    const viewModel = new Vue({
      ...AudioRecorderView,
      components: {
        timer: Timer,
        vuMeter: VUMeter
      }
    });

    // Resize player view
    this.on('resize', () => {
      viewModel.resize();
    });

    // resize iframe on state change
    viewModel.$watch('state', () => this.trigger('resize'));

    // Start recording when record button is pressed
    viewModel.$on('recording', () => {
      recorder.start();
    });

    viewModel.$on('done', () => {
      recorder.stop();
      recorder.getWavURL().then(url => {
        recorder.releaseMic();
        viewModel.audioSrc = url;

        // Create a filename using the title
        if(params.title && params.title.length > 0) {
          const filename = params.title.substr(0, 20);
          viewModel.audioFilename = filename.toLowerCase().replace(/ /g, '-') + '.wav';
        }

        this.trigger('resize')
      }).catch(e => {
        viewModel.state = State.CANT_CREATE_AUDIO_FILE;
        console.error(params.l10n.statusCantCreateTheAudioFile, e);
      });
    });

    viewModel.$on('retry', () => {
      recorder.releaseMic();
      viewModel.audioSrc = AUDIO_SRC_NOT_SPECIFIED;
    });

    viewModel.$on('paused', () => {
      recorder.stop();
    });

    // Update UI when on recording events
    recorder.on('recording', () => {
      viewModel.state = State.RECORDING;

      // Start update loop for microphone frequency
      this.updateMicFrequency();
    });

    // Blocked probably means user has no mic, or has not allowed access to one
    recorder.on('blocked', () => {
      viewModel.state = State.BLOCKED;
    });

    // May be sent from Chrome, which don't allow use of mic when using http (need https)
    recorder.on('insecure-not-allowed', () => {
      viewModel.state = State.INSECURE_NOT_ALLOWED;
    });

    /**
     * Initialize microphone frequency update loop. Will run until no longer recording.
     */
    this.updateMicFrequency = function () {
      // Stop updating if no longer recording
      if (viewModel.state !== State.RECORDING) {
        window.cancelAnimationFrame(this.animateVUMeter);
        return;
      }

      // Grab average microphone frequency
      viewModel.avgMicFrequency = recorder.getAverageMicFrequency();

      // Throttle updating slightly
      setTimeout(() => {
        this.animateVUMeter = window.requestAnimationFrame(() => {
          this.updateMicFrequency();
        });
      }, 10)
    };

    /**
     * Attach library to wrapper
     *
     * @param {jQuery} $wrapper
     */
    this.attach = function ($wrapper) {
      $wrapper.get(0).appendChild(rootElement);
      viewModel.$mount(rootElement);
    };
  }
}
