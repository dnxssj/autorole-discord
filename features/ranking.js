// features/ranking.js (ESM)
import { createCanvas } from "canvas";

/**
 * initRanking
 * @param {Client} client
 * @param {Object} config
 * @param {Function} getXpData - función que devuelve el objeto xpData actual
 */
export function initRanking(client, config, getXpData) {
  // helpers (puedes quitar estos si ya los tienes globales y pasarlos por config)
  const rankRolesMap = { 
    10:'Nivel 1 ~ Nova', 50:'Nivel 2 ~ Spectra', 100:'Nivel 3 ~ Blight',
    200:'Nivel 4 ~ Cyanite', 300:'Nivel 5 ~ Velkyr', 400:'Nivel 6 ~ Oblivion',
    500:'Nivel 7 ~ Sunfall', 600:'Nivel 8 ~ Cryora', 800:'Nivel 9 ~ Ashen',
    1000:'Nivel 10 ~ Zenthyr', 5000:'YAPPER', 10000:'VIP'
  };
  const getRankName = (lvl) =>
    Object.entries(rankRolesMap).reverse().find(([k]) => lvl >= Number(k))?.[1] || 'Sin rango';

  const specialCfg = config.specialRoles || {
    admin:   { match: ["admin"],           color: "#e74c3c" },
    mod:     { match: ["mod","moderador"], color: "#2ecc71" },
    vip:     { match: ["vip"],             color: "#f1c40f" },
    booster: { match: ["booster"],         color: "#ac87ff" }
  };
  const getMemberSpecialColor = (member) => {
    const names = member.roles.cache.map(r => r.name.toLowerCase());
    for (const def of Object.values(specialCfg)) {
      if ((def.match||[]).some(m => names.some(n => n.includes(m.toLowerCase())))) {
        return def.color;
      }
    }
    return null;
  };

  client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;
    if (message.content !== ">ranking") return;

    // asegurar cache de miembros
    await message.guild.members.fetch().catch(() => null);

    const xpData = getXpData() || {};
    const rows = [];
    for (const [uid, data] of Object.entries(xpData)) {
      const m = message.guild.members.cache.get(uid);
      if (!m) continue;
      const xp = Number(data.xp || 0);
      const lvl = Number(data.level ?? Math.floor(0.1 * Math.sqrt(xp)));
      const msgs = Number(data.msgs || 0);
      rows.push({ member: m, id: uid, lvl, msgs, rankName: getRankName(lvl) });
    }

    if (rows.length === 0) {
      return message.reply("Aún no hay datos para mostrar.");
    }

    // ordenar por nivel y desempatar por mensajes
    rows.sort((a,b) => b.lvl - a.lvl || b.msgs - a.msgs);
    const top5 = rows.slice(0, 5);
    const myIndex = rows.findIndex(r => r.id === message.author.id);

    // Canvas
    const W = 700, H = 500;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // fondo gradiente
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#1e3c72");
    grad.addColorStop(1, "#2a5298");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // título
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 34px Roboto";
    ctx.fillText("🏆 TOP 5 — RANKING", W/2, 60);

    // cabecera
    ctx.font = "bold 18px Roboto";
    ctx.textAlign = "left";
    ctx.fillText("#",       60,  100);
    ctx.fillText("Usuario", 100, 100);
    ctx.fillText("Rango",   360, 100);
    ctx.fillText("Lvl.",    540, 100);
    ctx.fillText("Msgs",    600, 100);

    // separador
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(50, 110); ctx.lineTo(W-50, 110); ctx.stroke();

    // filas
    const baseY = 150;
    const rowH  = 60;
    for (let i = 0; i < top5.length; i++) {
      const r = top5[i];
      const y = baseY + i * rowH;

      // fondo de fila
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)";
      ctx.fillRect(50, y - 28, W - 100, 40);

      // índice
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.font = "bold 22px Roboto";
      ctx.fillText(`${i+1}.`, 60, y);

      // nombre con color especial si aplica
      const nameColor = getMemberSpecialColor(r.member) || "#ffffff";
      ctx.fillStyle = nameColor;
      ctx.font = "bold 22px Roboto";
      const displayName = r.member.displayName || r.member.user.username;
      ctx.fillText(displayName, 100, y);

      // rango
      ctx.fillStyle = "#eaeaea";
      ctx.font = "18px Roboto";
      ctx.fillText(r.rankName, 360, y);

      // lvl y msgs
      ctx.textAlign = "right";
      ctx.fillText(String(r.lvl), 560, y);
      ctx.fillText(String(r.msgs), 650, y);
      ctx.textAlign = "left";
    }

    // tu posición
    if (myIndex >= 0) {
      ctx.textAlign = "center";
      ctx.font = "bold 18px Roboto";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`Tu posición: #${myIndex+1} de ${rows.length}`, W/2, H - 30);
    }

    const buf = canvas.toBuffer("image/png");
    await message.reply({ files: [{ attachment: buf, name: "ranking.png" }] });
  });
}
