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
  mode: document.getElementById("mode-label").textContent,
  answers: Array.from(document.querySelectorAll(".answer")).map(function (button) { return button.textContent; }),
  fitsWidth: document.documentElement.scrollWidth <= window.innerWidth,
  viewport: [window.innerWidth, window.innerHeight]
})`);
const initialState = JSON.parse(initial);

assert.equal(initialState.title, "Poćwicz zegar");
assert.equal(initialState.mode, "TRYB 1 z 2 · ODCZYTAJ");
assert.equal(initialState.answers.length, 3);
assert.equal(new Set(initialState.answers).size, 3);
assert.equal(initialState.answers.every(function (answer) { return answer.length === 5; }), true);
assert.equal(initialState.fitsWidth, true);
assert.deepEqual(initialState.viewport, [758, 1024]);

const hintState = await evaluate(`(function () {
  document.getElementById("hint").click();
  return JSON.stringify({
    pressed: document.getElementById("hint").getAttribute("aria-pressed"),
    hintClass: document.getElementById("clock").getAttribute("class")
  });
}())`);
assert.deepEqual(JSON.parse(hintState), {
  pressed: "true",
  hintClass: "clock clock--hint"
});

const answerState = await evaluate(`(function () {
  var buttons = document.querySelectorAll(".answer");
  var index;
  for (index = 0; index < buttons.length; index += 1) {
    buttons[index].click();
    if (document.getElementById("feedback").textContent.indexOf("Dobrze!") === 0) {
      break;
    }
  }
  return JSON.stringify({
    feedback: document.getElementById("feedback").textContent,
    nextVisible: !document.getElementById("next").hidden,
    answersDisabled: Array.from(buttons).every(function (button) { return button.disabled; })
  });
}())`);
const answered = JSON.parse(answerState);
assert.match(answered.feedback, /^Dobrze! Zegar pokazuje \d\d:\d\d\.$/);
assert.equal(answered.nextVisible, true);
assert.equal(answered.answersDisabled, true);

const nextState = await evaluate(`(function () {
  document.getElementById("next").click();
  return JSON.stringify({
    mode: document.getElementById("mode-label").textContent,
    feedback: document.getElementById("feedback").textContent,
    nextHidden: document.getElementById("next").hidden,
    answersHidden: document.getElementById("answers").hidden,
    hourControlsVisible: !document.getElementById("hour-controls").hidden,
    minuteControlsVisible: !document.getElementById("minute-controls").hidden,
    controlOrder: Array.from(document.querySelectorAll(".adjust")).map(function (button) { return button.getAttribute("data-direction"); }),
    settingReadouts: document.querySelectorAll("#hour-value, #minute-value").length,
    target: document.getElementById("target-time").textContent
  });
}())`);
const settingState = JSON.parse(nextState);
assert.equal(settingState.mode, "TRYB 2 z 2 · USTAW");
assert.equal(settingState.feedback, "");
assert.equal(settingState.nextHidden, true);
assert.equal(settingState.answersHidden, true);
assert.equal(settingState.hourControlsVisible, true);
assert.equal(settingState.minuteControlsVisible, true);
assert.deepEqual(settingState.controlOrder, ["1", "-1", "1", "-1"]);
assert.equal(settingState.settingReadouts, 0);
assert.match(settingState.target, /^\d\d:\d\d$/);

const wrongSetting = await evaluate(`(function () {
  document.getElementById("check").click();
  return document.getElementById("feedback").textContent;
}())`);
assert.match(wrongSetting, /^Jeszcze nie\./);

const correctSetting = await evaluate(`(function () {
  document.querySelector('[data-unit="hour"][data-direction="-1"]').click();
  document.querySelector('[data-unit="minute"][data-direction="-1"]').click();
  document.querySelector('[data-unit="minute"][data-direction="-1"]').click();
  document.querySelector('[data-unit="minute"][data-direction="-1"]').click();
  document.getElementById("check").click();
  return JSON.stringify({
    feedback: document.getElementById("feedback").textContent,
    nextVisible: !document.getElementById("next").hidden,
    controlsDisabled: Array.from(document.querySelectorAll(".adjust")).every(function (button) { return button.disabled; })
  });
}())`);
const settingResult = JSON.parse(correctSetting);
assert.match(settingResult.feedback, /^Dobrze! Wskazówki pokazują \d\d:\d\d\.$/);
assert.equal(settingResult.nextVisible, true);
assert.equal(settingResult.controlsDisabled, true);

const returnedState = await evaluate(`(function () {
  document.getElementById("next").click();
  return JSON.stringify({
    mode: document.getElementById("mode-label").textContent,
    answersVisible: !document.getElementById("answers").hidden,
    hourControlsHidden: document.getElementById("hour-controls").hidden,
    minuteControlsHidden: document.getElementById("minute-controls").hidden
  });
}())`);
assert.deepEqual(JSON.parse(returnedState), {
  mode: "TRYB 1 z 2 · ODCZYTAJ",
  answersVisible: true,
  hourControlsHidden: true,
  minuteControlsHidden: true
});

socket.close();
console.log("Browser smoke test passed at 758×1024.");
