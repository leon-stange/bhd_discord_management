const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwnerOrAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Zeigt detaillierte Informationen über den Server an'),

  async execute(interaction) {
    if (!isOwnerOrAdmin(interaction.member)) {
      return interaction.reply({ content: '❌ Nur Admins können diesen Befehl nutzen.', flags: 64 });
    }

    const guild = interaction.guild;

    // Server-Infos sammeln
    const owner = await guild.fetchOwner().catch(() => null);
    const createdAt = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`;

    // Mitglieder-Statistiken
    const totalMembers = guild.memberCount;
    const humans = guild.members.cache.filter(m => !m.user.bot).size;
    const bots = guild.members.cache.filter(m => m.user.bot).size;

    // Kanäle
    const channels = guild.channels.cache;
    const textChannels = channels.filter(c => c.isTextBased() && !c.isVoiceBased()).size;
    const voiceChannels = channels.filter(c => c.isVoiceBased()).size;
    const categories = channels.filter(c => c.type === 4).size; // ChannelType.GuildCategory

    // Rollen (ohne @everyone)
    const roles = guild.roles.cache
      .filter(role => role.id !== guild.id)
      .sort((a, b) => b.position - a.position);

    const roleText = roles.size > 0
      ? roles.map(r => `<@&${r.id}>`).slice(0, 15).join(', ') + (roles.size > 15 ? ` und ${roles.size - 15} weitere` : '')
      : 'Keine Rollen';

    // Emojis
    const emojiCount = guild.emojis.cache.size;
    const stickerCount = guild.stickers.cache.size;

    // Booster
    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;
    const boostLevelNames = {
      0: 'Kein Boost-Level',
      1: '⭐ Level 1',
      2: '⭐⭐ Level 2',
      3: '⭐⭐⭐ Level 3',
    };

    // Server-Features (auswählbare interessante)
    const featureMap = {
      ANIMATED_ICON: '🖼️ Animiertes Icon',
      BANNER: '🖼️ Server-Banner',
      COMMERCE: '🛒 Store-Kanäle',
      COMMUNITY: '🏠 Community-Server',
      DISCOVERABLE: '🔍 Entdeckbar',
      FEATURABLE: '🌟 Empfohlen',
      INVITE_SPLASH: '🎨 Invite-Splash',
      MEMBER_VERIFICATION_GATE_ENABLED: '🛡️ Mitgliederverifizierung',
      NEWS: '📰 News-Kanäle',
      PARTNERED: '🏢 Partner-Server',
      VANITY_URL: '🔗 Vanity-URL',
      VERIFIED: '✅ Verifiziert',
      VIP_REGIONS: '🎤 VIP-Audio',
    };
    const features = guild.features
      .map(f => featureMap[f] || f)
      .filter(Boolean)
      .join('\n') || 'Keine';

    // Beschreibung
    const description = guild.description || 'Keine Beschreibung';

    const embed = new EmbedBuilder()
      .setColor(guild.members.me?.displayHexColor || 0x5865F2)
      .setTitle(`🏠 Serverinfo: ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: '🏷️ Servername', value: guild.name, inline: true },
        { name: '🆔 Server-ID', value: `\`${guild.id}\``, inline: true },
        { name: '📅 Erstellt am', value: createdAt, inline: false },
        { name: '👑 Besitzer', value: owner ? `${owner.user.tag}` : 'Unbekannt', inline: true },
        { name: '📝 Beschreibung', value: description, inline: true },
      )
      .addFields(
        { name: '👥 Mitglieder', value: `**Gesamt:** ${totalMembers}\n🧑 Menschen: ${humans}\n🤖 Bots: ${bots}`, inline: true },
        { name: '📺 Kanäle', value: `**Gesamt:** ${channels.size}\n💬 Text: ${textChannels}\n🔊 Sprache: ${voiceChannels}\n📁 Kategorien: ${categories}`, inline: true },
        { name: '🎭 Rollen', value: `**${roles.size}** Rollen\n${roleText}`, inline: false },
      )
      .addFields(
        { name: '😀 Emojis & Sticker', value: `${emojiCount} Emojis, ${stickerCount} Sticker`, inline: true },
        { name: '💎 Server-Boosts', value: `${boostLevelNames[boostLevel]}\n${boostCount} Booster`, inline: true },
      )
      .setFooter({ text: `Angefordert von ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    // Features nur anzeigen wenn vorhanden
    if (guild.features.length > 0) {
      embed.addFields({ name: '✨ Server-Features', value: features, inline: false });
    }

    // Banner anzeigen wenn vorhanden
    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    await interaction.reply({ embeds: [embed] });
  },
};