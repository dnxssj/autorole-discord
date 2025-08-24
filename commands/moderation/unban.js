// /commands/moderation/unban.js (ESM)
function hasStaffRole(member) {
  return member.roles.cache.some(r => ["admin", "mod"].includes(r.name.toLowerCase()));
}

export default {
  name: "unban",
  description: "Desbanear por ID",
  async execute(message, args) {
    if (!hasStaffRole(message.member)) {
      return message.reply("❌ No tienes permiso para usar este comando.");
    }

    const userId = args[0];
    if (!userId) return message.reply("⚠️ Debes proporcionar la **ID** del usuario.");

    try {
      await message.guild.bans.remove(userId);
      return message.channel.send(`✅ Usuario \`${userId}\` desbaneado.`);
    } catch (err) {
      console.error(err);
      return message.reply("❌ No pude desbanear al usuario. Verifica el ID/estado.");
    }
  },
};
