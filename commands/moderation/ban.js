module.exports = {
    name: "ban",
    description: "Banea a un usuario del servidor.",
    async execute(message, args) {
        const adminRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === "admin");
        const modRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === "mod");

        if (!message.member.roles.cache.has(adminRole?.id) && !message.member.roles.cache.has(modRole?.id)) {
            return message.reply("❌ No tienes permisos para usar este comando.");
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply("Debes mencionar a un usuario para banear.");

        const member = message.guild.members.resolve(user);
        if (!member) return message.reply("Ese usuario no está en el servidor.");

        try {
            await member.ban({ reason: args.slice(1).join(" ") || "No especificado" });
            message.channel.send(`✅ ${user.tag} fue baneado correctamente.`);
        } catch (error) {
            console.error(error);
            message.reply("❌ No pude banear al usuario.");
        }
    }
};
