import assert from "node:assert/strict";

const targets = await fetch("http://127.0.0.1:9223/json").then(function (response) {
  return response.json();
});
const page = targets.find(function (target) {
  return target.type === "page" && target.url.indexOf("127.0.0.1:4173") !== -1;
});

assert.ok(page, "local clock page is open in Chrome");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(function (resolve, reject) {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();

socket.addEventListener("message", function (event) {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
});

function command(method, params) {
  const id = nextId;
  nextId += 1;

  return new Promise(function (resolve, reject) {
    pending.set(id, function (message) {
      if (message.error || message.result.exceptionDetails) {
        reject(new Error(JSON.stringify(message.error || message.result.exceptionDetails)));
        return;
      }
      resolve(message.result);
    });
    socket.send(JSON.stringify({
      id: id,
      method: method,
      params: params || {}
    }));
  });
}

function evaluate(expression) {
  return command("Runtime.evaluate", {
    expression: expression,
    returnByValue: true
  }).then(function (result) {
    return result.result.value;
  });
}

await command("Emulation.setDeviceMetricsOverride", {
  width: 758,
  height: 1024,
  deviceScaleFactor: 1,
  mobile: false
});

const initial = await evaluate(`JSON.stringify({
  title: document.title,
  prompt: document.getElementById("prompt").textContent,
  modeLabelExists: document.getElementById("mode-label") !== null,
  answers: Array.from(document.querySelectorAll(".answer")).map(function (button) { return button.textContent; }),
  actionTop: Math.round(document.getElementById("answers").getBoundingClientRect().top),
  actionHeight: Math.round(document.getElementById("answers").getBoundingClientRect().height),
  feedbackTop: Math.round(document.getElementById("feedback").getBoundingClientRect().top),
  feedbackHeight: Math.round(document.getElementById("feedback").getBoundingClientRect().height),
  successHidden: document.getElementById("success").hidden,
  hintExists: document.getElementById("hint") !== null,
  nextExists: document.getElementById("next") !== null,
  fitsWidth: document.documentElement.scrollWidth <= window.innerWidth,
  viewport: [window.innerWidth, window.innerHeight]
})`);
const initialState = JSON.parse(initial);

assert.equal(initialState.title, "Poćwicz zegar");
assert.equal(initialState.prompt, "Którą godzinę pokazuje zegar?");
assert.equal(initialState.modeLabelExists, false);
assert.equal(initialState.successHidden, true);
assert.equal(initialState.answers.length, 3);
assert.equal(new Set(initialState.answers).size, 3);
assert.equal(initialState.answers.every(function (answer) { return answer.length === 5; }), true);
assert.equal(initialState.hintExists, false);
assert.equal(initialState.nextExists, false);
assert.equal(initialState.fitsWidth, true);
assert.deepEqual(initialState.viewport, [758, 1024]);

const answerState = await evaluate(`(function () {
  var buttons = document.querySelectorAll(".answer");
  var index;
  for (index = 0; index < buttons.length; index += 1) {
    buttons[index].click();
    if (document.getElementById("success").textContent.indexOf("Dobrze!") === 0) {
      break;
    }
  }
  var success = document.getElementById("success");
  var successStyle = getComputedStyle(success);
  return JSON.stringify({
    feedback: document.getElementById("feedback").textContent,
    success: success.textContent,
    successClass: success.getAttribute("class"),
    successTop: Math.round(success.getBoundingClientRect().top),
    successHeight: Math.round(success.getBoundingClientRect().height),
    animationDuration: successStyle.animationDuration,
    backgroundPosition: successStyle.backgroundPosition,
    borderLeftWidth: successStyle.borderLeftWidth,
    answersHidden: document.getElementById("answers").hidden,
    answersDisabled: Array.from(buttons).every(function (button) { return button.disabled; })
  });
}())`);
const answered = JSON.parse(answerState);
assert.equal(answered.feedback, "");
assert.match(answered.success, /^Dobrze! Zegar pokazuje \d\d:\d\d\.$/);
assert.equal(answered.successClass, "success-panel success-panel--active");
assert.equal(answered.successTop, initialState.actionTop);
assert.equal(answered.successHeight, initialState.actionHeight);
assert.equal(answered.animationDuration, "5s");
assert.match(answered.backgroundPosition, /^0%/);
assert.equal(answered.borderLeftWidth, "0px");
assert.equal(answered.answersHidden, true);
assert.equal(answered.answersDisabled, true);

await new Promise(function (resolve) { setTimeout(resolve, 2500); });
const waitingState = JSON.parse(await evaluate(`JSON.stringify({
  prompt: document.getElementById("prompt").textContent,
  backgroundSize: getComputedStyle(document.getElementById("success")).backgroundSize
})`));
assert.equal(waitingState.prompt, "Którą godzinę pokazuje zegar?");
assert.ok(parseFloat(waitingState.backgroundSize) > 0);
assert.ok(parseFloat(waitingState.backgroundSize) < 100);

await new Promise(function (resolve) { setTimeout(resolve, 2800); });
const nextState = await evaluate(`(function () {
  return JSON.stringify({
    prompt: document.getElementById("prompt").textContent,
    feedback: document.getElementById("feedback").textContent,
    successHidden: document.getElementById("success").hidden,
    answersHidden: document.getElementById("answers").hidden,
    hourControlsVisible: !document.getElementById("hour-controls").hidden,
    minuteControlsVisible: !document.getElementById("minute-controls").hidden,
    controlOrder: Array.from(document.querySelectorAll(".adjust")).map(function (button) { return button.getAttribute("data-direction"); }),
    settingReadouts: document.querySelectorAll("#hour-value, #minute-value").length,
    actionTop: Math.round(document.getElementById("check").getBoundingClientRect().top),
    actionHeight: Math.round(document.getElementById("check").getBoundingClientRect().height),
    feedbackTop: Math.round(document.getElementById("feedback").getBoundingClientRect().top),
    feedbackHeight: Math.round(document.getElementById("feedback").getBoundingClientRect().height),
    target: document.getElementById("target-time").textContent
  });
}())`);
const settingState = JSON.parse(nextState);
assert.equal(settingState.prompt, "Ustaw wskazówki tak, aby pasowały do godziny:");
assert.equal(settingState.feedback, "");
assert.equal(settingState.successHidden, true);
assert.equal(settingState.answersHidden, true);
assert.equal(settingState.hourControlsVisible, true);
assert.equal(settingState.minuteControlsVisible, true);
assert.deepEqual(settingState.controlOrder, ["1", "-1", "1", "-1"]);
assert.equal(settingState.settingReadouts, 0);
assert.equal(settingState.actionTop, initialState.actionTop);
assert.equal(settingState.actionHeight, initialState.actionHeight);
assert.equal(settingState.feedbackTop, initialState.feedbackTop);
assert.equal(settingState.feedbackHeight, initialState.feedbackHeight);
assert.match(settingState.target, /^\d\d:\d\d$/);

const wrongSetting = await evaluate(`(function () {
  document.getElementById("check").click();
  return JSON.stringify({
    feedback: document.getElementById("feedback").textContent,
    actionTop: Math.round(document.getElementById("check").getBoundingClientRect().top)
  });
}())`);
const wrongResult = JSON.parse(wrongSetting);
assert.match(wrongResult.feedback, /^Jeszcze nie\./);
assert.equal(wrongResult.actionTop, settingState.actionTop);

const correctSetting = await evaluate(`(function () {
  var i;
  document.querySelector('[data-unit="hour"][data-direction="-1"]').click();
  for (i = 0; i < 15; i += 1) {
    document.querySelector('[data-unit="minute"][data-direction="-1"]').click();
  }
  document.getElementById("check").click();
  var success = document.getElementById("success");
  return JSON.stringify({
    feedback: document.getElementById("feedback").textContent,
    success: success.textContent,
    checkHidden: document.getElementById("check").hidden,
    successTop: Math.round(success.getBoundingClientRect().top),
    successHeight: Math.round(success.getBoundingClientRect().height),
    controlsDisabled: Array.from(document.querySelectorAll(".adjust")).every(function (button) { return button.disabled; })
  });
}())`);
const settingResult = JSON.parse(correctSetting);
assert.equal(settingResult.feedback, "");
assert.match(settingResult.success, /^Dobrze! Wskazówki pokazują \d\d:\d\d\.$/);
assert.equal(settingResult.checkHidden, true);
assert.equal(settingResult.successTop, settingState.actionTop);
assert.equal(settingResult.successHeight, settingState.actionHeight);
assert.equal(settingResult.controlsDisabled, true);

await new Promise(function (resolve) { setTimeout(resolve, 5300); });
const returnedState = await evaluate(`(function () {
  return JSON.stringify({
    prompt: document.getElementById("prompt").textContent,
    answersVisible: !document.getElementById("answers").hidden,
    hourControlsHidden: document.getElementById("hour-controls").hidden,
    minuteControlsHidden: document.getElementById("minute-controls").hidden
  });
}())`);
assert.deepEqual(JSON.parse(returnedState), {
  prompt: "Którą godzinę pokazuje zegar?",
  answersVisible: true,
  hourControlsHidden: true,
  minuteControlsHidden: true
});

socket.close();
console.log("Browser smoke test passed at 758×1024.");
