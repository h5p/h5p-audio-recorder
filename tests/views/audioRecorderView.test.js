import test from 'ava';
import Vue from 'vue';
import AudioRecorderView from '../../src/views/AudioRecorder.vue';
import Timer from '../../src/views/Timer.vue';
import VUMeter from '../../src/views/VUMeter.vue';
import State from '../../src/components/State';

const statusMessages = {};
statusMessages[State.RECORDING] = "Recording...";
statusMessages[State.READY] = "Press a button below to record your answer.";

// setup initial state for audio recorder
const initialData = {
  title: 'Title',
  state: State.READY,
  statusMessages,
  l10n: {},
  audioSrc: '',
  audioFilename: '',
  avgMicFrequency: 0
};

AudioRecorderView.data = () => initialData;

// prepare viewModel
test.beforeEach(t => {
  t.context.vm = new Vue({
    ...AudioRecorderView,
    components: {
      timer: Timer,
      vuMeter: VUMeter
    }
  }).$mount();
});

test('ready state', async t => {
  t.plan(4);

  Vue.nextTick(() => {
    const el = t.context.vm.$el;

    // check that title is rendered
    const titleEl = el.querySelector('.title');
    t.is(titleEl.textContent, initialData.title);

    // check that status message is updated
    const statusEl = el.querySelector('[role="status"]');
    t.is(statusEl.textContent, statusMessages[State.READY]);

    // check that pulse and record button is present
    t.truthy(el.querySelector('.button.record'));

    // check that only 1 buttons is showing
    t.is(el.querySelectorAll('.button').length, 1);
  });
});

test('change state to "RECORDING"', async t => {
  t.plan(5);

  // set state to recording
  t.context.vm.state = State.RECORDING;

  Vue.nextTick(() => {
    const el = t.context.vm.$el;

    // check that status message is updated
    const statusEl = el.querySelector('[role="status"]');
    t.is(statusEl.textContent, statusMessages[State.RECORDING]);

    // check that pulse, pause button, finish button is present
    t.truthy(el.querySelector('.button.retry'));
    t.truthy(el.querySelector('.button.pause'));
    t.truthy(el.querySelector('.button.done'));

    // check that only 2 buttons are showing
    t.is(el.querySelectorAll('.button').length, 3);
  });
});
