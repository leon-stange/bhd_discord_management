const { Events } = require('discord.js');
const { isOwner } = require('../utils/permissions');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // ── Slash-Commands verarbeiten ──────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const botChannelId = process.env.BOT_CHANNEL_ID;

      // Wenn BOT_CHANNEL_ID gesetzt ist, Commands nur dort erlauben
      // Owner-Befehle sind immer überall erlaubt
      if (botChannelId && interaction.channelId !== botChannelId) {
        const command = interaction.client.commands.get(interaction.commandName);
        const isOwnerCommand = command && command.data.name === 'owner';
        const isOwnerUser = isOwner(interaction.user.id);

        if (!isOwnerCommand && !isOwnerUser) {
          return interaction.reply({
            content: `❌ Bitte nutze Befehle nur in <#${botChannelId}>.`,
            flags: 64,
          });
        }
      }

      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        console.error(`[ERROR] Kein Command "${interaction.commandName}" gefunden.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Es ist ein Fehler bei der Ausführung des Commands aufgetreten!', flags: 64 });
          } else {
            await interaction.reply({ content: 'Es ist ein Fehler bei der Ausführung des Commands aufgetreten!', flags: 64 });
          }
        } catch (err) {
          console.error('[ERROR HANDLER] Konnte Fehler-Antwort nicht senden:', err.message);
        }
      }
    }
  },
};