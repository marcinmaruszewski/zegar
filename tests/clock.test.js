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

test("hour controls wrap around the twelve-hour clock", function () {
  assert.equal(clock.adjustHour(12, 1), 1);
  assert.equal(clock.adjustHour(1, -1), 12);
});

test("minute controls move in five-minute steps and wrap", function () {
  assert.equal(clock.adjustMinute(55, 1), 0);
  assert.equal(clock.adjustMinute(0, -1), 55);
  assert.equal(clock.adjustMinute(25, 1), 30);
});

test("the setting exercise starts at a different hour and minute", function () {
  assert.deepEqual(clock.startingTime({ hour: 12, minute: 50 }), {
    hour: 1,
    minute: 5
  });
});

test("matching a time requires both hands to be correct", function () {
  assert.equal(
    clock.timesMatch({ hour: 7, minute: 35 }, { hour: 7, minute: 35 }),
    true
  );
  assert.equal(
    clock.timesMatch({ hour: 7, minute: 35 }, { hour: 8, minute: 35 }),
    false
  );
  assert.equal(
    clock.timesMatch({ hour: 7, minute: 35 }, { hour: 7, minute: 40 }),
    false
  );
});
