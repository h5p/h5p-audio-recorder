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
            classes: 'button-record',
            onClick: this.record
          });
        }

        if (state === State.DONE) {
          buttons.push({
            label: this.l10n.download,
            icon: 'download',
            styleType: 'secondary',
            onClick: this.downloadAudio
          });
        }

        if (state === State.RECORDING || state === State.PAUSED) {
          buttons.push({
            label: this.l10n.retry,
            icon: 'retry',
            styleType: 'secondary',
            onClick: this.retry
          });
        }

        if (state === State.RECORDING) {
          buttons.push({
            label: this.l10n.pause,
            icon: 'pause',
            styleType: 'secondary',
            classes: 'button-pause',
            onClick: this.pause
          });
        }

        if (state === State.PAUSED) {
          buttons.push({
            label: this.l10n.continue,
            icon: 'circle',
            styleType: 'secondary',
            classes: 'button-continue',
            onClick: this.record
          });
        }

        if (state === State.RECORDING || state === State.PAUSED) {
          buttons.push({
            label: this.l10n.done,
            icon: 'done',
            styleType: 'secondary',
            onClick: this.done
          });
        }

        if (state === State.DONE || state === 'cant-create-audio-file') {
          buttons.push({
            label: this.l10n.retry,
            icon: 'retry',
            styleType: 'secondary',
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

        const isSmallScreen = this.$el.offsetWidth <= viewStateBreakPoint;
        this.$refs.buttonRow.classList.toggle('small-screen', isSmallScreen);
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

      retry: function () {
        // 1) Find the big container (Column/IB/h5p-content)
        const findDialogContainer = (el) => {
          const isDialogHost = (n) => {
            if (!n) return false;
            return (
              n.classList?.contains('h5p-interactive-book') ||
              n.classList?.contains('h5p-column') ||
              n.classList?.contains('h5p-content')
            );
          };

          let cur = el;
          while (cur && cur !== document.body && !isDialogHost(cur)) {
            cur = cur.parentNode;
          }
          return cur || document.body;
        };

        const dialogContainer = findDialogContainer(this.$el);

        const dialog = new H5P.ConfirmationDialog({
          headerText: this.l10n.retryDialogHeaderText,
          dialogText: this.l10n.retryDialogBodyText,
          cancelText: this.l10n.retryDialogCancelText,
          confirmText: this.l10n.retryDialogConfirmText,
          theme: true
        });

        dialog.appendTo(dialogContainer);
        dialog.show();

        // 2) Position the popup over THIS recorder (not top of container)
        const positionPopup = () => {
          const bg = dialogContainer.querySelector(':scope > .h5p-confirmation-dialog-background');
          if (!bg) return;

          const popup = bg.querySelector('.h5p-confirmation-dialog-popup');
          if (!popup) return;

          const contRect = this.$el.getBoundingClientRect();
          const containerCenter = contRect.top + contRect.height / 2;
          
          const popupHalf = popup.getBoundingClientRect().height / 2;

          const relTop = containerCenter - popupHalf;
          popup.style.top = `${relTop}px`;
        };

        requestAnimationFrame(positionPopup);
        window.addEventListener('resize', positionPopup, { passive: true });
        dialogContainer.addEventListener('scroll', positionPopup, { passive: true });

        // 3) Wire actions
        const cleanup = () => {
          window.removeEventListener('resize', positionPopup);
          dialogContainer.removeEventListener('scroll', positionPopup);
        };

        dialog.on('confirmed', () => {
          cleanup();
          this.state = State.READY;
          if (this.$refs.timer) this.$refs.timer.reset();
          this.$emit('retry');
        });

        dialog.on('canceled', cleanup);
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
