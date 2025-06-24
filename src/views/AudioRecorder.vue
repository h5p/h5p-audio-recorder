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

    <div
      class="button-row"
      v-bind:class="{ 'small-screen' : this.viewState === 'small' }"
      ref="buttonRow"
    >
    </div>
  </div>
</template>

<script>
  import State from '../components/State';

  // focus on ref when state is changed
  const refToFocusOnStateChange = {};
  refToFocusOnStateChange[State.READY] = 'record';
  refToFocusOnStateChange[State.RECORDING] = 'pause';
  refToFocusOnStateChange[State.PAUSED] = 'continue';
  refToFocusOnStateChange[State.DONE] = 'done';

  const viewStateBreakPoint = 576; // px, container width to toggle viewState at

  export default {
    mounted: function() {
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
        while (this.$refs.buttonRow.firstChild) {
          this.$refs.buttonRow.removeChild(this.$refs.buttonRow.firstChild);
        }
      },

      injectButtons: function(buttons, buttonRef) {
        if (buttons.length && buttonRef) {
          buttons.forEach((params) => {
            const btn = H5P.Components.Button(params);
            buttonRef.appendChild(btn);
          });
        }
      },

      insertButtonsForState: function(state) {
        this.clearButtonRow();

        const buttons = [];

        if (state === State.READY || state === State.BLOCKED) {
          buttons.push({
            label: this.l10n.recordAnswer,
            icon: 'record',
            classes: 'button record',
            onClick: this.record
          });
        }

        if (state === State.DONE) {
          buttons.push({
            label: this.l10n.download,
            icon: 'download',
            styleType: 'secondary',
            classes: 'button',
            onClick: this.downloadAudio
          });
        }

        if (state === State.RECORDING || state === State.PAUSED) {
          buttons.push({
            label: this.l10n.retry,
            icon: 'retry',
            styleType: 'secondary',
            classes: 'button',
            onClick: this.retry
          });
        }

        if (state === State.RECORDING) {
          buttons.push({
            label: this.l10n.pause,
            icon: 'pause',
            styleType: 'secondary',
            classes: 'button pause',
            onClick: this.pause
          });
        }

        if (state === State.PAUSED) {
          buttons.push({
            label: this.l10n.continue,
            icon: 'circle',
            styleType: 'secondary',
            classes: 'button record continue',
            onClick: this.record
          });
        }

        if (state === State.RECORDING || state === State.PAUSED) {
          buttons.push({
            label: this.l10n.done,
            icon: 'done',
            styleType: 'secondary',
            classes: 'button done',
            onClick: this.done
          });
        }

        if (state === State.DONE || state === 'cant-create-audio-file') {
          buttons.push({
            label: this.l10n.retry,
            icon: 'retry',
            styleType: 'secondary',
            classes: 'button',
            onClick: this.retry
          });
        }

        this.injectButtons(buttons, this.$refs.buttonRow);
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
            confirmText: this.l10n.retryDialogConfirmText,
            theme: true
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
          const focusedElement = this.$refs.buttonRow?.querySelector('.' + refName);
          if (refName && focusedElement) {
            focusedElement.focus();
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
