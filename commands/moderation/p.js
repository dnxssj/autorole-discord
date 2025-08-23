const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "p",
    description: "Ver historial e información de un usuario",
    async execute(message, args) {
        // Solo roles admin o mod
        if (!message.member.roles.cache.some(r => ["admin", "mod"].includes(r.name))) {
            return message.reply("❌ No tienes permiso para usar este comando.");
        }

        const userId = args[0];
        if (!userId) {
            return message.reply("⚠️ Debes proporcionar la **ID** del usuario.");
        }

        let member;
        try {
            member = await message.guild.members.fetch(userId);
        } catch (err) {
            return message.reply("❌ No se encontró ningún usuario con esa ID en este servidor.");
        }

        // Cargar historial (si existe archivo de warns)
        let warnsData = {};
        const warnsPath = path.join(__dirname, "../../registros.json");
        if (fs.existsSync(warnsPath)) {
            warnsData = JSON.parse(fs.readFileSync(warnsPath, "utf8"));
        }

        const userWarns = warnsData[userId] || [];

        const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle(`📋 Informe de ${member.user.tag}`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "🆔 ID", value: `${member.user.id}`, inline: true },
                { name: "🎭 Roles", value: member.roles.cache.map(r => r.name).join(", ") || "Ninguno", inline: false },
                { name: "⏰ Cuenta creada", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: "📅 Se unió", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: "⚠️ Historial de warns", value: userWarns.length > 0 ? userWarns.map((w, i) => `\`${i+1}.\` ${w.reason} (por <@${w.moderator}>)`).join("\n") : "✅ Sin advertencias", inline: false }
            )
            .setFooter({ text: `Moderación - Consulta de usuario` })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
