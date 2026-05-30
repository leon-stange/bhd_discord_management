const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwnerOrAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce-delete')
    .setDescription('Löscht alle Bot-Nachrichten aus dem Ankündigungs-Channel')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel, aus dem gelöscht werden soll (Standard: Ankündigungs-Channel)')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Nur Admins und Owner dürfen löschen
    if (!isOwnerOrAdmin(interaction.member)) {
      return interaction.reply({
        content: `❌ Nur Administratoren können Bot-Nachrichten löschen.`,
        flags: 64,
      });
    }

    const channel = interaction.options.getChannel('channel') || interaction.guild.channels.cache.get(process.env.ANNOUNCE_CHANNEL_ID) || interaction.channel;

    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: '❌ Der angegebene Channel ist kein Text-Channel.',
        flags: 64,
      });
    }

    await interaction.reply({
      content: `⏳ Lösche alle Bot-Nachrichten in <#${channel.id}>...`,
      flags: 64,
    });

    let deletedCount = 0;
    let continueDeleting = true;

    try {
      while (continueDeleting) {
        // Fetch bis zu 100 Nachrichten
        const messages = await channel.messages.fetch({ limit: 100 });

        if (messages.size === 0) {
          continueDeleting = false;
          break;
        }

        // Nur Nachrichten des Bots herausfiltern
        const botMessages = messages.filter(m => m.author.id === interaction.client.user.id);

        if (botMessages.size === 0) {
          // Keine Bot-Nachrichten mehr gefunden → fertig
          continueDeleting = false;
          break;
        }

        // Nachrichten, die jünger als 14 Tage sind, können bulk-deleted werden
        const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const recentBotMessages = botMessages.filter(m => m.createdTimestamp > twoWeeksAgo);
        const oldBotMessages = botMessages.filter(m => m.createdTimestamp <= twoWeeksAgo);

        // Bulk-Delete für Bot-Nachrichten < 14 Tage
        if (recentBotMessages.size > 0) {
          if (recentBotMessages.size === 1) {
            await recentBotMessages.first().delete();
            deletedCount += 1;
          } else {
            const deleted = await channel.bulkDelete(recentBotMessages, true);
            deletedCount += deleted.size;
          }
        }

        // Einzel-Delete für Bot-Nachrichten > 14 Tage
        for (const msg of oldBotMessages.values()) {
          try {
            await msg.delete();
            deletedCount++;
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch {
            // Nachricht evtl. schon gelöscht
          }
        }

        // Prüfen ob noch Bot-Nachrichten im Channel sind
        const remaining = await channel.messages.fetch({ limit: 100 });
        const remainingBot = remaining.filter(m => m.author.id === interaction.client.user.id);
        if (remainingBot.size === 0) {
          continueDeleting = false;
        }
      }

      await interaction.followUp({
        content: `✅ **${deletedCount}** Bot-Nachrichten in <#${channel.id}> gelöscht!`,
        flags: 64,
      });

      console.log(`[ANNOUNCE-DELETE] ${interaction.user.tag} hat ${deletedCount} Nachrichten in #${channel.name} gelöscht.`);
    } catch (error) {
      console.error('[ANNOUNCE-DELETE] Fehler:', error);
      await interaction.followUp({
        content: `❌ Fehler beim Löschen: ${error.message}`,
        flags: 64,
      });
    }
  },
};