import Vue from 'vue';
import RecordingWrapper from './views/RecordingWrapper.vue';

export default class AudioRecorder {
  /**
   * @constructor
   *
   * @param {object} config
   * @param {string} contentId
   * @param {object} contentData
   */
  constructor(config, contentId, contentData = {}) {
    const rootElement = document.createElement('div');
    rootElement.classList.add('h5p-audio-recorder');

    // Create recording wrapper view
    const recordingWrapper = new Vue({ ...RecordingWrapper });

    /**
     * Attach library to wrapper
     *
     * @param {jQuery} $wrapper
     */
    this.attach = function($wrapper) {
      $wrapper.get(0).appendChild(rootElement);
      recordingWrapper.$mount(rootElement);
    };
  }
}
