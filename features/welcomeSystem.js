// features/welcomeSystem.js
import fs from "fs";
import path from "path";
import { createCanvas, loadImage, registerFont } from "canvas";

/**
 * Genera una imagen 800x300 con fondo, avatar circular y textos.
 */
async function renderCard({ member, bgPath, title, subtitle }) {
  const W = 800, H = 300;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Fondo
  let bg;
  try {
    bg = await loadImage(bgPath);
  } catch {
    // fallback gris si no se encuentra la imagen
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, W, H);
  }
  if (bg) {
    // cubrir toda el área manteniendo aspecto
    const scale = Math.max(W / bg.width, H / bg.height);
    const bw = bg.width * scale;
    const bh = bg.height * scale;
    const bx = (W - bw) / 2;
    const by = (H - bh) / 2;
    ctx.drawImage(bg, bx, by, bw, bh);
  }

  // Capa oscura suave para legibilidad del texto
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, W, H);

  // Avatar circular
  const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 256, forceStatic: true });
  const avatarImg = await loadImage(avatarURL);

  const AV_R = 70;
  const AV_X = 120;
  const AV_Y = H / 2;

  // anillo
  ctx.beginPath();
  ctx.arc(AV_X, AV_Y, AV_R + 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fill();

  // avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(AV_X, AV_Y, AV_R, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, AV_X - AV_R, AV_Y - AV_R, AV_R * 2, AV_R * 2);
  ctx.restore();

  // Tipografía (usa Roboto que ya registraste en index; si no, sistema)
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff";

  // Título grande
  ctx.font = "bold 44px Roboto, Sans-Serif";
  // sombra para contraste
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillText(title, 230, 135);

  // Subtítulo
  ctx.font = "24px Roboto, Sans-Serif";
  ctx.fillText(subtitle, 230, 175);

  // Nombre destacado (opcional)
  const tag = member.user.discriminator === "0"
  ? member.user.username
  : `${member.user.username}#${member.user.discriminator}`;
  ctx.font = "bold 28px Roboto, Sans-Serif";
  ctx.fillText(tag, 230, 215);

  // limpiar sombra
  ctx.shadowColor = "transparent";

  return canvas.toBuffer("image/png");
}

export function initWelcomeSystem(client, config) {
  const welcomeChannelId = config.welcomeChannelId; // <- añade esto a tu config.json
  const welcomeBg = config.welcomeBackgroundPath || "./assets/welcome.png";
  const goodbyeBg = config.goodbyeBackgroundPath || "./assets/goodbye.png";
  const welcomeText = config.welcomeText || "¡Bienvenid@ al servidor!";
  const goodbyeText = config.goodbyeText || "¡Hasta pronto!";

  // Seguridad básica: si no hay canal, no hacemos nada
  const ensureChannel = async () => {
    if (!welcomeChannelId) return null;
    try {
      return await client.channels.fetch(welcomeChannelId);
    } catch {
      return null;
    }
  };

  client.on("guildMemberAdd", async (member) => {
    const ch = await ensureChannel();
    if (!ch) return;

    const buf = await renderCard({
      member,
      bgPath: welcomeBg,
      title: welcomeText,
      subtitle: `Te damos la bienvenida a ${member.guild.name}`,
    });

    await ch.send({
      files: [{ attachment: buf, name: "welcome.png" }],
    });
  });

  client.on("guildMemberRemove", async (member) => {
    const ch = await ensureChannel();
    if (!ch) return;

    const buf = await renderCard({
      member,
      bgPath: goodbyeBg,
      title: goodbyeText,
      subtitle: `Gracias por pasar por ${member.guild.name}`,
    });

    await ch.send({
      files: [{ attachment: buf, name: "goodbye.png" }],
    });
  });
}
