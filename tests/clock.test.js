"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var clock = require("../assets/clock.js");

test("minute hand turns 6 degrees per minute", function () {
  assert.equal(clock.minuteAngle(0), 0);
  assert.equal(clock.minuteAngle(15), 90);
  assert.equal(clock.minuteAngle(45), 270);
});

test("hour hand moves between hour marks and repeats every 12 hours on the dial", function () {
  assert.equal(clock.hourAngle(3, 0), 90);
  assert.equal(clock.hourAngle(3, 30), 105);
  assert.equal(clock.hourAngle(12, 30), 15);
  assert.equal(clock.hourAngle(15, 0), clock.hourAngle(3, 0));
});

test("time is always formatted in 24-hour notation with five characters", function () {
  assert.equal(clock.formatTime(3, 5), "03:05");
  assert.equal(clock.formatTime(12, 30), "12:30");
  assert.equal(clock.formatTime(13, 0), "13:00");
  assert.equal(clock.formatTime(23, 59), "23:59");
  assert.equal(clock.formatTime(24, 0), "00:00");
});

test("answer choices are unique and include the correct time", function () {
  var choices = clock.answerChoices(12, 30, Math.random);
  assert.equal(choices.length, 3);
  assert.equal(new Set(choices).size, 3);
  assert.ok(choices.indexOf("12:30") !== -1);
});

test("answer choices stay at least 90 minutes apart from each other, even across midnight", function () {
  function minutesOf(text) {
    var parts = text.split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  function circularGap(a, b) {
    var diff = Math.abs(a - b);
    return Math.min(diff, 1440 - diff);
  }

  [0, 0.25, 0.5, 0.75, 0.999].forEach(function (r) {
    var random = function () {
      return r;
    };
    [
      { hour: 13, minute: 29 },
      { hour: 0, minute: 5 },
      { hour: 23, minute: 55 }
    ].forEach(function (time) {
      var choices = clock.answerChoices(time.hour, time.minute, random);
      var totals = choices.map(minutesOf);
      var i;
      var j;

      assert.equal(new Set(choices).size, 3);
      for (i = 0; i < totals.length; i += 1) {
        for (j = i + 1; j < totals.length; j += 1) {
          assert.ok(
            circularGap(totals[i], totals[j]) >= 90,
            choices[i] + " and " + choices[j] + " are too close together"
          );
        }
      }
    });
  });
});

test("random time covers the full 24-hour range at one-minute resolution", function () {
  var values = [0, 0.999];
  var index = 0;
  var result = clock.randomTime(function () {
    var value = values[index];
    index += 1;
    return value;
  });

  assert.deepEqual(result, { hour: 0, minute: 59 });
});

test("hour controls wrap around the 24-hour clock", function () {
  assert.equal(clock.adjustHour(23, 1), 0);
  assert.equal(clock.adjustHour(0, -1), 23);
});

test("minute controls move in one-minute steps and wrap", function () {
  assert.equal(clock.adjustMinute(59, 1), 0);
  assert.equal(clock.adjustMinute(0, -1), 59);
  assert.equal(clock.adjustMinute(25, 1), 26);
});

test("increasing minutes advances both hands smoothly through the next hour", function () {
  var beforeWrap = clock.adjustTimeByMinutes({ hour: 11, minute: 58 }, 1);
  var afterWrap = clock.adjustTimeByMinutes(beforeWrap, 1);
  var hourTravel = (
    clock.hourAngle(afterWrap.hour, afterWrap.minute) -
    clock.hourAngle(beforeWrap.hour, beforeWrap.minute) +
    360
  ) % 360;
  var minuteTravel = (
    clock.minuteAngle(afterWrap.minute) -
    clock.minuteAngle(beforeWrap.minute) +
    360
  ) % 360;

  assert.deepEqual(beforeWrap, { hour: 11, minute: 59 });
  assert.deepEqual(afterWrap, { hour: 12, minute: 0 });
  assert.equal(minuteTravel, 6);
  assert.equal(hourTravel, 0.5);
});

test("decreasing minutes moves both hands smoothly through the previous hour", function () {
  var atHour = clock.adjustTimeByMinutes({ hour: 12, minute: 1 }, -1);
  var beforeHour = clock.adjustTimeByMinutes(atHour, -1);
  var hourTravel = (
    clock.hourAngle(atHour.hour, atHour.minute) -
    clock.hourAngle(beforeHour.hour, beforeHour.minute) +
    360
  ) % 360;
  var minuteTravel = (
    clock.minuteAngle(atHour.minute) -
    clock.minuteAngle(beforeHour.minute) +
    360
  ) % 360;

  assert.deepEqual(atHour, { hour: 12, minute: 0 });
  assert.deepEqual(beforeHour, { hour: 11, minute: 59 });
  assert.equal(minuteTravel, 6);
  assert.equal(hourTravel, 0.5);
});

test("the setting exercise starts at a different hour and minute", function () {
  assert.deepEqual(clock.startingTime({ hour: 12, minute: 50 }), {
    hour: 13,
    minute: 5
  });
  assert.deepEqual(clock.startingTime({ hour: 23, minute: 50 }), {
    hour: 0,
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

test("a successful answer stays visible for five seconds", function () {
  assert.equal(clock.successDelay, 5000);
});
