const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwner } = require('../utils/permissions');

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
        { name: 'ℹ️ Allgemein', value: '`/help` – Diese Hilfe anzeigen\n`/ping` – Bot-Latenz überprüfen', inline: false },
      )
      .setFooter({ text: 'Discord Management Bot' })
      .setTimestamp();

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