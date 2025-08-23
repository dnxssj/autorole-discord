if (command === 'kick') {
    if (!message.member.permissions.has('KICK_MEMBERS')) {
        return message.reply("❌ No tienes permisos para usar este comando.");
    }
    const userId = args[0];
    if (!userId) return message.reply("⚠️ Debes especificar un ID de usuario.");

    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (!member) return message.reply("⚠️ Usuario no encontrado en este servidor.");

    member.kick(`Kickeado por ${message.author.tag}`)
        .then(() => message.reply(`✅ Usuario **${userId}** fue kickeado.`))
        .catch(err => {
            console.error(err);
            message.reply("❌ No pude kickear a este usuario.");
        });
}