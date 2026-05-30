const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isOwnerOrAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Erstellt eine Ankündigung im aktuellen oder einem anderen Channel')
    .addStringOption(option =>
      option
        .setName('nachricht')
        .setDescription('Inhalt der Ankündigung')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('titel')
        .setDescription('Optionaler Zusatz im Titel (Standard: Saalekreis-RP | Neuigkeit)')
        .setRequired(false)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel, in dem die Ankündigung gesendet werden soll (Standard: aktueller Channel)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('farbe')
        .setDescription('Farbe als Hex-Code (z.B. #FF0000 für Rot)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('bild')
        .setDescription('URL für ein Bild im Embed')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Nur Admins und Owner dürfen Ankündigungen machen
    if (!isOwnerOrAdmin(interaction.member)) {
      return interaction.reply({
        content: '❌ Nur Administratoren können Ankündigungen erstellen.',
        flags: 64,
      });
    }

    const titel = interaction.options.getString('titel');
    const nachricht = interaction.options.getString('nachricht');
    const channel = interaction.options.getChannel('channel') || interaction.guild.channels.cache.get(process.env.ANNOUNCE_CHANNEL_ID) || interaction.channel;
    const farbe = interaction.options.getString('farbe') || '#ED4245';
    const bild = interaction.options.getString('bild');

    // Farbe validieren
    let embedColor;
    try {
      embedColor = parseInt(farbe.replace('#', ''), 16);
      if (isNaN(embedColor)) embedColor = 0xED4245;
    } catch {
      embedColor = 0xED4245;
    }

    const embedTitle = titel
      ? `📢 Saalekreis-RP | Neuigkeit – ${titel}`
      : `📢 Saalekreis-RP | Neuigkeit`;

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(embedTitle)
      .setDescription(nachricht)
      .setFooter({
        text: `Ankündigung von ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    if (bild) {
      embed.setImage(bild);
    }

    try {
      await channel.send({ embeds: [embed] });
      await interaction.reply({
        content: `✅ Ankündigung wurde in <#${channel.id}> gesendet!`,
        flags: 64,
      });
    } catch (error) {
      console.error('[ANNOUNCE] Fehler:', error);
      await interaction.reply({
        content: '❌ Fehler beim Senden der Ankündigung. Hast du die Berechtigung für den Channel?',
        flags: 64,
      });
    }
  },
};