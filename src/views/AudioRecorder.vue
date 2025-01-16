<template>
  <div class="h5p-audio-recorder-view">
    <vuMeter :avgMicFrequency="avgMicFrequency" :enablePulse="state === 'recording'"></vuMeter>

    <div v-if="state !== 'done'  && title" class="title" v-html="title" />

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
      <div class="button-row-double">
        <button class="button record"
                v-if="state === 'ready' || state === 'blocked'"
                ref="button-record"
                v-on:click="record">
          <span class="fa-circle"></span>
          {{ l10n.recordAnswer }}
        </button>

        <button class="button retry small"
                v-if="state === 'recording' || state === 'paused'"
                v-bind:class="{ 'small-screen' : this.viewState === 'small' }"
                v-on:click="retry">
          <span class="fa-undo"></span>
          <span class="label">{{ l10n.retry }}</span>
        </button>
        <button class="button pause"
                v-bind:class="{ 'small-screen' : this.viewState === 'small' }"
                ref="button-pause"
                v-if="state === 'recording'"
                v-on:click="pause">
          <span class="fa-pause"></span>
          <span class="label">{{ l10n.pause }}</span>
        </button>
        <button class="button record"
                v-bind:class="{ 'small-screen' : this.viewState === 'small' }"
                ref="button-continue"
                v-if="state === 'paused'"
                v-on:click="record">
          <span class="fa-circle"></span>
          <span class="label">{{ l10n.continue }}</span>
        </button>
        <button class="button done small"
                v-bind:class="{ 'small-screen' : this.viewState === 'small' }"
                v-if="state === 'recording' || state === 'paused'"
                v-on:click="done">
          <span class="fa-play-circle"></span>
          <span class="label">{{ l10n.done }}</span>
        </button>
      </div>

      <span class="button-row-left">
        <a class="button download"
           ref="button-download"
           v-if="state === 'done'"
           v-bind:href="audioSrc"
           v-bind:download="audioFilename">
          <span class="icon-download"></span>
          {{ l10n.download }}
        </a>
      </span>

      <span class="button-row-right">
        <button class="button retry"
                v-if="state === 'done' || state === 'cant-create-audio-file'"
                v-on:click="retry">
          <span class="fa-undo"></span>
          <span class="label">{{ l10n.retry }}</span>
        </button>
      </span>
    </div>
  </div>
</template>

<script>
  import State from '../components/State';

  // focus on ref when state is changed
  const refToFocusOnStateChange = {};
  refToFocusOnStateChange[State.READY] = 'button-record';
  refToFocusOnStateChange[State.RECORDING] = 'button-pause';
  refToFocusOnStateChange[State.PAUSED] = 'button-continue';
  refToFocusOnStateChange[State.DONE] = 'button-download';

  const viewStateBreakPoint = 576; // px, container width to toggle viewState at

  export default {
    methods: {
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
      state: function(state){
        if (refToFocusOnStateChange[state]) {
          this.$nextTick(() => this.$refs[refToFocusOnStateChange[state]].focus());
        }
        this.$emit('resize');
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  @import '../styles/AudioRecorder.scss';
</style>
