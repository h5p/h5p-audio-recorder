import test from 'ava';


test('Test should pass', t => {
  t.pass();
});


test('Async test should pass', async t => {
  const foo = Promise.resolve('foo');
  const answer = await foo;
  t.is(answer, 'foo');
});