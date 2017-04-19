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
    this.element = document.createElement('div');
    this.element.id = 'hello';
    this.element.textContent = 'Audio Recorder wrapper';


    /**
     * Attach library to wrapper
     *
     * @param {jQuery} $wrapper
     */
    this.attach = function($wrapper) {
      $wrapper.get(0).classList.add('h5p-audio-recorder');
      $wrapper.get(0).appendChild(this.element);
      new Vue({
        ...RecordingWrapper,
        data: {},
        el: this.element
      });
    };
  }
}
