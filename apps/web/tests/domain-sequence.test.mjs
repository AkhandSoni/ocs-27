import test from 'node:test';
import assert from 'node:assert/strict';
import { DomainSequence, DOMAINS, CUES, sampleLoad } from '../src/lib/domain-sequence.ts';

function advance(sequence, seconds, options) {
  for (let t = 0; t < seconds; t += 1 / 120) sequence.update(1 / 120, options);
}
function choose(index = 0) {
  const sequence = new DomainSequence();
  sequence.open(); advance(sequence, 3);
  assert.equal(sequence.state.phase, 'choosing');
  assert.equal(sequence.select(index), true);
  return sequence;
}

test('the disc releases toward the viewer, waits for the case to close, then travels', () => {
  assert.ok(CUES.liftEnd < CUES.caseCloseStart);
  assert.ok(CUES.caseCloseEnd < CUES.flyStart);
  const hold = sampleLoad((CUES.caseCloseEnd + CUES.flyStart) / 2);
  assert.equal(hold.lift, 1);
  assert.equal(hold.lid, 0);
  assert.equal(hold.fly, 0);
  assert.equal(hold.discVisible, true);
  for (let t = CUES.flyStart; t < CUES.insertEnd; t += .01) assert.equal(sampleLoad(t).lid, 0);
});

test('the latest domain list has five distinct, selectable cases', () => {
  assert.deepEqual(DOMAINS.map(domain => domain.name), ['Tech', 'Research', 'Competitive Coding', 'Design', 'Management']);
  assert.equal(new Set(DOMAINS.map(domain => domain.id)).size, 5);
  const sequence = new DomainSequence();
  assert.equal(sequence.select(0), false, 'the shelf must open before a case is selected');
  assert.equal(sequence.open(), true);
  assert.equal(sequence.open(), false, 'repeated shelf clicks do not restart the presentation');
});

test('insertion waits for an open slot; TV boot waits for the fully inserted disc and closed slot', () => {
  const sequence = choose(2);
  let bootSeen = false;
  for (let t = 0; t < CUES.end + 1; t += 1 / 120) {
    sequence.update(1 / 120);
    const pose = sampleLoad(sequence.load);
    if (pose.insert > 0 && pose.insert < 1) assert.equal(pose.slot, 1);
    if (sequence.state.phase === 'booting' || sequence.state.phase === 'active') {
      bootSeen = true;
      assert.equal(pose.insert, 1);
      assert.equal(pose.slot, 0);
      assert.equal(pose.discVisible, false);
    }
  }
  assert.equal(bootSeen, true);
  assert.equal(sequence.state.phase, 'active');
  assert.equal(sampleLoad(sequence.load).zoom, 1);
  advance(sequence, 120);
  assert.equal(sequence.state.phase, 'active', 'the view stays focused until an explicit exit');
});

test('a second selection cannot replace a disc that is already loading', () => {
  const sequence = choose(4);
  advance(sequence, 2);
  const position = sequence.load;
  assert.equal(sequence.select(0), false);
  assert.equal(sequence.open(), false);
  assert.equal(sequence.state.selected, 4);
  assert.equal(sequence.load, position);
});

test('exit at every stage reverses the current pose and eventually restores the shelf', () => {
  for (const at of [.15, 1.2, 2.4, 4.1, 6, 7, 8.2, 12]) {
    const sequence = choose(1);
    advance(sequence, at);
    const before = sampleLoad(sequence.load);
    assert.equal(sequence.exit(), true);
    assert.deepEqual(sampleLoad(sequence.load), before, `no discontinuity when exiting at ${at}s`);
    assert.equal(sequence.exit(), false, 'repeated exit does not restart the return');
    advance(sequence, 20);
    assert.equal(sequence.state.phase, 'idle');
    assert.equal(sequence.state.selected, null);
    assert.equal(sequence.presentation, 0);
    assert.equal(sequence.load, 0);
    assert.equal(sampleLoad(sequence.load).slot, 0);
    assert.equal(sequence.open(), true, 'the next domain can be opened');
  }
});

test('closing a partially presented shelf preserves its starting pose', () => {
  const sequence = new DomainSequence();
  sequence.open(); advance(sequence, .45);
  const before = sequence.presentation;
  sequence.exit(); sequence.update(0);
  assert.equal(sequence.presentation, before);
  advance(sequence, 3);
  assert.equal(sequence.state.phase, 'idle');
});

test('interrupting a moving disc decelerates before reversing direction', () => {
  const sequence = choose(); advance(sequence, 4);
  const before = sequence.load;
  sequence.exit(); sequence.update(1 / 120);
  assert.ok(sequence.load > before, 'the playhead retains forward momentum during the first braking frame');
  advance(sequence, .8);
  assert.ok(sequence.load < before, 'after braking it travels back toward the case');
});

test('background time and invalid frame intervals cannot skip the sequence', () => {
  const sequence = choose();
  advance(sequence, 3);
  const before = sequence.load;
  sequence.update(180, { visible: false });
  sequence.update(NaN); sequence.update(-1);
  assert.equal(sequence.load, before);
  sequence.update(180);
  assert.ok(sequence.load - before <= .051, 'a resumed or stalled frame has bounded progress');
});

test('reduced motion removes the long flights while preserving a boot and exit', () => {
  const sequence = new DomainSequence();
  sequence.open(); sequence.update(1 / 60, { reduced: true });
  assert.equal(sequence.state.phase, 'choosing');
  sequence.select(3); sequence.update(1 / 60, { reduced: true });
  assert.equal(sequence.state.phase, 'booting');
  assert.equal(sampleLoad(sequence.load).insert, 1);
  assert.equal(sampleLoad(sequence.load).slot, 0);
  advance(sequence, 2, { reduced: true });
  assert.equal(sequence.state.phase, 'active');
  sequence.exit(); sequence.update(1 / 60, { reduced: true });
  assert.equal(sequence.state.phase, 'idle');
});
