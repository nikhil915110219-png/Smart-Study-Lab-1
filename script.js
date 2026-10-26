"use strict";

/* =====================================================
   SMART STUDY LAB
   Interactive application logic
   No external libraries or paid APIs required
   ===================================================== */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/* -----------------------------------------------------
   1. SAVED PROGRESS
   ----------------------------------------------------- */

const STORAGE_KEY = "smartStudyLabProgress_v1";

function createDefaultState() {
    return {
        points: 0,
        correctAnswers: 0,
        completedQuizzes: 0,
        experiments: 0,
        bestWpm: 0,
        calculations: 0,
        typingChallenges: 0,
        achievements: []
    };
}

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return createDefaultState();
        }

        const parsed = JSON.parse(saved);
        const defaults = createDefaultState();

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return defaults;
        }

        const result = { ...defaults };

        for (const key of Object.keys(defaults)) {
            if (key === "achievements") {
                result.achievements = Array.isArray(parsed.achievements)
                    ? parsed.achievements.filter(
                        item => typeof item === "string"
                    )
                    : [];
            } else {
                const value = Number(parsed[key]);

                result[key] = Number.isFinite(value) && value >= 0
                    ? Math.floor(value)
                    : defaults[key];
            }
        }

        return result;

    } catch (error) {
        console.warn("Saved progress could not be loaded.", error);
        return createDefaultState();
    }
}

let state = loadState();

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
    } catch (error) {
        console.warn("Progress could not be saved.", error);
        showToast("Progress could not be saved in this browser.");
        return false;
    }
}

/* -----------------------------------------------------
   2. TOAST NOTIFICATIONS
   ----------------------------------------------------- */

let toastTimeout;

function showToast(message) {
    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

/* -----------------------------------------------------
   3. PAGE NAVIGATION
   ----------------------------------------------------- */

const pageTitles = {
    dashboard: "Dashboard",
    quiz: "Brain Challenge",
    science: "Science Lab",
    math: "Math Studio",
    typing: "Typing Sprint",
    progress: "My Progress"
};

function navigateTo(pageName) {
    const target = $("#" + pageName);

    if (!target || !pageTitles[pageName]) {
        return;
    }

    $$(".page").forEach(page => {
        page.classList.toggle("active", page === target);
    });

    $$(".nav-item").forEach(button => {
        const active = button.dataset.view === pageName;

        button.classList.toggle("active", active);

        if (active) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    $("#pageTitle").textContent = pageTitles[pageName];

    closeSidebar();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (pageName === "progress") {
        renderProgress();
    }
}

$$("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
        navigateTo(button.dataset.view);
    });
});

$$("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        navigateTo(button.dataset.go);
    });
});

/* Mobile sidebar */

const sidebar = $("#sidebar");
const menuButton = $("#menuButton");

function closeSidebar() {
    sidebar.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
}

menuButton.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");

    menuButton.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeSidebar();
    }
});

document.addEventListener("click", event => {
    if (
        window.innerWidth <= 850 &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !menuButton.contains(event.target)
    ) {
        closeSidebar();
    }
});

/* -----------------------------------------------------
   4. DASHBOARD AND PROGRESS
   ----------------------------------------------------- */

function renderStats() {
    $("#totalPoints").textContent = state.points;
    $("#correctAnswers").textContent = state.correctAnswers;
    $("#experimentsCount").textContent = state.experiments;
    $("#bestWpm").textContent = state.bestWpm;

    $("#progressPoints").textContent = state.points;
    $("#progressCorrect").textContent = state.correctAnswers;
    $("#progressExperiments").textContent = state.experiments;
    $("#progressWpm").textContent = state.bestWpm;
}

const achievementDefinitions = [
    {
        id: "firstQuiz",
        title: "Curious Mind",
        condition: () => state.correctAnswers >= 1
    },
    {
        id: "quizMaster",
        title: "Quiz Explorer",
        condition: () => state.completedQuizzes >= 1
    },
    {
        id: "scientist",
        title: "Young Scientist",
        condition: () => state.experiments >= 1
    },
    {
        id: "speedster",
        title: "Speed Starter",
        condition: () => state.typingChallenges >= 1
    },
    {
        id: "calculator",
        title: "Number Ninja",
        condition: () => state.calculations >= 1
    },
    {
        id: "points100",
        title: "Century Club",
        condition: () => state.points >= 100
    }
];

function checkAchievements() {
    let changed = false;

    achievementDefinitions.forEach(achievement => {
        const unlocked = achievement.condition();

        if (unlocked && !state.achievements.includes(achievement.id)) {
            state.achievements.push(achievement.id);
            changed = true;

            showToast("Achievement unlocked: " + achievement.title);
        }
    });

    if (changed) {
        saveState();
    }

    renderProgress();
}

function renderProgress() {
    renderStats();

    const unlocked = new Set(state.achievements);

    $$(".achievement-card").forEach(card => {
        const isUnlocked = unlocked.has(card.dataset.achievement);

        card.classList.toggle("unlocked", isUnlocked);
        card.classList.toggle("locked", !isUnlocked);

        const status = card.querySelector(".achievement-status");

        if (status) {
            status.textContent = isUnlocked ? "UNLOCKED ✓" : "LOCKED";
        }
    });

    $("#achievementCount").textContent =
        unlocked.size + " UNLOCKED";
}

function addPoints(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
        return;
    }

    state.points += Math.floor(amount);

    saveState();
    renderStats();
    checkAchievements();
}

/* -----------------------------------------------------
   5. BRAIN CHALLENGE
   ----------------------------------------------------- */

const questions = [
    {
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Mercury"],
        answer: 1,
        explanation: "Mars appears reddish because its surface contains iron oxide."
    },
    {
        question: "What is 15 × 4?",
        options: ["45", "50", "60", "65"],
        answer: 2,
        explanation: "15 multiplied by 4 equals 60."
    },
    {
        question: "Which gas do plants absorb during photosynthesis?",
        options: [
            "Oxygen",
            "Nitrogen",
            "Hydrogen",
            "Carbon dioxide"
        ],
        answer: 3,
        explanation: "Plants use carbon dioxide, water and light to produce sugars."
    },
    {
        question: "How many sides does a hexagon have?",
        options: ["Five", "Six", "Seven", "Eight"],
        answer: 1,
        explanation: "A hexagon is a polygon with six sides."
    },
    {
        question: "Which is the largest ocean on Earth?",
        options: [
            "Atlantic Ocean",
            "Indian Ocean",
            "Pacific Ocean",
            "Arctic Ocean"
        ],
        answer: 2,
        explanation: "The Pacific Ocean is the largest ocean on Earth."
    },
    {
        question: "What is the chemical symbol for gold?",
        options: ["Ag", "Gd", "Go", "Au"],
        answer: 3,
        explanation: "Gold has the chemical symbol Au, from the Latin word aurum."
    },
    {
        question: "Which organ pumps blood around the human body?",
        options: ["Lungs", "Heart", "Liver", "Kidneys"],
        answer: 1,
        explanation: "The heart pumps blood through the circulatory system."
    },
    {
        question: "What comes next: 2, 4, 8, 16, ...?",
        options: ["18", "24", "30", "32"],
        answer: 3,
        explanation: "Each number doubles, so 16 × 2 = 32."
    }
];

let quizOrder = [];
let quizIndex = 0;
let quizScore = 0;
let answeredCurrent = false;
let quizCompleted = false;

function shuffleQuestions() {
    const result = questions.map((_, index) => index);

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function startQuiz() {
    quizOrder = shuffleQuestions();
    quizIndex = 0;
    quizScore = 0;
    answeredCurrent = false;
    quizCompleted = false;

    $("#quizContent").classList.remove("hidden");
    $("#quizResult").classList.add("hidden");

    renderQuestion();
}

function renderQuestion() {
    const question = questions[quizOrder[quizIndex]];

    answeredCurrent = false;

    $("#questionCounter").textContent =
        "Question " + (quizIndex + 1) + " of " + quizOrder.length;

    $("#quizProgress").style.width =
        ((quizIndex / quizOrder.length) * 100) + "%";

    $("#questionText").textContent = question.question;
    $("#quizFeedback").textContent = "";
    $("#quizFeedback").className = "quiz-feedback";

    $("#nextQuestion").disabled = true;

    $("#nextQuestion").textContent =
        quizIndex === quizOrder.length - 1
            ? "See results →"
            : "Next question →";

    const list = $("#answerList");

    list.replaceChildren();

    question.options.forEach((option, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "answer-option";

        const letter = document.createElement("span");
        letter.className = "answer-letter";
        letter.textContent = String.fromCharCode(65 + index);

        const text = document.createElement("span");
        text.textContent = option;

        button.append(letter, text);

        button.addEventListener("click", () => {
            selectAnswer(index);
        });

        list.appendChild(button);
    });
}

function selectAnswer(selectedIndex) {
    if (answeredCurrent || quizCompleted) {
        return;
    }

    answeredCurrent = true;

    const question = questions[quizOrder[quizIndex]];
    const buttons = $$(".answer-option");
    const correct = selectedIndex === question.answer;

    buttons.forEach((button, index) => {
        button.disabled = true;

        if (index === question.answer) {
            button.classList.add("correct");
        }

        if (index === selectedIndex && !correct) {
            button.classList.add("wrong");
        }
    });

    const feedback = $("#quizFeedback");

    if (correct) {
        quizScore++;
        state.correctAnswers++;

        feedback.textContent = "Correct! " + question.explanation;
        feedback.classList.add("success");

        state.points += 10;
        saveState();
        renderStats();
        checkAchievements();

    } else {
        feedback.textContent = "Not quite. " + question.explanation;
        feedback.classList.add("error");
    }

    $("#nextQuestion").disabled = false;
}

function finishQuiz() {
    quizCompleted = true;

    state.completedQuizzes++;

    const earned = quizScore * 10;

    $("#quizContent").classList.add("hidden");
    $("#quizResult").classList.remove("hidden");

    $("#quizProgress").style.width = "100%";
    $("#resultScore").textContent = quizScore + "/" + quizOrder.length;

    let title;
    let message;

    if (quizScore === quizOrder.length) {
        title = "Perfect performance!";
        message = "Outstanding! You answered every question correctly.";
    } else if (quizScore >= 5) {
        title = "Great work!";
        message = "You earned " + earned +
            " points. Keep practising to improve your score.";
    } else {
        title = "Keep exploring!";
        message = "You earned " + earned +
            " points. Every attempt is a chance to learn something new.";
    }

    $("#resultTitle").textContent = title;
    $("#resultMessage").textContent = message;

    saveState();
    renderStats();
    checkAchievements();
}

$("#nextQuestion").addEventListener("click", () => {
    if (!answeredCurrent || quizCompleted) {
        return;
    }

    if (quizIndex < quizOrder.length - 1) {
        quizIndex++;
        renderQuestion();
    } else {
        finishQuiz();
    }
});

$("#restartQuiz").addEventListener("click", startQuiz);

/* -----------------------------------------------------
   6. SCIENCE LAB: ELECTRICAL CIRCUIT
   ----------------------------------------------------- */

let circuitIsOn = false;
let experimentRecorded = false;

function renderCircuit() {
    const board = $("#circuitBoard");
    const status = $("#circuitStatus");
    const toggleButton = $("#toggleCircuit");

    board.classList.toggle("is-on", circuitIsOn);

    status.textContent = circuitIsOn
        ? "CIRCUIT CLOSED"
        : "CIRCUIT OPEN";

    status.classList.toggle("circuit-status-on", circuitIsOn);
    status.classList.toggle("circuit-status-off", !circuitIsOn);

    toggleButton.textContent = circuitIsOn
        ? "Open circuit"
        : "Complete circuit";

    $("#observationIcon").textContent = circuitIsOn ? "✓" : "ⓘ";

    $("#observationTitle").textContent = circuitIsOn
        ? "Success! The circuit is complete."
        : "Your experiment starts here";

    $("#observationText").textContent = circuitIsOn
        ? "The switch is closed, allowing current to flow through the circuit. The bulb lights up in this simulation."
        : "The switch is open, so the conducting path is incomplete and the bulb is off.";

    if (circuitIsOn && !experimentRecorded) {
        experimentRecorded = true;

        state.experiments++;
        state.points += 5;

        saveState();
        renderStats();
        checkAchievements();

        showToast("Experiment explored! +5 points");
    }
}

$("#toggleCircuit").addEventListener("click", () => {
    circuitIsOn = !circuitIsOn;
    renderCircuit();
});

$("#resetCircuit").addEventListener("click", () => {
    circuitIsOn = false;
    renderCircuit();

    showToast("Circuit reset. Ready for another experiment.");
});

/* -----------------------------------------------------
   7. MATH STUDIO
   ----------------------------------------------------- */

function formatNumber(value) {
    if (!Number.isFinite(value)) {
        return "Undefined";
    }

    if (Object.is(value, -0)) {
        return "0";
    }

    return String(Number(value.toPrecision(12)));
}

function calculateMath() {
    const firstText = $("#mathFirst").value.trim();
    const secondText = $("#mathSecond").value.trim();
    const operation = $("#mathOperation").value;

    if (firstText === "" || secondText === "") {
        showToast("Please enter both numbers.");
        return;
    }

    const a = Number(firstText);
    const b = Number(secondText);

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
        showToast("Please enter valid, finite numbers.");
        return;
    }

    let result;
    let explanation;

    switch (operation) {
        case "add":
            result = a + b;
            explanation = formatNumber(a) + " + " + formatNumber(b);
            break;

        case "subtract":
            result = a - b;
            explanation = formatNumber(a) + " − " + formatNumber(b);
            break;

        case "multiply":
            result = a * b;
            explanation = formatNumber(a) + " × " + formatNumber(b);
            break;

        case "divide":
            if (b === 0) {
                $("#mathResult").textContent = "Undefined";
                $("#mathExplanation").textContent =
                    "Division by zero is undefined.";
                showToast("A number cannot be divided by zero.");
                return;
            }

            result = a / b;
            explanation = formatNumber(a) + " ÷ " + formatNumber(b);
            break;

        case "power":
            result = Math.pow(a, b);
            explanation = formatNumber(a) + " raised to the power " +
                formatNumber(b);
            break;

        case "modulo":
            if (b === 0) {
                $("#mathResult").textContent = "Undefined";
                $("#mathExplanation").textContent =
                    "The remainder operation cannot use zero as the divisor.";
                showToast("The second number cannot be zero for this operation.");
                return;
            }

            result = a % b;
            explanation = "Remainder of " +
                formatNumber(a) + " ÷ " + formatNumber(b);
            break;

        default:
            showToast("Please select a valid operation.");
            return;
    }

    if (!Number.isFinite(result)) {
        $("#mathResult").textContent = "Out of range";
        $("#mathExplanation").textContent =
            "This calculation is outside the supported numeric range.";
        showToast("The result is too large or undefined.");
        return;
    }

    $("#mathResult").textContent = formatNumber(result);
    $("#mathExplanation").textContent =
        explanation + " = " + formatNumber(result);

    state.calculations++;

    // Give points for the first successful calculation only.
    if (state.calculations === 1) {
        state.points += 5;
    }

    saveState();
    renderStats();
    checkAchievements();
}

$("#calculateButton").addEventListener("click", calculateMath);

["mathFirst", "mathSecond"].forEach(id => {
    $("#" + id).addEventListener("keydown", event => {
        if (event.key === "Enter") {
            calculateMath();
        }
    });
});

/* -----------------------------------------------------
   8. TYPING SPRINT
   ----------------------------------------------------- */

const typingPassage =
    "Learning is a journey of curiosity, practice and discovery. " +
    "Every small step helps us understand the world better.";

let typingStarted = false;
let typingFinished = false;
let typingTimer = null;
let typingStartTime = 0;
let typingDuration = 60;

const typingInput = $("#typingInput");

function getTypingStats() {
    const typed = typingInput.value;
    const elapsedSeconds = typingStarted
        ? Math.max(0.1, (Date.now() - typingStartTime) / 1000)
        : 0;

    let correctCharacters = 0;

    for (let i = 0; i < typed.length; i++) {
        if (typed[i] === typingPassage[i]) {
            correctCharacters++;
        }
    }

    const accuracy = typed.length === 0
        ? 100
        : Math.round((correctCharacters / typed.length) * 100);

    const elapsedMinutes = Math.max(elapsedSeconds / 60, 1 / 60);

    // Standard gross WPM: total typed characters / 5 / elapsed minutes.
    const wpm = typingStarted
        ? Math.round((typed.length / 5) / elapsedMinutes)
        : 0;

    return {
        typed,
        correctCharacters,
        accuracy,
        wpm,
        elapsedSeconds
    };
}

function updateTypingDisplay() {
    const stats = getTypingStats();

    $("#liveWpm").textContent = stats.wpm;
    $("#liveAccuracy").textContent = stats.accuracy;

    if (typingStarted && !typingFinished) {
        const elapsed = Math.floor(
            (Date.now() - typingStartTime) / 1000
        );

        const remaining = Math.max(0, typingDuration - elapsed);

        $("#timeLeft").textContent = remaining + "s";
        $("#typingTimer").textContent = remaining;

        $("#typingTimer").classList.toggle(
            "urgent",
            remaining <= 10
        );
    }
}

function startTyping() {
    if (typingStarted && !typingFinished) {
        typingInput.focus();
        return;
    }

    typingStarted = true;
    typingFinished = false;
    typingStartTime = Date.now();

    typingInput.value = "";
    typingInput.disabled = false;

    $("#typingResult").classList.add("hidden");
    $("#typingFeedback").textContent =
        "Timer started. Type the passage as accurately as possible.";

    $("#startTyping").textContent = "Challenge in progress...";

    updateTypingDisplay();
    typingInput.focus();

    clearInterval(typingTimer);

    typingTimer = setInterval(() => {
        updateTypingDisplay();

        const elapsed = (Date.now() - typingStartTime) / 1000;

        if (elapsed >= typingDuration) {
            finishTyping();
        }
    }, 200);
}

function finishTyping() {
    if (!typingStarted || typingFinished) {
        return;
    }

    typingFinished = true;

    clearInterval(typingTimer);
    typingTimer = null;

    typingInput.disabled = true;

    const stats = getTypingStats();

    const finalWpm = Math.round(
        (stats.typed.length / 5) /
        Math.max(stats.elapsedSeconds / 60, 1 / 60)
    );

    $("#timeLeft").textContent = "0s";
    $("#typingTimer").textContent = "0";
    $("#liveWpm").textContent = finalWpm;
    $("#liveAccuracy").textContent = stats.accuracy;

    $("#startTyping").textContent = "Start again ↻";
    $("#typingFeedback").textContent =
        "Challenge complete. Your results are shown below.";

    $("#finalWpm").textContent = finalWpm;
    $("#finalAccuracy").textContent = stats.accuracy + "%";
    $("#finalCharacters").textContent = stats.typed.length;

    $("#typingResultMessage").textContent =
        "You typed " + stats.typed.length +
        " characters. Your speed was " + finalWpm +
        " WPM, with " + stats.accuracy + "% character accuracy.";

    $("#typingResult").classList.remove("hidden");

    state.typingChallenges++;

    if (finalWpm > state.bestWpm) {
        state.bestWpm = finalWpm;
    }

    // Award points for completing the challenge.
    state.points += 10;

    saveState();
    renderStats();
    checkAchievements();

    showToast("Typing challenge completed! +10 points");

    $("#typingResult").scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

function resetTyping() {
    clearInterval(typingTimer);
    typingTimer = null;

    typingStarted = false;
    typingFinished = false;
    typingStartTime = 0;

    typingInput.value = "";
    typingInput.disabled = true;

    $("#timeLeft").textContent = "60s";
    $("#typingTimer").textContent = "60";
    $("#typingTimer").classList.remove("urgent");

    $("#liveWpm").textContent = "0";
    $("#liveAccuracy").textContent = "100";

    $("#startTyping").textContent = "Start challenge →";
    $("#typingFeedback").textContent =
        "Press Start challenge when you're ready.";

    $("#typingResult").classList.add("hidden");
}

$("#startTyping").addEventListener("click", startTyping);
$("#resetTyping").addEventListener("click", resetTyping);

typingInput.addEventListener("input", () => {
    if (!typingStarted || typingFinished) {
        return;
    }

    // Do not allow typing beyond the displayed passage.
    if (typingInput.value.length > typingPassage.length) {
        typingInput.value = typingInput.value.slice(
            0,
            typingPassage.length
        );
    }

    updateTypingDisplay();

    if (typingInput.value.length >= typingPassage.length) {
        finishTyping();
    }
});

/* -----------------------------------------------------
   9. RESET SAVED PROGRESS
   ----------------------------------------------------- */

$("#resetProgress").addEventListener("click", () => {
    const confirmed = window.confirm(
        "Are you sure you want to reset all saved progress? " +
        "Your points, quiz statistics and achievements will be cleared."
    );

    if (!confirmed) {
        return;
    }

    state = createDefaultState();

    saveState();
    renderStats();
    renderProgress();

    showToast("All progress has been reset.");

    navigateTo("dashboard");
});

/* -----------------------------------------------------
   10. START APPLICATION
   ----------------------------------------------------- */

function initializeApp() {
    renderStats();
    renderProgress();

    startQuiz();
    renderCircuit();
    resetTyping();

    // Keep the dashboard as the initial page.
    navigateTo("dashboard");

    console.log("Smart Study Lab initialized successfully.");
}

initializeApp();