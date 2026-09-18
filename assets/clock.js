(function (root) {
  "use strict";

  function normaliseHour(hour) {
    var value = hour % 12;
    if (value < 0) {
      value += 12;
    }
    return value === 0 ? 12 : value;
  }

  function minuteAngle(minute) {
    return minute * 6;
  }

  function hourAngle(hour, minute) {
    return (normaliseHour(hour) % 12) * 30 + minute * 0.5;
  }

  function pad2(value) {
    var text = String(value);
    return text.length < 2 ? "0" + text : text;
  }

  function formatTime(hour, minute) {
    return pad2(normaliseHour(hour)) + ":" + pad2(minute);
  }

  function answerChoices(hour, minute) {
    var candidates = [
      formatTime(hour, minute),
      formatTime(hour + 1, minute),
      formatTime(hour, (minute + 30) % 60),
      formatTime(hour - 1, minute),
      formatTime(hour, (minute + 15) % 60)
    ];
    var unique = [];
    var index;

    for (index = 0; index < candidates.length && unique.length < 3; index += 1) {
      if (unique.indexOf(candidates[index]) === -1) {
        unique.push(candidates[index]);
      }
    }

    return unique;
  }

  function shuffle(values, random) {
    var result = values.slice();
    var index;
    var swapIndex;
    var temporary;

    for (index = result.length - 1; index > 0; index -= 1) {
      swapIndex = Math.floor(random() * (index + 1));
      temporary = result[index];
      result[index] = result[swapIndex];
      result[swapIndex] = temporary;
    }
    return result;
  }

  function randomTime(random) {
    return {
      hour: Math.floor(random() * 12) + 1,
      minute: Math.floor(random() * 12) * 5
    };
  }

  function adjustHour(hour, direction) {
    return normaliseHour(hour + direction);
  }

  function adjustMinute(minute, direction) {
    var slot = (minute / 5 + direction) % 12;
    if (slot < 0) {
      slot += 12;
    }
    return slot * 5;
  }

  function startingTime(target) {
    return {
      hour: adjustHour(target.hour, 1),
      minute: adjustMinute(target.minute, 3)
    };
  }

  function timesMatch(first, second) {
    return normaliseHour(first.hour) === normaliseHour(second.hour) &&
      first.minute === second.minute;
  }

  var model = {
    normaliseHour: normaliseHour,
    minuteAngle: minuteAngle,
    hourAngle: hourAngle,
    formatTime: formatTime,
    answerChoices: answerChoices,
    randomTime: randomTime,
    adjustHour: adjustHour,
    adjustMinute: adjustMinute,
    startingTime: startingTime,
    timesMatch: timesMatch
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = model;
  }

  if (!root.document) {
    return;
  }

  root.ClockModel = model;

  function startTrainer() {
    var clock = root.document.getElementById("clock");
    var clockDescription = root.document.getElementById("clock-description");
    var hourHand = root.document.getElementById("hour-hand");
    var minuteHand = root.document.getElementById("minute-hand");
    var modeLabel = root.document.getElementById("mode-label");
    var prompt = root.document.getElementById("prompt");
    var targetPanel = root.document.getElementById("target");
    var targetTime = root.document.getElementById("target-time");
    var answers = root.document.getElementById("answers");
    var controls = root.document.getElementById("controls");
    var hourValue = root.document.getElementById("hour-value");
    var minuteValue = root.document.getElementById("minute-value");
    var checkButton = root.document.getElementById("check");
    var feedback = root.document.getElementById("feedback");
    var nextButton = root.document.getElementById("next");
    var hintRow = root.document.getElementById("hint-row");
    var hintButton = root.document.getElementById("hint");
    var mode = "read";
    var target = null;
    var setting = null;

    function setHand(hand, angle) {
      hand.setAttribute("transform", "rotate(" + angle + " 160 160)");
    }

    function renderHands(time) {
      setHand(hourHand, hourAngle(time.hour, time.minute));
      setHand(minuteHand, minuteAngle(time.minute));
    }

    function setFeedback(message, successful) {
      feedback.textContent = message;
      feedback.setAttribute("class", successful ? "feedback feedback--success" : "feedback");
    }

    function setButtonsDisabled(container, disabled) {
      var buttons = container.getElementsByTagName("button");
      var index;
      for (index = 0; index < buttons.length; index += 1) {
        buttons[index].disabled = disabled;
      }
    }

    function resetHint() {
      clock.setAttribute("class", "clock");
      hintButton.setAttribute("aria-pressed", "false");
      hintButton.textContent = "Pokaż minuty";
    }

    function renderReadExercise() {
      var choices;
      var buttons;
      var index;

      mode = "read";
      target = randomTime(Math.random);
      setting = null;
      renderHands(target);
      resetHint();

      modeLabel.textContent = "TRYB 1 z 2 · ODCZYTAJ";
      prompt.textContent = "Którą godzinę pokazuje zegar?";
      clockDescription.textContent = "Odczytaj położenie krótkiej i długiej wskazówki.";
      targetPanel.hidden = true;
      controls.hidden = true;
      checkButton.hidden = true;
      answers.hidden = false;
      hintRow.hidden = false;
      nextButton.hidden = true;
      nextButton.textContent = "Ustaw wskazówki";
      setFeedback("", false);

      choices = shuffle(answerChoices(target.hour, target.minute), Math.random);
      buttons = answers.getElementsByTagName("button");
      for (index = 0; index < buttons.length; index += 1) {
        buttons[index].textContent = choices[index];
        buttons[index].setAttribute("data-value", choices[index]);
      }
      setButtonsDisabled(answers, false);
    }

    function renderSettingValues() {
      renderHands(setting);
      hourValue.textContent = pad2(setting.hour);
      minuteValue.textContent = pad2(setting.minute);
    }

    function renderSetExercise() {
      mode = "set";
      target = randomTime(Math.random);
      setting = startingTime(target);
      resetHint();
      renderSettingValues();

      modeLabel.textContent = "TRYB 2 z 2 · USTAW";
      prompt.textContent = "Ustaw wskazówki tak, aby pasowały do godziny:";
      targetTime.textContent = formatTime(target.hour, target.minute);
      clockDescription.textContent = "Zegar, którego wskazówki ustawiasz przyciskami poniżej.";
      targetPanel.hidden = false;
      answers.hidden = true;
      hintRow.hidden = true;
      controls.hidden = false;
      checkButton.hidden = false;
      checkButton.disabled = false;
      nextButton.hidden = true;
      nextButton.textContent = "Odczytaj kolejny zegar";
      setButtonsDisabled(controls, false);
      setFeedback("", false);
    }

    function checkReadAnswer(event) {
      var button = event.target;
      var selected;
      var correct;

      if (mode !== "read" || !button || button.tagName.toLowerCase() !== "button") {
        return;
      }

      selected = button.getAttribute("data-value");
      correct = formatTime(target.hour, target.minute);

      if (selected === correct) {
        setFeedback("Dobrze! Zegar pokazuje " + correct + ".", true);
        setButtonsDisabled(answers, true);
        nextButton.hidden = false;
        nextButton.focus();
      } else {
        setFeedback("Spróbuj jeszcze raz. Najpierw spójrz na długą wskazówkę.", false);
      }
    }

    function adjustHands(event) {
      var button = event.target;
      var unit;
      var direction;

      if (mode !== "set" || !button || button.tagName.toLowerCase() !== "button") {
        return;
      }

      unit = button.getAttribute("data-unit");
      direction = Number(button.getAttribute("data-direction"));
      if (unit === "hour") {
        setting.hour = adjustHour(setting.hour, direction);
      } else if (unit === "minute") {
        setting.minute = adjustMinute(setting.minute, direction);
      } else {
        return;
      }

      renderSettingValues();
      setFeedback("", false);
    }

    function checkSetting() {
      if (mode !== "set") {
        return;
      }

      if (timesMatch(setting, target)) {
        setFeedback("Dobrze! Wskazówki pokazują " + formatTime(target.hour, target.minute) + ".", true);
        setButtonsDisabled(controls, true);
        checkButton.disabled = true;
        nextButton.hidden = false;
        nextButton.focus();
      } else {
        setFeedback("Jeszcze nie. Porównaj godziny i minuty, potem popraw wskazówki.", false);
      }
    }

    function showNextMode() {
      if (mode === "read") {
        renderSetExercise();
      } else {
        renderReadExercise();
      }
    }

    function toggleHint() {
      var shown = clock.getAttribute("class").indexOf("clock--hint") !== -1;
      if (shown) {
        resetHint();
      } else {
        clock.setAttribute("class", "clock clock--hint");
        hintButton.setAttribute("aria-pressed", "true");
        hintButton.textContent = "Pokaż godziny";
      }
    }

    answers.addEventListener("click", checkReadAnswer, false);
    controls.addEventListener("click", adjustHands, false);
    checkButton.addEventListener("click", checkSetting, false);
    nextButton.addEventListener("click", showNextMode, false);
    hintButton.addEventListener("click", toggleHint, false);
    renderReadExercise();
  }

  if (root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", startTrainer, false);
  } else {
    startTrainer();
  }
}(typeof window !== "undefined" ? window : this));
