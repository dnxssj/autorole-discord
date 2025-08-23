if (command === 'unban') {
    if (!message.member.permissions.has('BAN_MEMBERS')) {
        return message.reply("❌ No tienes permisos para usar este comando.");
    }
    const userId = args[0];
    if (!userId) return message.reply("⚠️ Debes especificar un ID de usuario.");

    message.guild.bans.remove(userId, `Unban por ${message.author.tag}`)
        .then(() => message.reply(`✅ Usuario **${userId}** fue desbaneado.`))
        .catch(err => {
            console.error(err);
            message.reply("❌ No pude desbanear a este usuario.");
        });
}