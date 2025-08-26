// commands/fun/love.js (ESM)
import fs from "fs";
import { EmbedBuilder } from "discord.js";

const parejasFile = "./parejas.json";
function loadParejas() {
  try {
    if (!fs.existsSync(parejasFile)) return {};
    return JSON.parse(fs.readFileSync(parejasFile, "utf8"));
  } catch {
    return {};
  }
}

function extractId(input = "") {
  // <@123>, <@!123> o ID plano
  const m = input.match(/^<@!?(\d+)>$/);
  return m ? m[1] : input;
}

export default {
  name: "love",
  description: "Calcula el love % entre dos personas del servidor (random; parejas oficiales = 100%).",
  async execute(message, args) {
    const guild = message.guild;

    // --- Resolver participantes ---
    let id1, id2;

    if (args.length >= 2) {
      id1 = extractId(args[0]);
      id2 = extractId(args[1]);
    } else if (args.length === 1) {
      id1 = message.author.id;
      id2 = extractId(args[0]);
    } else {
      // 0 args -> autor + miembro aleatorio (no bots, ni tú)
      id1 = message.author.id;
      const candidates = guild.members.cache
        .filter(m => !m.user.bot && m.id !== message.author.id);
      if (candidates.size === 0) {
        return message.reply("😅 No hay nadie más para emparejar ahora mismo.");
      }
      id2 = candidates.random().id;
    }

    if (!id1 || !id2) {
      return message.reply("⚠️ Debes indicar 1 o 2 usuarios (mención o ID). Ej: `>love @alguien` o `>love 1234567890 0987654321`");
    }
    if (id1 === id2) {
      return message.reply("🤨 Contigo mism@? Eso es mucho amor propio, pero intenta con otra persona.");
    }

    // --- Traer miembros ---
    let m1, m2;
    try {
      m1 = await guild.members.fetch(id1);
      m2 = await guild.members.fetch(id2);
    } catch {
      return message.reply("❌ No pude encontrar a uno de los usuarios en este servidor.");
    }

    // --- Calcular % (pareja oficial = 100) ---
    const parejas = loadParejas();
    const areOfficial =
      (parejas[id1] && parejas[id1] === id2) ||
      (parejas[id2] && parejas[id2] === id1);

    const percent = areOfficial ? 100 : Math.floor(Math.random() * 101);

    // Barra de corazoncitos
    const filled = Math.round(percent / 10);
    const bar = "❤️".repeat(filled) + "🤍".repeat(10 - filled);

    // Mensaje divertido
    let comment = "💘 Una conexión interesante…";
    if (percent >= 90) comment = "💞 ALMA GEMELA ALERTA.";
    else if (percent >= 70) comment = "💕 Hay chispas fuertes.";
    else if (percent >= 50) comment = "💖 Puede funcionar con unas citas.";
    else if (percent >= 30) comment = "💗 Mmm… química tímida.";
    else if (percent > 0) comment = "💔 Mejor probar como amigos.";
    else comment = "🧊 Frío polar.";

    if (areOfficial) comment = "💍 Pareja oficial: **AMOR ETERNO**.";

    const embed = new EmbedBuilder()
      .setTitle("💘 Love Calculator")
      .setDescription(
        `**${m1.displayName}** ❤️ **${m2.displayName}**\n\n` +
        `**Compatibilidad:** **${percent}%**\n${bar}\n\n${comment}`
      )
      .setColor(areOfficial ? 0xff66aa : 0x5865f2)
      .setFooter({ text: "100% si son pareja oficial del server" });

    await message.channel.send({ embeds: [embed] });
  },
};
