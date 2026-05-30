const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require('discord.js');
const { isOwnerOrAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Zeigt detaillierte Informationen über den Bot an'),

  async execute(interaction) {
    if (!isOwnerOrAdmin(interaction.member)) {
      return interaction.reply({ content: '❌ Nur Admins können diesen Befehl nutzen.', flags: 64 });
    }

    const client = interaction.client;

    // Uptime berechnen
    const uptime = client.uptime;
    const days = Math.floor(uptime / 86400000);
    const hours = Math.floor((uptime % 86400000) / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    const seconds = Math.floor((uptime % 60000) / 1000);
    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Server-Statistiken
    const guilds = client.guilds.cache.size;
    const users = client.users.cache.size;
    const channels = client.channels.cache.size;

    // Node.js Version
    const nodeVersion = process.version;

    // Speicher-Nutzung
    const memoryUsage = process.memoryUsage();
    const rss = (memoryUsage.rss / 1024 / 1024).toFixed(2);
    const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);

    // API-Latenz
    const apiPing = client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🤖 Bot-Info: Saalekreis-Management')
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🏷️ Bot-Name', value: client.user.tag, inline: true },
        { name: '🆔 Bot-ID', value: `\`${client.user.id}\``, inline: true },
        { name: '⏱️ Uptime', value: uptimeStr, inline: true },
        { name: '📡 API-Latenz', value: `${apiPing}ms`, inline: true },
        { name: '🏠 Server', value: `${guilds}`, inline: true },
        { name: '👥 Nutzer', value: `${users}`, inline: true },
        { name: '📺 Kanäle', value: `${channels}`, inline: true },
        { name: '💻 Node.js', value: nodeVersion, inline: true },
        { name: '📚 Discord.js', value: `v${djsVersion}`, inline: true },
        { name: '💾 Speicher', value: `**RSS:** ${rss} MB\n**Heap:** ${heapUsed} / ${heapTotal} MB`, inline: true },
      )
      .setFooter({ text: `Angefordert von ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
  },
};