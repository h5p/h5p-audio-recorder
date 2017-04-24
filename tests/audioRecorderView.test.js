import test from 'ava';
import Vue from 'vue';
import AudioRecorderView from '../src/views/AudioRecorder.vue';
import Timer from '../src/views/Timer.vue';
import State from '../src/components/State';

// setup initial state
AudioRecorderView.data = () => ({
  title: 'Title',
  state: State.READY,
  statusMessages: {},
  l10n: {},
  audioSrc: '',
  audioFilename: ''
});

test.beforeEach(t => {
  const viewModel = new Vue({
    ...AudioRecorderView,
    components: {
      timer: Timer
    }
  });

  t.context.vm = viewModel.$mount();
});

test('has created a hook', t => {
  console.log(t.context.vm.$el.outerHTML);

  t.pass();
});