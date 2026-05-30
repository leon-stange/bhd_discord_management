const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Zeigt detaillierte Informationen über einen Nutzer an')
    .addUserOption(option =>
      option
        .setName('nutzer')
        .setDescription('Der Nutzer, dessen Infos du sehen möchtest (Standard: du selbst)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('nutzer') || interaction.user;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: '❌ Dieser Nutzer ist nicht auf diesem Server.',
        flags: 64,
      });
    }

    // Rollen (ohne @everyone)
    const roles = member.roles.cache
      .filter(role => role.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(role => `<@&${role.id}>`);

    const roleText = roles.length > 0
      ? roles.slice(0, 15).join(', ') + (roles.length > 15 ? ` und ${roles.length - 15} weitere` : '')
      : 'Keine Rollen';

    // Beitrittsdatum formatieren
    const joinedAt = `<t:${Math.floor(member.joinedTimestamp / 1000)}:F> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`;
    const createdAt = `<t:${Math.floor(target.createdTimestamp / 1000)}:F> (<t:${Math.floor(target.createdTimestamp / 1000)}:R>)`;

    // Status
    const statusMap = {
      online: '🟢 Online',
      idle: '🟡 Abwesend',
      dnd: '🔴 Nicht stören',
      offline: '⚫ Offline',
    };
    const status = statusMap[member.presence?.status] || '⚫ Offline';

    // Flags / Badges
    const flags = target.flags?.toArray() || [];
    const badgeMap = {
      Staff: '🔧 Discord-Mitarbeiter',
      Partner: '🏢 Partner-Server',
      Hypesquad: '🏠 HypeSquad',
      HypeSquadOnlineHouse1: '🦁 HypeSquad Bravery',
      HypeSquadOnlineHouse2: '🦅 HypeSquad Brilliance',
      HypeSquadOnlineHouse3: '🦑 HypeSquad Balance',
      BugHunterLevel1: '🐛 Bug Hunter',
      BugHunterLevel2: '🐛 Bug Hunter Level 2',
      PremiumEarlySupporter: '💎 Early Nitro Supporter',
      VerifiedBot: '✅ Verifizierter Bot',
      VerifiedDeveloper: '👨‍💻 Verifizierter Bot-Entwickler',
      CertifiedModerator: '🛡️ Zertifizierter Moderator',
      ActiveDeveloper: '💻 Aktiver Entwickler',
    };
    const badges = flags.map(f => badgeMap[f] || f).join('\n') || 'Keine';

    const embed = new EmbedBuilder()
      .setColor(member.displayHexColor || 0x5865F2)
      .setTitle(`👤 Nutzerinfo: ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🏷️ Name', value: `${target.tag}`, inline: true },
        { name: '🆔 ID', value: `\`${target.id}\``, inline: true },
        { name: '📊 Status', value: status, inline: true },
        { name: '📅 Konto erstellt', value: createdAt, inline: false },
        { name: '📥 Server beigetreten', value: joinedAt, inline: false },
        { name: '🎭 Rollen', value: roleText, inline: false },
      )
      .setFooter({ text: `Angefordert von ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    // Badges nur anzeigen wenn vorhanden
    if (flags.length > 0) {
      embed.addFields({ name: '🏅 Abzeichen', value: badges, inline: false });
    }

    // Booster-Rolle prüfen
    if (member.premiumSinceTimestamp) {
      embed.addFields({
        name: '💎 Server-Booster seit',
        value: `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`,
        inline: false,
      });
    }

    // Nickname anzeigen wenn vorhanden
    if (member.nickname) {
      embed.addFields({ name: '✏️ Spitzname', value: member.nickname, inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  },
};