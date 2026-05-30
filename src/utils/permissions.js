/**
 * Prüft, ob ein Nutzer der Bot-Owner ist.
 * Der Owner hat die höchsten Rechte und kann alle Befehle ausführen.
 * @param {string} userId - Die Discord-ID des Nutzers
 * @returns {boolean}
 */
function isOwner(userId) {
  const ownerId = process.env.OWNER_ID;
  if (!ownerId) {
    console.warn('[WARN] OWNER_ID ist nicht in der .env gesetzt!');
    return false;
  }
  return userId === ownerId;
}

/**
 * Prüft, ob ein Nutzer Owner oder Admin-Berechtigungen hat.
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function isOwnerOrAdmin(member) {
  return isOwner(member.id) || member.permissions.has('Administrator');
}

/**
 * Prüft, ob ein Nutzer Owner oder Moderator-Berechtigungen hat.
 * (ManageChannels als Proxy für Moderation)
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function isOwnerOrModerator(member) {
  return isOwner(member.id) || member.permissions.has('ManageChannels');
}

/**
 * Prüft, ob ein Nutzer eine bestimmte Rolle hat.
 * @param {import('discord.js').GuildMember} member
 * @param {string} roleId - Die ID der Rolle
 * @returns {boolean}
 */
function hasRole(member, roleId) {
  return member.roles.cache.has(roleId);
}

/**
 * Prüft, ob ein Nutzer die Admin-Rolle hat (aus .env).
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function isAdmin(member) {
  const adminRoleId = process.env.ADMIN_ROLE_ID;
  if (!adminRoleId) {
    return member.permissions.has('Administrator');
  }
  return hasRole(member, adminRoleId);
}

/**
 * Prüft, ob ein Nutzer eine der Moderator-Rollen hat (aus .env, komma-getrennt).
 * @param {import('discord.js').GuildMember} member
 * @returns {boolean}
 */
function isModerator(member) {
  const modRoleIds = process.env.MODERATOR_ROLE_ID;
  if (!modRoleIds) {
    return member.permissions.has('ManageChannels');
  }
  return modRoleIds.split(',').some(id => hasRole(member, id.trim()));
}

module.exports = { isOwner, isOwnerOrAdmin, isOwnerOrModerator, hasRole, isAdmin, isModerator };