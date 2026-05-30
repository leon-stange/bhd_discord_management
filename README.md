# 🛡️ BHD Discord Management Bot

Discord Management Bot für Server-Verwaltung, Moderation und Administration.

## 📁 Projektstruktur

```
bhd_discord_management/
├── .env.example              # Vorlage für Umgebungsvariablen
├── .gitignore                # Git-Ignore (node_modules, .env)
├── package.json              # Projekt-Konfiguration & Dependencies
├── README.md                 # Dokumentation
└── src/
    ├── index.js               # Bot-Einstiegspunkt
    ├── deploy-commands.js     # Slash-Commands registrieren
    ├── commands/              # Slash-Commands
    │   ├── ping.js            # Ping/Latenz-Befehl
    │   ├── help.js            # Hilfe-Befehl
    │   ├── userdetail.js      # Nutzer-Infos abrufen
    │   ├── serverinfo.js      # Server-Infos abrufen
    │   ├── botinfo.js          # Bot-Infos abrufen
    │   ├── announce.js        # Ankündigung erstellen
    │   ├── announce-delete.js # Ankündigungen löschen
    │   ├── embed.js           # Benutzerdefiniertes Embed erstellen
    │   └── commands-clear.js  # Channel-Nachrichten löschen    │   └── verify.js           # Nutzer manuell verifizieren    ├── events/                # Discord-Events
    │   ├── ready.js           # Bot-Ready Event
    │   ├── interactionCreate.js  # Interaction-Handler
    │   └── messageCreate.js   # Message Event (Auto-Mod)
    ├── handlers/              # Handler-Logik
    │   └── autoModHandler.js  # Auto-Mod (Anti-Spam, Anti-Link, Bad-Words)
    └── utils/                 # Hilfsfunktionen
        └── permissions.js     # Berechtigungs-Utilities
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
| `LOG_CHANNEL_ID` | Channel für Bot-Logs |
| `ANNOUNCE_CHANNEL_ID` | Channel für Ankündigungen (Standard für `/announce`) |
| `ADMIN_ROLE_ID` | ID der Admin-Rolle |
| `MODERATOR_ROLE_ID` | ID der Moderator-Rollen (kommagetrennt für mehrere) |
| `UNVERIFIED_ROLE_ID` | ID der Unverifiziert-Rolle (wird bei /verify entfernt) |
| `VERIFIED_ROLE_ID` | ID der Verifiziert-Rolle (wird bei /verify vergeben) |
| `BAD_WORDS` | Verbotene Wörter, kommagetrennt (optional) |

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

### ℹ️ Allgemein

| Befehl | Beschreibung | Berechtigung |
|---|---|---|
| `/help` | Zeigt alle verfügbaren Befehle an | Jeder |
| `/ping` | Zeigt die Bot- und API-Latenz an | Jeder |

### 📢 Ankündigungen

| Befehl | Beschreibung | Berechtigung |
|---|---|---|
| `/announce nachricht:...` | Erstellt eine Ankündigung im Ankündigungs-Channel | Admin / Owner |
| `/announce nachricht:... titel:...` | Ankündigung mit eigenem Titel-Zusatz | Admin / Owner |
| `/announce nachricht:... farbe:...` | Ankündigung mit eigener Farbe (Hex-Code) | Admin / Owner |
| `/announce nachricht:... bild:...` | Ankündigung mit Bild | Admin / Owner |
| `/announce nachricht:... channel:...` | Ankündigung in einem bestimmten Channel | Admin / Owner |
| `/announce-delete` | Löscht alle Bot-Nachrichten im Ankündigungs-Channel | Admin / Owner |
| `/embed titel:... beschreibung:...` | Erstellt ein benutzerdefiniertes Embed | Admin / Owner |
| `/commands-clear` | Löscht alle Nachrichten in einem Channel | Admin / Owner |

> **Hinweis:** Der Titel bei `/announce` wird automatisch mit **"📢 Saalekreis-RP \| Neuigkeit"** vorangestellt. Ohne Titel-Zusatz heißt es einfach "📢 Saalekreis-RP \| Neuigkeit".

### 🛡️ Moderation

| Befehl | Beschreibung | Berechtigung |
|---|---|---|
| `/userdetail` | Zeigt detaillierte Infos über einen Nutzer an | Moderator / Admin / Owner |
| `/verify` | Verifiziert einen Nutzer manuell (entfernt Unverifiziert-Rolle, gibt Verifiziert-Rolle) | Moderator / Admin / Owner |
| `/serverinfo` | Zeigt detaillierte Infos über den Server an | Admin / Owner |
| `/botinfo` | Zeigt detaillierte Infos über den Bot an | Admin / Owner |

### 🛡️ Auto-Mod (automatisch)

Die Auto-Mod greift automatisch auf **alle Nutzer** und benötigt keinen Befehl:

| Feature | Beschreibung |
|---|---|
| **Anti-Spam** | Mehr als 5 Nachrichten in 5 Sekunden → Nachricht löschen + 5 Min Timeout |
| **Anti-Link** | Alle URLs werden automatisch gelöscht |
| **Anti-Discord-Invite** | Discord-Einladungslinks werden blockiert |
| **Bad-Word-Filter** | Verbotene Wörter (konfigurierbar über `BAD_WORDS` in `.env`) werden gelöscht. Im Channel wird nur "Unangemessenes Wort" angezeigt, im Log-Channel steht das genaue Wort |
| **Mod-Log** | Jeder Auto-Mod-Eingriff wird im Log-Channel protokolliert (inkl. Originalnachricht) |
| **Channel-Warnung** | Der Nutzer bekommt eine Warnung im Channel (wird nach 10 Sek. automatisch gelöscht) |

## 🔧 Entwicklung

Neue Commands kommen in `src/commands/`, neue Events in `src/events/`, Handler in `src/handlers/`. Nach dem Hinzufügen neuer Commands müssen diese mit `npm run deploy` neu registriert werden.