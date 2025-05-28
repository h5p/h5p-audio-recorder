<template>
  <div class="h5p-audio-recorder-view">
    <vuMeter :avgMicFrequency="avgMicFrequency" :enablePulse="state === 'recording'"></vuMeter>

    <div v-if="state !== 'done' && title" class="title" v-html="title" />

    <div role="status" v-bind:class="state" v-html="statusMessages[state]" />

    <div class="h5p-audio-recorder-player" v-if="state === 'done' && audioSrc !== ''">
      <audio controls="controls">
        Your browser does not support the <code>audio</code> element.
        <source v-bind:src="audioSrc">
      </audio>
    </div>

    <timer ref="timer" v-bind:stopped="state !== 'recording'" v-if="state !== 'unsupported' && state !== 'done' && state !== 'insecure-not-allowed'"></timer>

    <div v-if="state !== 'blocked' && state !== 'unsupported' && state === 'done'" class="h5p-audio-recorder-download">
      {{ l10n.downloadRecording }}
    </div>

    <div class="button-row">
      <div class="button-row-double" ref="buttonRowDouble"></div>
    </div>
  </div>
</template>

<script>
  import State from '../components/State';
  // focus on ref when state is changed
  const refToFocusOnStateChange = {};
  refToFocusOnStateChange[State.READY] = 'recordButtonContainer';
  refToFocusOnStateChange[State.RECORDING] = 'pauseButtonContainer';
  refToFocusOnStateChange[State.PAUSED] = 'continueButtonContainer';
  refToFocusOnStateChange[State.DONE] = 'doneButtonContainer';

  const viewStateBreakPoint = 576; // px, container width to toggle viewState at

  export default {
    mounted :function() {
      this.insertButtonsForState(this.state);
    },

    methods: {
      downloadAudio: function() {
        const a = document.createElement('a');
        a.href = this.audioSrc;
        a.download = this.audioFilename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },

      clearButtonRow: function() {
        const container = this.$refs.buttonRowDouble;
        if (container) {
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        }
      },

      injectButtons: function(buttons) {
        const container = this.$refs.buttonRowDouble;
        if (!container) return;

        buttons.forEach(({ label, icon, classes, onClick }) => {
          const btn = H5P.Components.Button({ label, icon, classes, onClick });
          container.appendChild(btn);
        });
      },


      insertButtonsForState: function(state) {
        this.clearButtonRow();

        const buttons = [];

        if (state === State.READY || state === State.BLOCKED) {
          buttons.push({
            label: this.l10n.recordAnswer,
            icon: 'record',
            classes: 'button record h5p-theme-primary-cta',
            onClick: this.record
          });
        }

        if (state === State.RECORDING) {
          buttons.push({
            label: this.l10n.pause,
            icon: 'pause',
            classes: 'button pause h5p-theme-primary-cta',
            onClick: this.pause
          });
        }

        if (state === State.PAUSED) {
          buttons.push({
            label: this.l10n.continue,
            icon: 'circle',
            classes: 'button record h5p-theme-primary-cta',
            onClick: this.record
          });
        }

        if (state === State.RECORDING || state === State.PAUSED) {
          buttons.push({
            label: this.l10n.done,
            icon: null,
            classes: 'h5p-theme-secondary-cta h5p-joubelui-button h5p-theme-done',
            onClick: this.done
          }, {
            label: this.l10n.retry,
            icon: null,
            classes: 'h5p-theme-secondary-cta h5p-joubelui-button h5p-theme-retry',
            onClick: this.retry
          });
        }

        if (state === State.DONE || state === 'cant-create-audio-file') {
          buttons.push({
            label: this.l10n.retry,
            icon: null,
            classes: 'h5p-theme-secondary-cta h5p-joubelui-button h5p-theme-retry',
            onClick: this.retry
          });
        }
        
        if (state === State.DONE) {
          buttons.push({
            label: this.l10n.download,
            icon: 'download',
            classes: 'h5p-theme-secondary-cta h5p-theme-download h5p-joubelui-button',
            onClick: this.downloadAudio
          });
        }

        this.injectButtons(buttons);
      },

      // Resize buttons. Not using media queries to allow being subcontent
      resize: function() {
        if (!this.$el) {
          return; // Not attached yet
        }

        this.viewState = (this.$el.offsetWidth <= viewStateBreakPoint) ? 'small' : 'large';
      },

      record: function() {
        this.$emit(State.RECORDING);
      },

      pause: function() {
        this.state = State.PAUSED;
        this.$emit(this.state);
      },

      done: function() {
        this.state = State.DONE;
        this.$emit(State.DONE);
      },

      retry: function() {
        let dialogParent = this.$el;

        /*
         * If AudioRecorder is subcontent, the dialog may be hidden behind
         * other elements if it is not attached to the h5p-content element
         */
        if (this.isSubcontent) {
          const findH5PContent = function(element) {
            if (!element) {
              return null;
            }
            else if (element.className.indexOf('h5p-content') !== -1) {
              return element;
            }
            else {
              return findH5PContent(element.parentNode);
            }
          }

          dialogParent = findH5PContent(this.$el) || this.$el;
        }

        const dialog = new H5P.ConfirmationDialog(
          {
            headerText: this.l10n.retryDialogHeaderText,
            dialogText: this.l10n.retryDialogBodyText,
            cancelText: this.l10n.retryDialogCancelText,
            confirmText: this.l10n.retryDialogConfirmText
          }
        );
        dialog.appendTo(dialogParent);
        dialog.show();
        
        // References the current component
        const that = this;
        
        dialog.on('confirmed', function() {
          that.state = State.READY;
          if (that.$refs.timer) {
            that.$refs.timer.reset();
          }
          that.$emit('retry');
        });
      }
    },

    computed: {
      unEscape() {
        return this.statusMessages[this.state].replace(/&#039;/g, '\'');
      }
    },

    watch: {
      state: function(newState) {
        this.$nextTick(() => {
          this.insertButtonsForState(newState);

          const refName = refToFocusOnStateChange[newState];
          if (refName && this.$refs[refName]?.focus) {
            this.$refs[refName].focus();
          }
        });
        this.$emit('resize');
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  @import '../styles/AudioRecorder.scss';
</style>
