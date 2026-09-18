(function (document) {
  "use strict";

  function startQuizzes() {
    var quizzes = document.querySelectorAll("[data-quiz-answer]");
    var index;

    function handleAnswer(event) {
      var quiz = event.currentTarget;
      var button = event.target;
      var feedback = quiz.querySelector("[data-quiz-feedback]");
      var correct = quiz.getAttribute("data-quiz-answer");

      if (!button || !button.getAttribute("data-answer")) {
        return;
      }

      if (button.getAttribute("data-answer") === correct) {
        feedback.textContent = "Dobrze. 20 × 6° = 120°.";
      } else {
        feedback.textContent = "Spróbuj jeszcze raz: pomnóż 20 minut przez 6°.";
      }
    }

    for (index = 0; index < quizzes.length; index += 1) {
      quizzes[index].addEventListener("click", handleAnswer, false);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startQuizzes, false);
  } else {
    startQuizzes();
  }
}(document));
