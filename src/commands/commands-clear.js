const { SlashCommandBuilder } = require('discord.js');
const { isOwnerOrAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commands-clear')
    .setDescription('Leert den Commands-Channel (löscht alle Nachrichten)')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel, der geleert werden soll (Standard: Bot-Channel)')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Nur Admins und Owner dürfen den Channel leeren
    if (!isOwnerOrAdmin(interaction.member)) {
      return interaction.reply({
        content: '❌ Nur Administratoren können den Commands-Channel leeren.',
        flags: 64,
      });
    }

    const channel = interaction.options.getChannel('channel') || interaction.guild.channels.cache.get(process.env.BOT_CHANNEL_ID) || interaction.channel;

    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: '❌ Der angegebene Channel ist kein Text-Channel.',
        flags: 64,
      });
    }

    await interaction.reply({
      content: `⏳ Leere <#${channel.id}>...`,
      flags: 64,
    });

    let deletedCount = 0;
    let continueDeleting = true;

    try {
      while (continueDeleting) {
        const messages = await channel.messages.fetch({ limit: 100 });

        if (messages.size === 0) {
          continueDeleting = false;
          break;
        }

        const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const recentMessages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);
        const oldMessages = messages.filter(m => m.createdTimestamp <= twoWeeksAgo);

        // Bulk-Delete für Nachrichten < 14 Tage
        if (recentMessages.size > 0) {
          if (recentMessages.size === 1) {
            await recentMessages.first().delete();
            deletedCount += 1;
          } else {
            const deleted = await channel.bulkDelete(recentMessages, true);
            deletedCount += deleted.size;
          }
        }

        // Einzel-Delete für Nachrichten > 14 Tage
        for (const msg of oldMessages.values()) {
          try {
            await msg.delete();
            deletedCount++;
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch {
            // Nachricht evtl. schon gelöscht
          }
        }

        // Wenn keine Nachrichten mehr im Channel, fertig
        const remaining = await channel.messages.fetch({ limit: 1 });
        if (remaining.size === 0) {
          continueDeleting = false;
        }
      }

      await interaction.followUp({
        content: `✅ **${deletedCount}** Nachrichten in <#${channel.id}> gelöscht!`,
        flags: 64,
      });

      console.log(`[COMMANDS-CLEAR] ${interaction.user.tag} hat ${deletedCount} Nachrichten in #${channel.name} gelöscht.`);
    } catch (error) {
      console.error('[COMMANDS-CLEAR] Fehler:', error);
      await interaction.followUp({
        content: `❌ Fehler beim Löschen: ${error.message}`,
        flags: 64,
      });
    }
  },
};