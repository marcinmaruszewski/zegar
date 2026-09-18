# Analog Clock Trainer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Zbudować małą, statyczną stronę do ćwiczenia odczytu zegara analogowego na PocketBook Verse i opublikować ją na Vercel.

**Architecture:** `index.html` zawiera semantyczny interfejs, `assets/clock.js` model czasu i sterowanie DOM, a `assets/site.css` cały responsywny wygląd. Czyste funkcje modelu są eksportowane także do Node, więc można testować matematykę bez przeglądarki; całość działa bez budowania i zależności uruchomieniowych.

**Tech Stack:** HTML5, CSS, SVG 1.1, zgodny wstecz JavaScript, `node:test`, Vercel static deployment.

---

### Task 1: Model czasu i tarcza

**Files:**
- Create: `tests/clock.test.js`
- Create: `assets/clock.js`
- Create: `index.html`
- Create: `assets/site.css`

**Step 1:** Napisać testy kątów wskazówki minutowej i godzinowej oraz test unikalnych odpowiedzi.

**Step 2:** Uruchomić `node --test tests/clock.test.js` i zobaczyć błąd braku modułu.

**Step 3:** Zaimplementować czyste funkcje `minuteAngle`, `hourAngle` i `answerChoices`, a następnie wyrenderować wskazówki przez SVG `transform`.

**Step 4:** Uruchomić `node --test tests/clock.test.js`; oczekiwany wynik: wszystkie testy przechodzą.

**Step 5:** Otworzyć stronę lokalnie i potwierdzić, że przy 758 px szerokości tarcza oraz trzy odpowiedzi mieszczą się bez przewijania poziomego.

### Task 2: Pętla ćwiczenia

**Files:**
- Modify: `assets/clock.js`
- Modify: `index.html`
- Test: `tests/clock.test.js`

**Step 1:** Dodać testy progresji pytań: pełne godziny, pół godziny, kwadranse, pięć minut, jedna minuta.

**Step 2:** Dodać sprawdzanie odpowiedzi, komunikat zwrotny i przycisk „Następny zegar”.

**Step 3:** Dodać podpowiedź zamieniającą liczby godzin na wartości minutowe.

**Step 4:** Sprawdzić obsługę dotykiem i klawiaturą oraz widoczny fokus.

### Task 3: Test na PocketBooku

**Files:**
- Modify if needed: `assets/site.css`
- Modify if needed: `assets/clock.js`
- Update: `NOTES.md`

**Step 1:** Uruchomić lokalny serwer i otworzyć stronę w zwykłej przeglądarce z viewportem 758×1024.

**Step 2:** Otworzyć stronę na fizycznym PocketBook Verse i sprawdzić dotyk, kontrast, odświeżanie oraz czytelność cyfr.

**Step 3:** Zapisać zauważone różnice przeglądarki w `NOTES.md` i wprowadzić najmniejszą potrzebną poprawkę.

### Task 4: Publikacja

**Files:**
- Create: `.gitignore`
- Create: `README.md`

**Step 1:** Utworzyć repozytorium Git i pierwszy mały commit, jeśli użytkownik chce wersjonować projekt.

**Step 2:** Opublikować folder przez Vercel Drop albo połączyć repozytorium z Vercel.

**Step 3:** Otworzyć produkcyjny adres na PocketBooku i rozwiązać pełne ćwiczenie.

**Step 4:** Zapisać adres oraz procedurę aktualizacji w `README.md`.
