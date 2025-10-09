// features/backfillMsgs.js (ESM)
import fs from "fs";

export function initBackfillMsgs(client, config, getXpData, getXpPath) {
  const ADMIN_IDS = [process.env.ADMIN_ID_1, process.env.ADMIN_ID_2].filter(Boolean);

  client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;
    if (!message.content.startsWith(">backfill")) return;

    // Solo admins o IDs permitidos
    const isAdmin =
      ADMIN_IDS.includes(message.author.id) ||
      message.member.permissions.has("Administrator");
    if (!isAdmin) return message.reply("🚫 Solo admins pueden usar este comando.");

    // Parseo: >backfill [porCanal=2000] [maxCanales=999]
    const args = message.content.trim().split(/\s+/).slice(1);
    let perChannelLimit = Math.min(parseInt(args[0] || "2000", 10) || 2000, 10000);
    let maxChannels = Math.min(parseInt(args[1] || "999", 10) || 999, 999);

    await message.reply(`🔍 Iniciando backfill:\n• por canal: **${perChannelLimit}** mensajes\n• máx. canales: **${maxChannels}**\nEsto puede tardar y está limitado por rate-limits.`);

    const textChannels = message.guild.channels.cache
      .filter(c => c.isTextBased() && c.viewable && c.permissionsFor(message.guild.members.me)?.has(["ReadMessageHistory"]))
      .toJSON()
      .slice(0, maxChannels);

    const xpData = getXpData();
    const xpFile = getXpPath();

    let totalScanned = 0;
    let touchedUsers = 0;
    const tally = new Map(); // userId -> count

    for (const ch of textChannels) {
      let fetched = 0;
      let lastId = undefined;

      while (fetched < perChannelLimit) {
        const toFetch = Math.min(100, perChannelLimit - fetched);
        let batch;
        try {
          batch = await ch.messages.fetch({ limit: toFetch, ...(lastId ? { before: lastId } : {}) });
        } catch {
          break; // sin permisos o rate limit duro; saltamos canal
        }
        if (!batch?.size) break;

        for (const m of batch.values()) {
          if (!m.author || m.author.bot) continue;
          const uid = m.author.id;
          tally.set(uid, (tally.get(uid) || 0) + 1);
          totalScanned++;
        }

        fetched += batch.size;
        lastId = batch.last()?.id;
        if (!lastId || batch.size < toFetch) break; // llegamos al inicio
      }
    }

    // Volcamos al xpData
    for (const [uid, count] of tally.entries()) {
      if (!xpData[uid]) xpData[uid] = { xp: 0, level: 0, lastRank: null, msgs: 0 };
      xpData[uid].msgs = (xpData[uid].msgs || 0) + count;
      touchedUsers++;
    }

    try {
      fs.writeFileSync(xpFile, JSON.stringify(xpData, null, 2));
    } catch (e) {
      return message.reply("❌ No pude guardar xp.json. Revisa permisos de escritura.");
    }

    await message.channel.send(
      `✅ Backfill terminado.\n• Mensajes escaneados: **${totalScanned.toLocaleString()}**\n• Usuarios actualizados: **${touchedUsers}**`
    );
  });
}
