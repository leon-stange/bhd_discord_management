const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Zeigt die Latenz des Bots'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply(
      `🏓 Pong!\n` +
      `**Bot-Latenz:** ${latency}ms\n` +
      `**API-Latenz:** ${interaction.client.ws.ping}ms`
    );
  },
};