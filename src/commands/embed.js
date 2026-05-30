const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isOwnerOrAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Erstellt ein benutzerdefiniertes Embed und sendet es in einen Channel')
    .addStringOption(option =>
      option
        .setName('titel')
        .setDescription('Titel des Embeds')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('beschreibung')
        .setDescription('Beschreibung/Inhalt des Embeds')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel, in dem das Embed gesendet werden soll (Standard: aktueller Channel)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('farbe')
        .setDescription('Farbe als Hex-Code (z.B. #5865F2 für Blau)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('bild')
        .setDescription('URL für ein Bild im Embed')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('thumbnail')
        .setDescription('URL für ein Thumbnail (kleines Bild) im Embed')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('fusszeile')
        .setDescription('Text für die Fußzeile')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Nur Admins und Owner dürfen Embeds erstellen
    if (!isOwnerOrAdmin(interaction.member)) {
      return interaction.reply({
        content: '❌ Nur Administratoren können Embeds erstellen.',
        flags: 64,
      });
    }

    const titel = interaction.options.getString('titel');
    const beschreibung = interaction.options.getString('beschreibung');
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const farbe = interaction.options.getString('farbe') || '#5865F2';
    const bild = interaction.options.getString('bild');
    const thumbnail = interaction.options.getString('thumbnail');
    const fusszeile = interaction.options.getString('fusszeile');

    // Farbe validieren
    let embedColor;
    try {
      embedColor = parseInt(farbe.replace('#', ''), 16);
      if (isNaN(embedColor)) embedColor = 0x5865F2;
    } catch {
      embedColor = 0x5865F2;
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(titel)
      .setDescription(beschreibung)
      .setTimestamp();

    if (bild) embed.setImage(bild);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (fusszeile) embed.setFooter({ text: fusszeile });

    try {
      await channel.send({ embeds: [embed] });
      await interaction.reply({
        content: `✅ Embed wurde in <#${channel.id}> gesendet!`,
        flags: 64,
      });
    } catch (error) {
      console.error('[EMBED] Fehler:', error);
      await interaction.reply({
        content: '❌ Fehler beim Senden des Embeds. Hast du die Berechtigung für den Channel?',
        flags: 64,
      });
    }
  },
};