
"use strict";

// ================================================
// SKATE & SOUND
// Música, empatía, comunicación e inclusión
// ================================================

// ---------- ELEMENTOS Y CONFIGURACIÓN ----------

const $ = (id) => document.getElementById(id);

const screens = {
    home: $("home-screen"),
    instructions: $("instructions-screen"),
    setup: $("setup-screen"),
    game: $("game-screen"),
    result: $("result-screen")
};

const GAME_DURATION = 20 * 60;
const NORMAL_TURN_DURATION = 60;
const MUSIC_TURN_DURATION = 90;
const MAX_POINTS_PER_CHALLENGE = 100;
const MIN_POINTS_PER_CHALLENGE = 10;
const HINT_PENALTY = 15;
const TOTAL_BOARD_PIECES = 10;

let orangePoints = 0;
let whitePoints = 0;
let piecesUnlocked = 0;
let challengeNumber = 0;
let currentTeam = "orange";
let currentChallenge = null;

let remainingTime = GAME_DURATION;
let turnTimeLeft = NORMAL_TURN_DURATION;

let timerInterval = null;
let turnTimerInterval = null;
let nextChallengeTimeout = null;
let introTimeout = null;
let announcementTimeout = null;

let turnLocked = false;
let hintUsedThisChallenge = false;
let usedChallenges = [];
let gameRunning = false;

let songs = [];
let lastSongLink = "";
let audioContext = null;
let musicEnabled = false;

// ---------- RETOS ----------

const challenges = [
    {
        category: "MI SONIDO",
        icon: "fa-music",
        title: "TU CANCIÓN, TU HISTORIA",
        description: "Comparte una canción que te guste. Explica qué te atrae de ella y escucha las elecciones de los demás.",
        hint: "Pregunta qué significa la canción para esa persona. Recuerda que no todos tenemos los mismos gustos.",
        skill: "expresión personal",
        music: true
    },
    {
        category: "EMPATÍA",
        icon: "fa-heart",
        title: "CAMBIA DE PERSPECTIVA",
        description: "Un compañero se burla de la música que escucha otra persona. ¿Cómo intervendrías sin humillar a nadie?",
        hint: "Piensa en cómo se siente la persona excluida y en una forma respetuosa de detener la burla.",
        skill: "empatía"
    },
    {
        category: "CONEXIÓN",
        icon: "fa-people-group",
        title: "ENCUENTRA EL RITMO",
        description: "Busca algo en común con alguien que escucha un género musical diferente al tuyo.",
        hint: "Haz preguntas abiertas. Quizá compartan una emoción, una afición o un recuerdo.",
        skill: "comunicación"
    },
    {
        category: "COMUNICACIÓN",
        icon: "fa-comments",
        title: "ESCUCHA ACTIVA",
        description: "Una persona cuenta por qué le gusta una canción. Otra explica lo que entendió antes de dar su opinión.",
        hint: "Evita interrumpir y resume lo que escuchaste para comprobar si comprendiste.",
        skill: "escucha activa"
    },
    {
        category: "EMPATÍA",
        icon: "fa-handshake",
        title: "DOS GUSTOS, UN ACUERDO",
        description: "Dos amigos quieren escuchar música diferente durante una actividad. Propón una solución que tenga en cuenta a ambos.",
        hint: "Pueden alternar canciones, crear una lista compartida o establecer turnos.",
        skill: "resolución de conflictos"
    },
    {
        category: "INCLUSIÓN",
        icon: "fa-users",
        title: "NADIE SE QUEDA FUERA",
        description: "Una persona nueva llega al grupo y permanece en silencio. ¿Cómo puedes invitarla a participar sin presionarla?",
        hint: "Haz una invitación amable y respeta si prefiere observar al principio.",
        skill: "inclusión"
    },
    {
        category: "MI SONIDO",
        icon: "fa-headphones",
        title: "UNA CANCIÓN, UNA EMOCIÓN",
        description: "Comparte una canción que te transmita una emoción y explica qué te hace sentir, si deseas contarlo.",
        hint: "Dos personas pueden escuchar la misma canción y sentir cosas diferentes.",
        skill: "expresión emocional",
        music: true
    },
    {
        category: "COMUNICACIÓN",
        icon: "fa-comment-dots",
        title: "OPINAR CON RESPETO",
        description: "Alguien dice que tu género musical favorito es malo. ¿Cómo expresas tu opinión sin atacar a esa persona?",
        hint: "Habla desde tu experiencia y explica qué te gusta sin afirmar que los demás están equivocados.",
        skill: "asertividad"
    },
    {
        category: "CONEXIÓN",
        icon: "fa-lightbulb",
        title: "CREATIVIDAD EN EQUIPO",
        description: "Inventen un nombre para una banda que represente la diversidad de los participantes. Todos pueden aportar una idea.",
        hint: "Combinen palabras, estilos e ideas de diferentes personas.",
        skill: "cooperación"
    },
    {
        category: "INCLUSIÓN",
        icon: "fa-heart",
        title: "ROMPE LOS PREJUICIOS",
        description: "Alguien supone cómo es una persona solo por su apariencia o por la música que escucha. ¿Qué le responderías?",
        hint: "Los gustos no cuentan toda la historia de una persona. Es mejor conocerla antes de hacer suposiciones.",
        skill: "respeto por las diferencias"
    },
    {
        category: "COMUNICACIÓN",
        icon: "fa-ear-listen",
        title: "PRIMERO COMPRENDER",
        description: "Escucha una opinión con la que no estás de acuerdo. Antes de responder, explica qué quiso decir la otra persona.",
        hint: "Comprender una opinión no significa que tengas que compartirla.",
        skill: "escucha activa"
    },
    {
        category: "CONEXIÓN",
        icon: "fa-puzzle-piece",
        title: "NUESTRA COMUNIDAD",
        description: "El grupo elige una palabra que represente cómo quiere tratar a los demás y propone acciones para ponerla en práctica.",
        hint: "Piensen en acciones concretas: escuchar, invitar, respetar turnos y resolver desacuerdos hablando.",
        skill: "sentido de pertenencia"
    }
];

// ---------- CAMBIO DE PANTALLA ----------

function showScreen(screenName) {
    Object.values(screens).forEach((screen) => {
        if (screen) screen.classList.add("hidden");
    });

    if (screens[screenName]) {
        screens[screenName].classList.remove("hidden");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- SONIDOS ----------

function playSound(type = "click") {
    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const notes = {
            click: [440],
            success: [523.25, 659.25, 783.99],
            finish: [392, 523.25, 659.25, 783.99]
        };

        const frequencies = notes[type] || notes.click;
        const now = audioContext.currentTime;

        frequencies.forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const startAt = now + index * 0.11;

            oscillator.type = "sine";
            oscillator.frequency.value = frequency;

            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.exponentialRampToValueAtTime(
                0.10, startAt + 0.025
            );
            gain.gain.exponentialRampToValueAtTime(
                0.0001, startAt + 0.20
            );

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.start(startAt);
            oscillator.stop(startAt + 0.22);
        });
    } catch (error) {
        console.warn("No se pudo reproducir el sonido.", error);
    }
}

// ---------- MÚSICA DE FONDO ----------

const backgroundMusic = $("background-music");
const musicToggle = $("music-toggle");
const musicVolume = $("music-volume");
const musicStatus = $("music-status");

if (backgroundMusic) {
    backgroundMusic.loop = true;
    backgroundMusic.volume = musicVolume
        ? Number(musicVolume.value)
        : 0.25;
}

function updateMusicButton() {
    if (musicToggle) {
        musicToggle.innerHTML = musicEnabled
            ? '<i class="fa-solid fa-pause"></i>'
            : '<i class="fa-solid fa-play"></i>';

        musicToggle.setAttribute("aria-pressed", String(musicEnabled));
        musicToggle.setAttribute(
            "aria-label",
            musicEnabled
                ? "Pausar música de fondo"
                : "Reproducir música de fondo"
        );
    }

    if (musicStatus) {
        musicStatus.textContent = musicEnabled
            ? "MÚSICA ACTIVADA"
            : "MÚSICA DE FONDO";
    }
}

async function startBackgroundMusic() {
    if (!backgroundMusic) return false;

    try {
        await backgroundMusic.play();
        musicEnabled = true;
        updateMusicButton();
        return true;
    } catch (error) {
        musicEnabled = false;
        updateMusicButton();
        console.warn("No se pudo iniciar la música.", error);
        return false;
    }
}

async function toggleMusic() {
    if (!backgroundMusic) return;

    playSound("click");

    if (musicEnabled) {
        backgroundMusic.pause();
        musicEnabled = false;
        updateMusicButton();
        return;
    }

    const started = await startBackgroundMusic();

    if (!started) {
        alert(
            "No se pudo reproducir la música. Comprueba que el archivo " +
            "de audio indicado en index.html exista y sea válido."
        );
    }
}

musicToggle?.addEventListener("click", toggleMusic);

if (musicVolume && backgroundMusic) {
    musicVolume.addEventListener("input", () => {
        backgroundMusic.volume = Number(musicVolume.value);
    });
}

// ---------- ANIMACIÓN DE ENTRADA ----------

function playIntro() {
    const intro = $("intro-animation");
    const skipButton = $("skip-intro-button");

    if (!intro) {
        startGame();
        return;
    }

    if (introTimeout !== null) {
        clearTimeout(introTimeout);
        introTimeout = null;
    }

    intro.classList.remove("hidden");
    intro.setAttribute("aria-hidden", "false");

    playSound("finish");

    if (!musicEnabled) startBackgroundMusic();

    const finishIntro = () => {
        if (intro.classList.contains("hidden")) return;

        if (introTimeout !== null) {
            clearTimeout(introTimeout);
            introTimeout = null;
        }

        intro.classList.add("hidden");
        intro.setAttribute("aria-hidden", "true");

        startGame();
    };

    introTimeout = setTimeout(finishIntro, 2800);

    if (skipButton) {
        skipButton.onclick = () => {
            playSound("click");
            finishIntro();
        };
    }
}

// ---------- NAVEGACIÓN ----------

$("start-button")?.addEventListener("click", () => {
    playSound("click");
    showScreen("instructions");
});

$("back-home-button")?.addEventListener("click", () => {
    playSound("click");
    showScreen("home");
});

$("begin-challenge-button")?.addEventListener("click", () => {
    playSound("click");
    showScreen("setup");
});

$("back-instructions-button")?.addEventListener("click", () => {
    playSound("click");
    showScreen("instructions");
});

$("launch-game-button")?.addEventListener("click", async () => {
    playSound("click");

    if (backgroundMusic && !musicEnabled) {
        await startBackgroundMusic();
    }

    playIntro();
});
// ---------- INICIAR Y REINICIAR ----------

function startGame() {
    resetGame();

    gameRunning = true;
    showScreen("game");

    if (backgroundMusic && !musicEnabled) {
        startBackgroundMusic();
    }

    loadChallenge();
    updateScores();
    updateBoard();
    updateTimer();

    startTimer();
    playSound("success");
}

function resetGame() {
    stopTimer();
    stopTurnTimer();

    if (nextChallengeTimeout !== null) {
        clearTimeout(nextChallengeTimeout);
        nextChallengeTimeout = null;
    }

    if (announcementTimeout !== null) {
        clearTimeout(announcementTimeout);
        announcementTimeout = null;
    }

    $("turn-announcement")?.classList.remove("show");

    orangePoints = 0;
    whitePoints = 0;
    piecesUnlocked = 0;
    challengeNumber = 0;
    currentTeam = "orange";
    currentChallenge = null;

    remainingTime = GAME_DURATION;
    turnTimeLeft = NORMAL_TURN_DURATION;

    usedChallenges = [];
    gameRunning = false;
    turnLocked = false;
    hintUsedThisChallenge = false;

    $("song-form")?.reset();

    if ($("feedback-message")) {
        $("feedback-message").textContent = "";
    }

    if ($("song-feedback")) {
        $("song-feedback").textContent = "";
    }

    $("hint-box")?.classList.add("hidden");

    updateScores();
    updateBoard();
    updateTimer();
    updateTurnTimerDisplay();
    updateTeamTheme();
}

// ---------- SELECCIÓN DE RETOS ----------

function getNextChallenge() {
    if (usedChallenges.length >= challenges.length) {
        usedChallenges = [];
    }

    const available = challenges
        .map((challenge, index) => index)
        .filter((index) => !usedChallenges.includes(index));

    const chosenIndex = available[
        Math.floor(Math.random() * available.length)
    ];

    usedChallenges.push(chosenIndex);
    return challenges[chosenIndex];
}

// ---------- CARGAR RETO ----------

function loadChallenge() {
    if (!gameRunning) return;

    currentChallenge = getNextChallenge();
    challengeNumber++;
    hintUsedThisChallenge = false;

    $("challenge-category").textContent = currentChallenge.category;
    $("challenge-number").textContent =
        `RETO ${String(challengeNumber).padStart(2, "0")}`;

    $("challenge-title").textContent = currentChallenge.title;
    $("challenge-description").textContent =
        currentChallenge.description;

    $("challenge-icon").className =
        `fa-solid ${currentChallenge.icon}`;

    $("hint-text").textContent = currentChallenge.hint;
    $("hint-box")?.classList.add("hidden");

    $("feedback-message").textContent = "";
    $("reveal-button").disabled = false;
    $("complete-button").disabled = false;

    $("reveal-button").innerHTML =
        '<i class="fa-solid fa-lightbulb"></i> VER PISTA';

    $("music-area")?.classList.toggle(
        "hidden",
        !currentChallenge.music
    );

    if ($("song-feedback")) {
        $("song-feedback").textContent = currentChallenge.music
            ? "Comparte tu canción antes de que termine el turno."
            : "";
    }

    updateTeamIndicator();
    updateTeamTheme();
    announceTurn();

    const challengeCard = document.querySelector(".challenge-card");

    if (challengeCard) {
        challengeCard.classList.remove("challenge-enter");
        void challengeCard.offsetWidth;
        challengeCard.classList.add("challenge-enter");
    }

    startTurnTimer();
}

// ---------- TEMA DEL EQUIPO ----------

function updateTeamTheme() {
    const gameScreen = $("game-screen");
    if (!gameScreen) return;

    gameScreen.classList.toggle(
        "team-orange-theme",
        currentTeam === "orange"
    );

    gameScreen.classList.toggle(
        "team-white-theme",
        currentTeam === "white"
    );
}

function updateTeamIndicator() {
    const teamName = currentTeam === "orange"
        ? "TEAM ORANGE"
        : "TEAM WHITE";

    const completeButton = $("complete-button");

    if (completeButton) {
        completeButton.innerHTML =
            `<i class="fa-solid fa-check"></i> ${teamName}: COMPLETAR RETO`;
    }
}

// ---------- ANIMACIÓN DEL TURNO ----------

function announceTurn() {
    let overlay = $("turn-announcement");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "turn-announcement";
        overlay.className = "turn-announcement";
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");

        overlay.innerHTML = `
            <div class="turn-announcement-card">
                <i class="turn-announcement-icon fa-solid fa-skateboard"></i>
                <span class="turn-announcement-label">SKATE & SOUND</span>
                <h2 class="turn-announcement-title"></h2>
                <div class="turn-announcement-points"></div>
                <p class="turn-announcement-subtitle">
                    ¡Es tu momento de jugar!
                </p>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    const orangeTurn = currentTeam === "orange";

    overlay.style.setProperty(
        "--turn-color",
        orangeTurn ? "#ff7418" : "#8bcfff"
    );

    overlay.style.setProperty(
        "--turn-glow",
        orangeTurn
            ? "rgba(255, 116, 24, 0.4)"
            : "rgba(139, 207, 255, 0.4)"
    );

    overlay.querySelector(".turn-announcement-title").textContent =
        orangeTurn ? "¡TEAM ORANGE!" : "¡TEAM WHITE!";

    overlay.querySelector(".turn-announcement-points").textContent =
        `PUNTOS: ${orangePoints} — ${whitePoints}`;

    overlay.querySelector(".turn-announcement-subtitle").textContent =
        orangeTurn
            ? "¡Prepárense, equipo naranja!"
            : "¡Es el turno del equipo blanco!";

    // Reiniciar la animación al cambiar de equipo.
    overlay.classList.remove("show");
    void overlay.offsetWidth;
    overlay.classList.add("show");

    if (announcementTimeout !== null) {
        clearTimeout(announcementTimeout);
    }

    announcementTimeout = setTimeout(() => {
        overlay.classList.remove("show");
        announcementTimeout = null;
    }, 1800);
}

// ---------- PISTAS: COSTO DE 15 PUNTOS ----------

$("reveal-button")?.addEventListener("click", () => {
    if (!gameRunning || !currentChallenge || turnLocked) return;

    const hintBox = $("hint-box");
    const revealButton = $("reveal-button");

    if (!hintBox || !revealButton) return;

    const isVisible = !hintBox.classList.contains("hidden");

    if (isVisible) {
        hintBox.classList.add("hidden");
        revealButton.innerHTML =
            '<i class="fa-solid fa-lightbulb"></i> VER PISTA';
        playSound("click");
        return;
    }

    // Solo cobrar la primera vez que se muestra la pista del reto.
    if (!hintUsedThisChallenge) {
        if (currentTeam === "orange") {
            orangePoints = Math.max(0, orangePoints - HINT_PENALTY);
        } else {
            whitePoints = Math.max(0, whitePoints - HINT_PENALTY);
        }

        hintUsedThisChallenge = true;
        updateScores();

        $("feedback-message").textContent =
            "Pista utilizada: -15 puntos para el equipo.";
    }

    hintBox.classList.remove("hidden");
    revealButton.innerHTML =
        '<i class="fa-solid fa-eye-slash"></i> OCULTAR PISTA';

    playSound("click");
});

// ---------- PUNTUACIÓN POR TIEMPO ----------

function calculateChallengePoints() {
    const duration = currentChallenge?.music
        ? MUSIC_TURN_DURATION
        : NORMAL_TURN_DURATION;

    const proportion = Math.max(
        0,
        Math.min(1, turnTimeLeft / duration)
    );

    return Math.max(
        MIN_POINTS_PER_CHALLENGE,
        Math.ceil(MAX_POINTS_PER_CHALLENGE * proportion)
    );
}

// ---------- COMPLETAR RETO ----------

$("complete-button")?.addEventListener("click", () => {
    if (!gameRunning || !currentChallenge || turnLocked) return;

    stopTurnTimer();
    turnLocked = true;

    const completedChallenge = currentChallenge;
    const earnedPoints = calculateChallengePoints();
    const completedTeam = currentTeam;

    if (currentTeam === "orange") {
        orangePoints += earnedPoints;
    } else {
        whitePoints += earnedPoints;
    }

    piecesUnlocked = Math.min(
        piecesUnlocked + 1,
        TOTAL_BOARD_PIECES
    );

    updateScores();
    updateBoard();

    $("feedback-message").textContent =
        `¡Reto completado por ${completedTeam === "orange" ? "TEAM ORANGE" : "TEAM WHITE"}! ` +
        `+${earnedPoints} puntos. Practicaron ${completedChallenge.skill}. ` +
        "¡Escuchen y respeten las ideas de todos!";

    $("complete-button").disabled = true;
    $("reveal-button").disabled = true;

    playSound("success");

    if (piecesUnlocked >= TOTAL_BOARD_PIECES) {
        nextChallengeTimeout = setTimeout(() => {
            nextChallengeTimeout = null;
            finishGame(true);
        }, 1200);
        return;
    }

    currentTeam = currentTeam === "orange" ? "white" : "orange";

    nextChallengeTimeout = setTimeout(() => {
        nextChallengeTimeout = null;
        if (gameRunning) loadChallenge();
    }, 1600);
});

// ---------- MARCADOR ----------

function updateScores() {
    const orangeScore = $("orange-score");
    const whiteScore = $("white-score");

    if (orangeScore) {
        orangeScore.textContent = orangePoints;
        orangeScore.classList.remove("score-pop");
        void orangeScore.offsetWidth;
        orangeScore.classList.add("score-pop");
    }

    if (whiteScore) {
        whiteScore.textContent = whitePoints;
        whiteScore.classList.remove("score-pop");
        void whiteScore.offsetWidth;
        whiteScore.classList.add("score-pop");
    }
}

// ---------- PATINETA COLECTIVA ----------

function updateBoard() {
    const pieces = document.querySelectorAll(".board-piece");

    pieces.forEach((piece, index) => {
        const unlocked = index < piecesUnlocked;
        piece.classList.toggle("unlocked", unlocked);

        if (unlocked) {
            piece.classList.remove("piece-pop");
            void piece.offsetWidth;
            piece.classList.add("piece-pop");

            setTimeout(() => {
                piece.classList.remove("piece-pop");
            }, 700);
        } else {
            piece.classList.remove("piece-pop");
        }
    });

    const counter = $("pieces-counter");

    if (counter) {
        counter.textContent =
            `${piecesUnlocked} / ${TOTAL_BOARD_PIECES} PIEZAS`;
    }
}

// ---------- TEMPORIZADOR DEL RETO ----------

function updateTurnTimerDisplay() {
    const display = $("turn-timer-display");
    const timerBox = $("turn-timer-box");

    if (!display) return;

    const minutes = Math.floor(turnTimeLeft / 60);
    const seconds = turnTimeLeft % 60;

    display.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (timerBox) {
        timerBox.classList.toggle(
            "timer-warning",
            turnTimeLeft <= 5 && turnTimeLeft > 0
        );
    }
}

function stopTurnTimer() {
    if (turnTimerInterval !== null) {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;
    }
}

function startTurnTimer() {
    stopTurnTimer();

    turnTimeLeft = currentChallenge?.music
        ? MUSIC_TURN_DURATION
        : NORMAL_TURN_DURATION;

    turnLocked = false;
    updateTurnTimerDisplay();

    const completeButton = $("complete-button");
    const revealButton = $("reveal-button");

    if (completeButton) completeButton.disabled = false;
    if (revealButton) revealButton.disabled = false;

    turnTimerInterval = setInterval(() => {
        if (!gameRunning || turnLocked) {
            stopTurnTimer();
            return;
        }

        turnTimeLeft = Math.max(0, turnTimeLeft - 1);
        updateTurnTimerDisplay();

        if (turnTimeLeft <= 0) {
            stopTurnTimer();
            turnLocked = true;

            if ($("feedback-message")) {
                $("feedback-message").textContent =
                    "¡TIEMPO AGOTADO! No se suman puntos en este turno.";
            }

            if ($("song-feedback") && currentChallenge?.music) {
                $("song-feedback").textContent =
                    "Se acabó el tiempo para compartir la canción.";
            }

            if (completeButton) completeButton.disabled = true;
            if (revealButton) revealButton.disabled = true;

            currentTeam = currentTeam === "orange" ? "white" : "orange";

            updateTeamIndicator();
            updateTeamTheme();

            nextChallengeTimeout = setTimeout(() => {
                nextChallengeTimeout = null;
                if (gameRunning) loadChallenge();
            }, 1500);
        }
    }, 1000);
}

// ---------- TEMPORIZADOR GENERAL ----------

function startTimer() {
    stopTimer();
    updateTimer();

    timerInterval = setInterval(() => {
        if (!gameRunning) return;

        remainingTime = Math.max(0, remainingTime - 1);
        updateTimer();

        if (remainingTime <= 0) {
            finishGame(false);
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer() {
    const display = $("timer-display");
    if (!display) return;

    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;

    display.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ---------- VALIDACIÓN DE ENLACES ----------

function validateSongUrl(rawLink) {
    if (!rawLink) return "";

    let url;

    try {
        url = new URL(rawLink);
    } catch {
        throw new Error("El enlace no es una URL válida.");
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("El enlace debe usar HTTP o HTTPS.");
    }

    const allowedHosts = [
        "open.spotify.com",
        "music.youtube.com",
        "www.youtube.com",
        "youtube.com",
        "youtu.be",
        "music.apple.com",
        "soundcloud.com",
        "www.soundcloud.com"
    ];

    const hostAllowed = allowedHosts.some((host) =>
        url.hostname === host ||
        url.hostname.endsWith("." + host)
    );

    if (!hostAllowed) {
        throw new Error(
            "Usa un enlace de YouTube, Spotify, Apple Music o SoundCloud."
        );
    }

    return url.href;
}

// ---------- BUSCAR PORTADA MUSICAL ----------

async function findSongArtwork(title, artist) {
    const query = encodeURIComponent(`${title} ${artist}`);
    const apiUrl =
        `https://itunes.apple.com/search?term=${query}&entity=song&limit=5`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) return "";

        const data = await response.json();

        if (!Array.isArray(data.results) || data.results.length === 0) {
            return "";
        }

        const normalizedTitle = title.toLowerCase().trim();
        const normalizedArtist = artist.toLowerCase().trim();

        const bestMatch = data.results.find((track) => {
            const trackTitle = (track.trackName || "").toLowerCase();
            const trackArtist = (track.artistName || "").toLowerCase();

            return (
                trackTitle.includes(normalizedTitle) ||
                normalizedTitle.includes(trackTitle) ||
                trackArtist.includes(normalizedArtist) ||
                normalizedArtist.includes(trackArtist)
            );
        }) || data.results[0];

        return bestMatch.artworkUrl100 || "";
    } catch (error) {
        console.warn("No se pudo encontrar la portada.", error);
        return "";
    }
}

// ---------- COMPARTIR CANCIONES ----------

const songForm = $("song-form");

if (songForm) {
    songForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const feedback = $("song-feedback");

        if (!gameRunning || !currentChallenge?.music) {
            if (feedback) {
                feedback.textContent =
                    "El muro musical está disponible durante los retos musicales.";
            }
            return;
        }

        if (turnLocked) {
            if (feedback) {
                feedback.textContent =
                    "Se acabó el tiempo. Espera al siguiente reto musical.";
            }
            return;
        }

        const name = $("participant-name").value.trim();
        const title = $("song-title").value.trim();
        const artist = $("song-artist").value.trim();
        const reason = $("song-reason").value.trim();
        const rawLink = $("song-link").value.trim();

        if (!name || !title || !artist || !reason) {
            feedback.textContent =
                "Completa tu nombre, canción, artista y motivo.";
            return;
        }

        let link = "";

        try {
            link = validateSongUrl(rawLink);
        } catch (error) {
            feedback.textContent = error.message;
            return;
        }

        const saveButton = $("save-song-button");
        if (saveButton) saveButton.disabled = true;

        feedback.textContent = "Buscando la portada de la canción…";

        const artwork = await findSongArtwork(title, artist);

        // El turno podría haber terminado mientras se buscaba la portada.
        if (!gameRunning || turnLocked || !currentChallenge?.music) {
            feedback.textContent =
                "El turno terminó antes de guardar la canción. Inténtalo en otro reto musical.";
            if (saveButton) saveButton.disabled = false;
            return;
        }

        const song = {
            id: Date.now(),
            name,
            title,
            artist,
            reason,
            link,
            artwork
        };

        songs.push(song);
        lastSongLink = link;

        renderSongs();

        $("open-song-button")?.classList.toggle("hidden", !link);

        feedback.textContent =
            `¡Gracias, ${name}! Tu canción ya está en el muro musical.`;

        playSound("success");
        songForm.reset();

        if (saveButton) saveButton.disabled = false;
    });
}

function renderSongs() {
    const wall = $("song-wall");
    if (!wall) return;

    wall.replaceChildren();

    const heading = document.createElement("div");
    heading.className = "song-wall-heading";

    const headingIcon = document.createElement("i");
    headingIcon.className = "fa-solid fa-record-vinyl";

    const headingTitle = document.createElement("h3");
    headingTitle.textContent = "EL MURO MUSICAL";

    heading.append(headingIcon, headingTitle);
    wall.appendChild(heading);

    if (songs.length === 0) {
        const empty = document.createElement("p");
        empty.className = "song-wall-empty";
        empty.textContent =
            "Aquí aparecerán las canciones que comparta el grupo.";

        wall.appendChild(empty);
        return;
    }

    songs.slice().reverse().forEach((song) => {
        const card = document.createElement("article");
        card.className = "song-card";

        const cover = document.createElement("div");
        cover.className = "song-card-icon";

        if (song.artwork) {
            const image = document.createElement("img");
            image.src = song.artwork;
            image.alt = `Portada de ${song.title}`;
            image.loading = "lazy";

            image.addEventListener("error", () => {
                cover.replaceChildren();

                const fallbackIcon = document.createElement("i");
                fallbackIcon.className = "fa-solid fa-music";
                cover.appendChild(fallbackIcon);
            }, { once: true });

            cover.appendChild(image);
        } else {
            const musicIcon = document.createElement("i");
            musicIcon.className = "fa-solid fa-music";
            cover.appendChild(musicIcon);
        }

        const details = document.createElement("div");
        details.className = "song-card-details";

        const songTitle = document.createElement("h4");
        songTitle.textContent = song.title;

        const songArtist = document.createElement("p");
        songArtist.className = "song-artist";
        songArtist.textContent = `Artista: ${song.artist}`;

        const songOwner = document.createElement("p");
        songOwner.className = "song-owner";
        songOwner.textContent = `Compartida por ${song.name}`;

        const songReason = document.createElement("p");
        songReason.className = "song-reason";
        songReason.textContent = `“${song.reason}”`;

        details.append(
            songTitle,
            songArtist,
            songOwner,
            songReason
        );

        card.append(cover, details);

        if (song.link) {
            const listenLink = document.createElement("a");
            listenLink.className = "song-listen-button";
            listenLink.href = song.link;
            listenLink.target = "_blank";
            listenLink.rel = "noopener noreferrer";
            listenLink.setAttribute(
                "aria-label",
                `Abrir la canción ${song.title}`
            );
            listenLink.innerHTML =
                '<i class="fa-solid fa-play"></i> ESCUCHAR';

            card.appendChild(listenLink);
        }

        wall.appendChild(card);

        requestAnimationFrame(() => {
            card.classList.add("song-card-visible");
        });
    });
}

$("open-song-button")?.addEventListener("click", () => {
    if (!lastSongLink) {
        alert("Primero comparte una canción con enlace.");
        return;
    }

    window.open(lastSongLink, "_blank", "noopener,noreferrer");
});

// ---------- FINALIZAR PARTIDA ----------

$("finish-game-button")?.addEventListener("click", () => {
    finishGame(false);
});

function finishGame(completedBoard) {
    if (!gameRunning) return;

    gameRunning = false;

    stopTimer();
    stopTurnTimer();

    if (nextChallengeTimeout !== null) {
        clearTimeout(nextChallengeTimeout);
        nextChallengeTimeout = null;
    }

    if (announcementTimeout !== null) {
        clearTimeout(announcementTimeout);
        announcementTimeout = null;
    }

    $("turn-announcement")?.classList.remove("show");

    if ($("final-orange-score")) {
        $("final-orange-score").textContent = orangePoints;
    }

    if ($("final-white-score")) {
        $("final-white-score").textContent = whitePoints;
    }

    if (completedBoard) {
        $("result-message").textContent =
            "¡Completaron las diez piezas! Cada reto fue una oportunidad " +
            "para practicar empatía, comunicación e inclusión.";

        playSound("finish");
    } else {
        $("result-message").textContent =
            `Completaron ${piecesUnlocked} de las 10 piezas. ` +
            "Lo importante es reflexionar sobre cómo escuchamos, " +
            "respetamos y comprendemos a otras personas.";

        playSound("success");
    }

    showScreen("result");
}

// ---------- JUGAR DE NUEVO ----------

$("restart-button")?.addEventListener("click", () => {
    playSound("click");
    showScreen("setup");
});

// ---------- TECLADO ----------

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && gameRunning) {
        const shouldFinish = window.confirm(
            "¿Quieres finalizar la partida?"
        );

        if (shouldFinish) finishGame(false);
    }
});

// ---------- INICIALIZACIÓN ----------

updateScores();
updateBoard();
updateTimer();
updateTurnTimerDisplay();
updateMusicButton();
renderSongs();

console.log("SKATE & SOUND está listo para jugar.");
