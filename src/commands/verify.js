const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwner, isAdmin, isModerator } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verifiziert einen Nutzer manuell')
    .addUserOption(option =>
      option
        .setName('nutzer')
        .setDescription('Der Nutzer, der verifiziert werden soll')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Berechtigungsprüfung: Owner, Admin oder Moderator
    if (!isOwner(interaction.user.id) && !isAdmin(interaction.member) && !isModerator(interaction.member)) {
      return interaction.reply({ content: '❌ Nur Moderatoren, Admins oder der Owner können diesen Befehl nutzen.', flags: 64 });
    }

    const targetUser = interaction.options.getUser('nutzer');
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ Dieser Nutzer ist nicht auf diesem Server.', flags: 64 });
    }

    const unverifiedRoleId = process.env.UNVERIFIED_ROLE_ID;
    const verifiedRoleId = process.env.VERIFIED_ROLE_ID;

    if (!unverifiedRoleId || !verifiedRoleId) {
      return interaction.reply({ content: '❌ Verifizierungs-Rollen sind nicht in der .env konfiguriert.', flags: 64 });
    }

    // Unverifiziert-Rolle entfernen
    if (member.roles.cache.has(unverifiedRoleId)) {
      await member.roles.remove(unverifiedRoleId).catch(() => null);
    }

    // Verifiziert-Rolle hinzufügen
    await member.roles.add(verifiedRoleId).catch(() => {
      return interaction.reply({ content: '❌ Die Verifiziert-Rolle konnte nicht zugewiesen werden. Bitte Bot-Berechtigungen prüfen.', flags: 64 });
    });

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('✅ Nutzer verifiziert')
      .setDescription(`${targetUser} wurde erfolgreich verifiziert!`)
      .addFields(
        { name: '👤 Nutzer', value: `${targetUser.tag}`, inline: true },
        { name: '🆔 ID', value: `\`${targetUser.id}\``, inline: true },
        { name: '✅ Verifiziert von', value: `${interaction.user.tag}`, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Log im Log-Channel
    const logChannelId = process.env.LOG_CHANNEL_ID;
    if (logChannelId) {
      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle('✅ Nutzer verifiziert')
          .addFields(
            { name: '👤 Nutzer', value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
            { name: '🛡️ Verifiziert von', value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: true },
          )
          .setTimestamp();
        logChannel.send({ embeds: [logEmbed] }).catch(() => null);
      }
    }
  },
};