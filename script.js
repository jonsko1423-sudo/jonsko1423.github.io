(function () {
  "use strict";

  /*
    ANPASSUNG:
    Ersetze später einfach die Werte in dieser CONFIG.
    Lege eigene Dateien unter assets/ ab, z.B. assets/background.jpg,
    assets/logo.png oder assets/music.mp3. Fehlt eine Datei, bleibt das
    Interface trotzdem funktionsfähig und nutzt die CSS-Atmosphäre.
  */
  var CONFIG = {
    serverName: "Unity Task Force",
    fallbackServerName: "Imperial RP Server",
    backgroundImage: "assets/background.jpg",
    logoImage: "assets/logo.png",
    musicPath: "assets/music.mp3",
    audioVolume: 0.24,
    loadingSpeed: {
      minStep: 0.25,
      maxStep: 1.45,
      intervalMs: 620,
      softCap: 96
    },
    bootMessages: [
      "UNITY TASK FORCE NETWORK INITIALISIERUNG",
      "IDENTITÄT WIRD GEPRÜFT",
      "HOLONET-VERBINDUNG STABILISIERT",
      "ZUGRIFF AUF IMPERIALES DATENNETZ GENEHMIGT",
      "SPIELERKENNUNG AN MANPHA OPERATIONS COMMAND UEBERMITTELT",
      "TAKTISCHES EINSATZINTERFACE WIRD GEÖFFNET"
    ],
    loadingMessages: [
      "Synchronisiere Einsatzdaten...",
      "Lade imperiale Sicherheitsprotokolle...",
      "Initialisiere Kommunikationskanäle...",
      "Uebertrage Missionsdaten...",
      "Prüfe Ausrüstung und Sicherheitsfreigaben...",
      "Stabilisiere Holonet-Verbindung zur ISD Unity...",
      "Registriere Zugriff im imperialen Einsatznetzwerk..."
    ],
    tips: [
      "Befolge die imperiale Befehlskette.",
      "Respektiere RP-Situationen und unterbrich sie nicht unnötig.",
      "Nutze den Funk diszipliniert und situationsgerecht.",
      "Befehle der Navy und des Oberkommandos sind zu beachten.",
      "FailRP, RDM und OOC-Störungen werden sanktioniert.",
      "Bleibe im Charakter, solange keine klare OOC-Situation vorliegt.",
      "Für das Imperium: Disziplin, Ordnung und Präzision."
    ],
    briefings: [
      "Neue Einsatzkräfte werden an Bord der ISD Unity registriert. Halte dich bereit für Kommandostruktur, Patrouillenrouten und imperiale Sicherheitsprotokolle.",
      "Manpha Operations Command meldet erhöhte Aktivität im lokalen Sektor. Einsatzdaten werden geladen und an die zuständigen Einheiten verteilt.",
      "Die Unity Task Force sammelt imperiale Restkräfte für geordnete Operationen nach Endor. Loyalität und Disziplin haben Priorität.",
      "Deine Kennung wurde für den Zugriff auf das imperiale Einsatznetzwerk vorgemerkt. Warte auf weitere Befehle des diensthabenden Kommandos."
    ]
  };

  var elements = {
    backgroundImage: document.getElementById("backgroundImage"),
    logoImage: document.getElementById("logoImage"),
    imperialMark: document.getElementById("imperialMark"),
    bootScreen: document.getElementById("bootScreen"),
    bootLog: document.getElementById("bootLog"),
    interfaceShell: document.getElementById("interfaceShell"),
    serverName: document.getElementById("serverName"),
    playerName: document.getElementById("playerName"),
    steamId: document.getElementById("steamId"),
    mapName: document.getElementById("mapName"),
    accessCode: document.getElementById("accessCode"),
    terminalOutput: document.getElementById("terminalOutput"),
    briefingText: document.getElementById("briefingText"),
    tipText: document.getElementById("tipText"),
    loadingStatus: document.getElementById("loadingStatus"),
    loadingPercent: document.getElementById("loadingPercent"),
    progressBar: document.getElementById("progressBar"),
    audio: document.getElementById("ambientAudio"),
    audioToggle: document.getElementById("audioToggle"),
    audioLabel: document.getElementById("audioLabel"),
    starfield: document.getElementById("starfield")
  };

  var state = {
    progress: 0,
    statusIndex: 0,
    tipIndex: Math.floor(Math.random() * CONFIG.tips.length),
    briefingIndex: Math.floor(Math.random() * CONFIG.briefings.length),
    terminalCount: 0,
    audioEnabled: false
  };

  function getQueryParams() {
    var params = {};
    var query = window.location.search.replace(/^\?/, "");

    if (!query) {
      return params;
    }

    query.split("&").forEach(function (part) {
      var pair = part.split("=");
      var key = decodeURIComponent(pair[0] || "").toLowerCase();
      var value = decodeURIComponent((pair.slice(1).join("=") || "").replace(/\+/g, " "));

      if (key) {
        params[key] = value;
      }
    });

    return params;
  }

  function pickParam(params, keys, fallback) {
    for (var i = 0; i < keys.length; i += 1) {
      if (params[keys[i]]) {
        return params[keys[i]];
      }
    }

    return fallback;
  }

  function sanitizeText(value, fallback) {
    var text = String(value || "").replace(/[<>]/g, "").trim();
    return text || fallback;
  }

  function leftPad(value, length, fill) {
    var text = String(value);
    var character = fill || "0";

    while (text.length < length) {
      text = character + text;
    }

    return text;
  }

  function createAccessCode(seed) {
    var source = String(seed || "UNITY");
    var hash = 0;

    for (var i = 0; i < source.length; i += 1) {
      hash = ((hash << 5) - hash) + source.charCodeAt(i);
      hash |= 0;
    }

    return "UTF-" + leftPad(Math.abs(hash).toString().slice(0, 4), 4, "0");
  }

  function loadOptionalAssets() {
    var bg = new Image();
    bg.onload = function () {
      elements.backgroundImage.style.backgroundImage = "url('" + CONFIG.backgroundImage + "')";
      elements.backgroundImage.classList.add("is-loaded");
    };
    bg.onerror = function () {};
    bg.src = CONFIG.backgroundImage;

    elements.logoImage.onload = function () {
      elements.imperialMark.classList.add("has-logo");
    };
    elements.logoImage.onerror = function () {};
    elements.logoImage.src = CONFIG.logoImage;

    elements.audio.src = CONFIG.musicPath;
    elements.audio.volume = CONFIG.audioVolume;
  }

  function initializePlayerInfo() {
    var params = getQueryParams();
    applyPlayerInfo({
      server: pickParam(params, ["server", "servername", "hostname"], CONFIG.serverName || CONFIG.fallbackServerName),
      name: pickParam(params, ["name", "player", "username"], "Unbekannte Kennung"),
      steamid: pickParam(params, ["steamid", "steam", "communityid"], "Unbekannte Kennung"),
      map: pickParam(params, ["map", "mapname", "level"], "Karte wird geladen")
    });
  }

  function applyPlayerInfo(info) {
    var server = sanitizeText(info.server, CONFIG.fallbackServerName);
    var name = sanitizeText(info.name, "Unbekannte Kennung");
    var steamid = sanitizeText(info.steamid, "Unbekannte Kennung");
    var map = sanitizeText(info.map, "Karte wird geladen");

    elements.serverName.textContent = server;
    elements.playerName.textContent = name;
    elements.steamId.textContent = steamid;
    elements.mapName.textContent = map;
    elements.accessCode.textContent = createAccessCode(steamid + name + map);
  }

  function typeLine(text, callback) {
    var line = document.createElement("div");
    var index = 0;
    line.className = "boot-line cursor";
    elements.bootLog.appendChild(line);

    var timer = window.setInterval(function () {
      line.textContent = text.slice(0, index);
      index += 1;

      if (index > text.length) {
        window.clearInterval(timer);
        line.classList.remove("cursor");
        window.setTimeout(callback, 210);
      }
    }, 21 + Math.random() * 16);
  }

  function runBootSequence() {
    var index = 0;

    function next() {
      if (index >= CONFIG.bootMessages.length) {
        window.setTimeout(function () {
          elements.bootScreen.classList.add("is-complete");
          elements.interfaceShell.classList.add("is-active");
          pushTerminal("TAKTISCHES INTERFACE AKTIVIERT");
          pushTerminal("ZUGRIFF AUTORISIERT // WILLKOMMEN IM DIENST");
        }, 620);
        return;
      }

      typeLine(CONFIG.bootMessages[index], function () {
        index += 1;
        next();
      });
    }

    next();
  }

  window.GameDetails = function (servername, serverurl, mapname, maxplayers, steamid, gamemode, volume, language) {
    applyPlayerInfo({
      server: servername || CONFIG.serverName,
      name: elements.playerName.textContent || "Unbekannte Kennung",
      steamid: steamid || "Unbekannte Kennung",
      map: mapname || "Karte wird geladen"
    });

    if (!isNaN(parseFloat(volume))) {
      elements.audio.volume = Math.max(0, Math.min(1, parseFloat(volume) * CONFIG.audioVolume));
    }

    pushTerminal("GMOD-SERVERDATEN EMPFANGEN");
  };

  function pushTerminal(message) {
    var entry = document.createElement("div");
    entry.className = "terminal-entry";
    entry.innerHTML = "<span>[" + getTimeCode() + "]</span><strong>" + message + "</strong>";
    elements.terminalOutput.appendChild(entry);
    state.terminalCount += 1;

    while (elements.terminalOutput.children.length > 5) {
      elements.terminalOutput.removeChild(elements.terminalOutput.children[0]);
    }
  }

  function getTimeCode() {
    var date = new Date();
    var h = leftPad(date.getHours(), 2, "0");
    var m = leftPad(date.getMinutes(), 2, "0");
    var s = leftPad(date.getSeconds(), 2, "0");
    return h + ":" + m + ":" + s;
  }

  function updateProgress() {
    var cfg = CONFIG.loadingSpeed;
    var easing = Math.max(0.18, 1 - state.progress / 115);
    var step = (cfg.minStep + Math.random() * cfg.maxStep) * easing;

    state.progress = Math.min(cfg.softCap, state.progress + step);

    if (state.progress > 91 && Math.random() > 0.58) {
      state.progress = Math.min(cfg.softCap, state.progress + 0.08);
    }

    var rounded = Math.floor(state.progress);
    elements.progressBar.style.width = rounded + "%";
    elements.loadingPercent.textContent = leftPad(rounded, 2, "0") + "%";

    if (Math.random() > 0.42) {
      state.statusIndex = (state.statusIndex + 1) % CONFIG.loadingMessages.length;
      elements.loadingStatus.textContent = CONFIG.loadingMessages[state.statusIndex];
      pushTerminal(CONFIG.loadingMessages[state.statusIndex].replace("...", "").toUpperCase());
    }
  }

  function rotateTip() {
    state.tipIndex = (state.tipIndex + 1) % CONFIG.tips.length;
    elements.tipText.textContent = CONFIG.tips[state.tipIndex];
  }

  function rotateBriefing() {
    state.briefingIndex = (state.briefingIndex + 1) % CONFIG.briefings.length;
    elements.briefingText.textContent = CONFIG.briefings[state.briefingIndex];
    pushTerminal("BRIEFING-DATEN AKTUALISIERT");
  }

  function initializeAudio() {
    elements.audioToggle.addEventListener("click", function () {
      if (state.audioEnabled) {
        elements.audio.pause();
        state.audioEnabled = false;
        elements.audioToggle.classList.remove("is-active");
        elements.audioLabel.textContent = "Audio aktivieren";
        return;
      }

      elements.audio.volume = CONFIG.audioVolume;
      elements.audio.play().then(function () {
        state.audioEnabled = true;
        elements.audioToggle.classList.add("is-active");
        elements.audioLabel.textContent = "Audio deaktivieren";
      }).catch(function () {
        state.audioEnabled = false;
        elements.audioToggle.classList.remove("is-active");
        elements.audioLabel.textContent = "Audio nicht verfügbar";
        window.setTimeout(function () {
          elements.audioLabel.textContent = "Audio aktivieren";
        }, 2200);
      });
    });
  }

  function initializeStarfield() {
    var canvas = elements.starfield;
    var ctx = canvas.getContext("2d");
    var stars = [];
    var width = 0;
    var height = 0;
    var count = 140;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      stars = [];

      for (var i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 1.4 + 0.2,
          speed: Math.random() * 0.22 + 0.04,
          alpha: Math.random() * 0.75 + 0.18
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < stars.length; i += 1) {
        var star = stars[i];
        star.x -= star.speed * star.z;

        if (star.x < -4) {
          star.x = width + 4;
          star.y = Math.random() * height;
        }

        ctx.fillStyle = "rgba(232, 238, 240," + star.alpha + ")";
        ctx.fillRect(star.x, star.y, star.z, star.z);
      }

      window.requestAnimationFrame(frame);
    }

    resize();
    frame();
    window.addEventListener("resize", resize);
  }

  function startLoops() {
    elements.loadingStatus.textContent = CONFIG.loadingMessages[0];
    elements.tipText.textContent = CONFIG.tips[state.tipIndex];
    elements.briefingText.textContent = CONFIG.briefings[state.briefingIndex];

    window.setInterval(updateProgress, CONFIG.loadingSpeed.intervalMs);
    window.setInterval(rotateTip, 5200);
    window.setInterval(rotateBriefing, 9500);
    window.setInterval(function () {
      var sweepMessages = [
        "IFF-SIGNAL BESTAETIGT",
        "MANPHA-ORBIT SCAN ABGESCHLOSSEN",
        "NAVY-KANAL VERSCHLUESSELT",
        "EINSATZDATEN WERDEN GELADEN",
        "UNITY TASK FORCE REGISTRIERUNG AKTIV"
      ];
      pushTerminal(sweepMessages[Math.floor(Math.random() * sweepMessages.length)]);
    }, 4300);
  }

  function init() {
    loadOptionalAssets();
    initializePlayerInfo();
    initializeAudio();
    initializeStarfield();
    startLoops();
    runBootSequence();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
