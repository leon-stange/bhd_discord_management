const { EmbedBuilder } = require('discord.js');

// ─── Konfiguration ────────────────────────────────────────────────
const SPAM_CONFIG = {
  maxMessages: 4,         // Max. Nachrichten im Zeitfenster
  timeWindow: 6000,      // Zeitfenster in ms (6 Sekunden)
  muteDuration: 300000,  // Timeout-Dauer in ms (5 Minuten)
  deleteRecentCount: 5,   // Anzahl der letzten Nachrichten die bei Spam gelöscht werden
};

const LINK_REGEX = /https?:\/\/[^\s]+/i;
const DISCORD_INVITE_REGEX = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[^\s]+/i;

// ─── Bad Words Liste ──────────────────────────────────────────────
// Wird aus .env geladen (kommagetrennt), Fallback auf leeres Array
const BAD_WORDS = (process.env.BAD_WORDS || '')
  .split(',')
  .map(w => w.trim().toLowerCase())
  .filter(w => w.length > 0);

// ─── Spam-Tracking ────────────────────────────────────────────────
const userMessageMap = new Map();

/**
 * Prüft eine Nachricht auf Verstöße und greift ein.
 * @param {import('discord.js').Message} message
 */
async function handleMessage(message) {
  // Bots und DMs ignorieren
  if (message.author.bot || !message.guild) return;

  const violations = [];

  // ── Spam-Flag prüfen (bereits als Spammer markiert?) ────────────
  const userId = message.author.id;
  const userEntry = userMessageMap.get(userId);
  if (userEntry && userEntry.includes('SPAM_FLAG')) {
    // Noch im Timeout-Fenster? Dann sofort löschen
    const firstTimestamp = userEntry.find(t => typeof t === 'number');
    if (firstTimestamp && (Date.now() - firstTimestamp) < SPAM_CONFIG.muteDuration) {
      try {
        await message.delete();
      } catch {}
      return;
    } else {
      // Timeout abgelaufen, Flag entfernen
      userMessageMap.delete(userId);
    }
  }

  // ── Anti-Link ──────────────────────────────────────────────────
  if (DISCORD_INVITE_REGEX.test(message.content)) {
    violations.push('Discord-Einladungslink');
  } else if (LINK_REGEX.test(message.content)) {
    violations.push('Link');
  }

  // ── Bad-Word-Filter ─────────────────────────────────────────────
  const lowerContent = message.content.toLowerCase();
  const matchedBadWord = BAD_WORDS.find(word => lowerContent.includes(word));
  if (matchedBadWord) {
    violations.push(`Bad Word: "${matchedBadWord}"`);
  }

  // ── Anti-Spam ──────────────────────────────────────────────────
  const now = Date.now();

  if (!userMessageMap.has(userId)) {
    userMessageMap.set(userId, []);
  }

  const userMessages = userMessageMap.get(userId);
  userMessages.push(now);

  // Alte Einträge außerhalb des Zeitfensters entfernen
  const filtered = userMessages.filter(ts => now - ts < SPAM_CONFIG.timeWindow);
  userMessageMap.set(userId, filtered);

  if (filtered.length >= SPAM_CONFIG.maxMessages) {
    violations.push('Spam');
    // Spam-Flag setzen, damit weitere Nachrichten sofort gelöscht werden
    userMessageMap.set(userId, [...filtered, 'SPAM_FLAG']);
  }

  // ── Maßnahmen ergreifen ────────────────────────────────────────
  if (violations.length > 0) {
    try {
      // Nachricht löschen
      await message.delete();

      // Timeout (5 Minuten) bei Spam, sonst Warnung
      if (violations.includes('Spam')) {
        const member = await message.guild.members.fetch(userId).catch(() => null);
        if (member) {
          try {
            await member.timeout(SPAM_CONFIG.muteDuration, 'Auto-Mod: Spam erkannt');
          } catch (timeoutError) {
            console.error('[AUTO-MOD] Timeout fehlgeschlagen:', timeoutError.message);
          }
        } else {
          console.error('[AUTO-MOD] Mitglied nicht gefunden für Timeout');
        }

        // Zusätzlich: Letzte Nachrichten des Nutzers im Channel löschen
        try {
          const recentMessages = await message.channel.messages.fetch({ limit: SPAM_CONFIG.deleteRecentCount });
          const userRecentMessages = recentMessages.filter(m => m.author.id === userId);
          if (userRecentMessages.size > 0) {
            await message.channel.bulkDelete(userRecentMessages, true).catch(() => {});
          }
        } catch {
          // Fehler beim Bulk-Delete ignorieren
        }
      }

      // Warnung im Channel (Bad Words nicht anzeigen)
      const channelViolations = violations.map(v => v.startsWith('Bad Word:') ? 'Unangemessenes Wort' : v);
      try {
        const warning = await message.channel.send(
          `⚠️ <@${message.author.id}> Deine Nachricht wurde automatisch gelöscht.\n` +
          `**Grund:** ${channelViolations.join(', ')}${violations.includes('Spam') ? '\nDu wurdest für 5 Minuten stummgeschaltet.' : ''}`
        );
        // Warnung nach 10 Sekunden löschen
        setTimeout(() => warning.delete().catch(() => {}), 10000);
      } catch {
        // Warnung konnte nicht gesendet werden
      }

      // Log-Eintrag
      await sendModLog(message, violations);

      console.log(`[AUTO-MOD] ${message.author.tag} → ${violations.join(', ')}`);
    } catch (error) {
      console.error('[AUTO-MOD] Fehler bei der Moderation:', error.code || error.message);
      if (error.code === 50013) {
        console.error('[AUTO-MOD] ⚠️ Missing Permissions! Der Bot braucht folgende Berechtigungen:');
        console.error('[AUTO-MOD]   - Nachrichten verwalten (Manage Messages)');
        console.error('[AUTO-MOD]   - Mitglieder timeouten (Moderate Members)');
        console.error('[AUTO-MOD]   - Nachrichten senden (Send Messages)');
      }
    }
  }
}

/**
 * Sendet einen Log-Eintrag in den Log-Channel.
 */
async function sendModLog(message, violations) {
  const logChannelId = process.env.LOG_CHANNEL_ID;
  if (!logChannelId) return;

  const logChannel = message.guild.channels.cache.get(logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle('🛡️ Auto-Mod Eingriff')
    .addFields(
      { name: 'Nutzer', value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
      { name: 'Kanal', value: `<#${message.channel.id}>`, inline: true },
      { name: 'Verstoß', value: violations.join(', '), inline: true },
      { name: 'Nachricht', value: message.content.length > 1024 ? message.content.substring(0, 1021) + '...' : message.content, inline: false },
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
}

/**
 * Bereinigt veraltete Spam-Einträge regelmäßig.
 */
function cleanupSpamTracker() {
  const now = Date.now();
  for (const [userId, timestamps] of userMessageMap.entries()) {
    const filtered = timestamps.filter(ts => now - ts < SPAM_CONFIG.timeWindow);
    if (filtered.length === 0) {
      userMessageMap.delete(userId);
    } else {
      userMessageMap.set(userId, filtered);
    }
  }
}

// Bereinigung alle 30 Sekunden
setInterval(cleanupSpamTracker, 30000);

module.exports = { handleMessage };