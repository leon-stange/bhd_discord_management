const { Events } = require('discord.js');
const autoModHandler = require('../handlers/autoModHandler');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Auto-Mod auf alle Nachrichten anwenden (auch Admins – wie gewünscht)
    await autoModHandler.handleMessage(message);
  },
};