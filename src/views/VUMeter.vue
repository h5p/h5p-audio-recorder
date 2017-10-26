<template>
  <div class="recording-indicator-wrapper">
    <div v-bind:style="{ transform: `scale(${pulseScale})`}"
         v-bind:class="[{'hidden' : !enablePulse}]"
         class="h5p-audio-recorder-vu-meter"
    ></div>
    <div class="fa-microphone"></div>
  </div>
</template>

<script>
  /**
   * Settings for processing average microphone frequency into a scaled value.
   */
  const settings = {
    lowerFreqBound: 4,
    upperFreqBound: 30,
    minPulseScale: 0.7,
    maxPulseScale: 1.3,
    pulseScaleStep: 0.005
  };

  /**
   * Transform microphone frequency to a reasonable scale value for pulsating background element
   *
   * @param {number} frequency Average microphone frequency input
   * @return {number} A transformed scale for the pulsating element, determined by settings
   */
  const micFrequencyToPulseScale = (frequency) => {
    // Set outer bounds
    if (frequency > settings.upperFreqBound) {
      frequency = settings.upperFreqBound;
    }
    else if (frequency < settings.lowerFreqBound) {
      frequency = settings.lowerFreqBound;
    }

    // Normalize within min/max scale
    const normalized = (frequency - settings.lowerFreqBound) / settings.upperFreqBound;
    const deltaScale = settings.maxPulseScale - settings.minPulseScale;
    const vuScaled = (deltaScale * normalized) + settings.minPulseScale;

    // Round to nearest step to reduce jitter
    return Math.round(vuScaled / settings.pulseScaleStep) * settings.pulseScaleStep;
  };

  export default {
    props: ['avgMicFrequency', 'enablePulse'],
    computed: {
      pulseScale: function () {
        return micFrequencyToPulseScale(this.avgMicFrequency);
      }
    }
  }

</script>

<style lang="scss" type="text/scss">
  .recording-indicator-wrapper {
    height: 9.375em;
    width: 9.375em;
    margin-left: auto;
    margin-right: auto;
    line-height: 9.375em;
    color: #8e8e8e;
    position: relative;
    margin-bottom: 1em;
  }

  .h5p-audio-recorder-vu-meter {
    height: 100%;
    width: 100%;
    background-image: url('../images/recording-indicator.svg');
    position: absolute;
    transform: scale(0.8);

    &.hidden {
      display: none;
    }
  }
</style>
