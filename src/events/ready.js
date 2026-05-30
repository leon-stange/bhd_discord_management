const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ Bot eingeloggt als ${client.user.tag}`);
    client.user.setActivity('Server-Verwaltung | /help');
  },
};