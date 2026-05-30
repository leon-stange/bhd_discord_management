const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwner, isOwnerOrAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Zeigt alle verfügbaren Befehle des Bots'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🛡️ Management Bot – Befehle')
      .setDescription('Hier sind alle verfügbaren Befehle:')
      .addFields(
        { name: 'ℹ️ Allgemein', value: '`/help` – Diese Hilfe anzeigen\n`/ping` – Bot-Latenz überprüfen\n`/userinfo` – Infos über einen Nutzer anzeigen', inline: false },
        { name: '📢 Ankündigungen', value: '`/announce` – Ankündigung erstellen\n`/announce-delete` – Alle Ankündigungen löschen\n`/embed` – Benutzerdefiniertes Embed erstellen', inline: false },
      )
      .setFooter({ text: 'Discord Management Bot' })
      .setTimestamp();

    // Admin-Befehle nur für Admins anzeigen
    if (isOwnerOrAdmin(interaction.member)) {
      embed.addFields({
        name: '🔐 Admin-Befehle',
        value: '`/announce` – Ankündigung erstellen\n`/announce-delete` – Bot-Nachrichten löschen\n`/embed` – Embed erstellen\n`/commands-clear` – Commands-Channel leeren',
        inline: false,
      });
    }

    // Owner-Befehle nur für den Owner anzeigen
    if (isOwner(interaction.user.id)) {
      embed.addFields({
        name: '👑 Owner-Befehle',
        value: '`/owner status` – Bot-Status anzeigen\n`/owner reload` – Commands neu laden\n`/owner servers` – Server-Liste anzeigen',
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};