# 🛡️ BHD Discord Management Bot

Discord Management Bot für Server-Verwaltung, Moderation und Administration.

## 📁 Projektstruktur

```
bhd_discord_management/
├── .env.example          # Vorlage für Umgebungsvariablen
├── package.json          # Projekt-Konfiguration & Dependencies
├── README.md             # Dokumentation
└── src/
    ├── index.js           # Bot-Einstiegspunkt
    ├── deploy-commands.js  # Slash-Commands registrieren
    ├── commands/           # Slash-Commands
    │   ├── help.js        # Hilfe-Befehl
    │   └── ping.js        # Ping/Latenz-Befehl
    ├── events/             # Discord-Events
    │   ├── ready.js       # Bot-Ready Event
    │   └── interactionCreate.js  # Interaction-Handler
    └── utils/              # Hilfsfunktionen
        └── permissions.js  # Berechtigungs-Utilities
```

## 🚀 Einrichtung

### 1. Dependencies installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

Kopiere `.env.example` zu `.env` und fülle die Werte aus:

```bash
cp .env.example .env
```

Folgende Werte müssen gesetzt werden:

| Variable | Beschreibung |
|---|---|
| `DISCORD_TOKEN` | Bot-Token aus dem Discord Developer Portal |
| `CLIENT_ID` | Application-ID des Bots |
| `GUILD_ID` | ID des Discord-Servers |
| `OWNER_ID` | Discord-ID des Bot-Owners |
| `BOT_CHANNEL_ID` | Channel, in dem Befehle erlaubt sind (optional) |
| `LOG_CHANNEL_ID` | Channel für Bot-Logs (optional) |
| `ADMIN_ROLE_ID` | ID der Admin-Rolle (optional) |
| `MODERATOR_ROLE_ID` | ID der Moderator-Rolle (optional) |

### 3. Slash-Commands registrieren

```bash
npm run deploy
```

### 4. Bot starten

```bash
# Produktion
npm start

# Entwicklung (mit Auto-Reload)
npm run dev
```

## 📜 Verfügbare Befehle

| Befehl | Beschreibung |
|---|---|
| `/help` | Zeigt alle verfügbaren Befehle |
| `/ping` | Zeigt die Bot-Latenz |

## 🔧 Entwicklung

Neue Commands kommen in `src/commands/`, neue Events in `src/events/`. Nach dem Hinzufügen neuer Commands müssen diese mit `npm run deploy` neu registriert werden.