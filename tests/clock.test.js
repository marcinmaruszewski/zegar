"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var clock = require("../assets/clock.js");

test("minute hand turns 6 degrees per minute", function () {
  assert.equal(clock.minuteAngle(0), 0);
  assert.equal(clock.minuteAngle(15), 90);
  assert.equal(clock.minuteAngle(45), 270);
});

test("hour hand moves between hour marks", function () {
  assert.equal(clock.hourAngle(3, 0), 90);
  assert.equal(clock.hourAngle(3, 30), 105);
  assert.equal(clock.hourAngle(12, 30), 15);
});

test("time is always formatted with five characters", function () {
  assert.equal(clock.formatTime(3, 5), "03:05");
  assert.equal(clock.formatTime(12, 30), "12:30");
  assert.equal(clock.formatTime(13, 0), "01:00");
});

test("answer choices are unique and include the correct time", function () {
  var choices = clock.answerChoices(12, 30);
  assert.equal(choices.length, 3);
  assert.equal(new Set(choices).size, 3);
  assert.ok(choices.indexOf("12:30") !== -1);
});

test("random time uses five-minute intervals", function () {
  var values = [0, 0.999];
  var index = 0;
  var result = clock.randomTime(function () {
    var value = values[index];
    index += 1;
    return value;
  });

  assert.deepEqual(result, { hour: 1, minute: 55 });
});
