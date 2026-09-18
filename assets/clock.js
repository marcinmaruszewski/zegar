(function (root) {
  "use strict";

  function normaliseHour(hour) {
    var value = hour % 12;
    return value === 0 ? 12 : value;
  }

  function minuteAngle(minute) {
    return minute * 6;
  }

  function hourAngle(hour, minute) {
    return (normaliseHour(hour) % 12) * 30 + minute * 0.5;
  }

  function formatTime(hour, minute) {
    var hours = String(normaliseHour(hour));
    var minutes = String(minute);
    return (hours.length < 2 ? "0" + hours : hours) + ":" +
      (minutes.length < 2 ? "0" + minutes : minutes);
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

  var model = {
    normaliseHour: normaliseHour,
    minuteAngle: minuteAngle,
    hourAngle: hourAngle,
    formatTime: formatTime,
    answerChoices: answerChoices,
    randomTime: randomTime
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
    var hourHand = root.document.getElementById("hour-hand");
    var minuteHand = root.document.getElementById("minute-hand");
    var answers = root.document.getElementById("answers");
    var feedback = root.document.getElementById("feedback");
    var nextButton = root.document.getElementById("next");
    var hintButton = root.document.getElementById("hint");
    var current = null;

    function setHand(hand, angle) {
      hand.setAttribute("transform", "rotate(" + angle + " 160 160)");
    }

    function disableAnswers(disabled) {
      var buttons = answers.getElementsByTagName("button");
      var index;
      for (index = 0; index < buttons.length; index += 1) {
        buttons[index].disabled = disabled;
      }
    }

    function renderQuestion() {
      var choices;
      var buttons;
      var index;

      current = randomTime(Math.random);
      setHand(hourHand, hourAngle(current.hour, current.minute));
      setHand(minuteHand, minuteAngle(current.minute));
      choices = shuffle(answerChoices(current.hour, current.minute), Math.random);
      buttons = answers.getElementsByTagName("button");

      for (index = 0; index < buttons.length; index += 1) {
        buttons[index].textContent = choices[index];
        buttons[index].setAttribute("data-value", choices[index]);
      }

      disableAnswers(false);
      feedback.textContent = "";
      nextButton.hidden = true;
    }

    function checkAnswer(event) {
      var button = event.target;
      var selected;
      var correct;

      if (!button || button.tagName.toLowerCase() !== "button") {
        return;
      }

      selected = button.getAttribute("data-value");
      correct = formatTime(current.hour, current.minute);

      if (selected === correct) {
        feedback.textContent = "Tak! To " + correct + ".";
        disableAnswers(true);
        nextButton.hidden = false;
        nextButton.focus();
      } else {
        feedback.textContent = "Jeszcze raz. Najpierw spójrz na długą wskazówkę.";
      }
    }

    function toggleHint() {
      var shown = clock.getAttribute("class").indexOf("clock--hint") !== -1;
      if (shown) {
        clock.setAttribute("class", "clock");
        hintButton.setAttribute("aria-pressed", "false");
        hintButton.textContent = "Pokaż minuty";
      } else {
        clock.setAttribute("class", "clock clock--hint");
        hintButton.setAttribute("aria-pressed", "true");
        hintButton.textContent = "Pokaż godziny";
      }
    }

    answers.addEventListener("click", checkAnswer, false);
    nextButton.addEventListener("click", renderQuestion, false);
    hintButton.addEventListener("click", toggleHint, false);
    renderQuestion();
  }

  if (root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", startTrainer, false);
  } else {
    startTrainer();
  }
}(typeof window !== "undefined" ? window : this));
