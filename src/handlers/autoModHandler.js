const { EmbedBuilder } = require('discord.js');

// ─── Konfiguration ────────────────────────────────────────────────
const SPAM_CONFIG = {
  maxMessages: 5,        // Max. Nachrichten im Zeitfenster
  timeWindow: 5000,     // Zeitfenster in ms (5 Sekunden)
  muteDuration: 300000, // Timeout-Dauer in ms (5 Minuten)
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
  const userId = message.author.id;

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
          await member.timeout(SPAM_CONFIG.muteDuration, 'Auto-Mod: Spam erkannt');
        }
      }

      // Warnung im Channel
      try {
        const warning = await message.channel.send(
          `⚠️ <@${message.author.id}> Deine Nachricht wurde automatisch gelöscht.\n` +
          `**Grund:** ${violations.join(', ')}${violations.includes('Spam') ? '\nDu wurdest für 5 Minuten stummgeschaltet.' : ''}`
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
      console.error('[AUTO-MOD] Fehler bei der Moderation:', error.message);
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