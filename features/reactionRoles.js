// features/reactionRoles.js (ESM)
import fs from "fs";

/**
 * Inicializa embeds y reacciones para:
 * - Colores (por grupos) usando emojis numerados personalizados
 * - Regiones (exclusivo 1)
 * - Edad (exclusivo 1)
 * Mantiene Zodiaco como está.
 */
export function initReactionRoles(client, config) {
  const saveConfig = () => {
    fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
  };

  // ---------- Helpers ----------
  const getGuildRoleByName = (guild, name) =>
    guild.roles.cache.find((r) => r.name === name);

  const mentionOrBold = (guild, roleName) => {
    const r = getGuildRoleByName(guild, roleName);
    return r ? `<@&${r.id}>` : `**${roleName}**`;
  };

  // Para leer el ID del emoji (para msg.react) y emparejar por nombre
  const reactWithEmoji = async (msg, opt) => {
    // Si hay emojiId -> úsalo; si no, intenta con el nombre (para retrocompatibilidad)
    if (opt.emojiId) {
      await msg.react(opt.emojiId).catch(() => null);
    } else if (opt.emojiName) {
      await msg.react(opt.emojiName).catch(() => null);
    }
  };

  // Mapa de COL Or groups (cada grupo tendrá 3 opciones numeradas)
  const colorGroups = {
    reds: config.colorRoles?.reds ?? {},
    greens: config.colorRoles?.greens ?? {},
    blues: config.colorRoles?.blues ?? {},
    yellows: config.colorRoles?.yellows ?? {},
    purples: config.colorRoles?.purples ?? {},
    bw: config.colorRoles?.bw ?? {},
  };

  // NUEVO: Regiones y Edad (leer desde config)
  const regionOptions = config.regionRoles || {}; // { emojigg_1: { name: "Europa", emojiId: "123" }, ... }
  const ageOptions = config.ageRoles || {};       // { emojigg_1: { name: "+18", emojiId: "..." }, emojigg_2: {...} }

  client.once("ready", async () => {
    try {
      const colorChannel = await client.channels.fetch(config.channelId);
      const zodiacChannel = await client.channels.fetch(config.zodiacChannelId || config.channelId);
      const guild = colorChannel.guild;

      // ---- EMBEDS DE COLORES (uno por grupo) ----
      for (const [groupName, colors] of Object.entries(colorGroups)) {
        if (config[`${groupName}MessageId`]) continue;

        // Reordenamos/convertimos a lista de 3 con emojis numerados (si existe mapping en config)
        // Esperamos estructura: { emojigg_1: { name, hex, emojiId }, emojigg_2: {...}, emojigg_3: {...} }
        const numbered = Object.entries(colors); // [[emojiKey, {name,hex,emojiId?}], ...]
        // Descripción numerada + mención
        const lines = numbered.map(([emojiKey, info], idx) => {
          const num = `${idx + 1})`; // 1) 2) 3)
          const mention = mentionOrBold(guild, info.name);
          return `${num} ${mention}`;
        });

        const { EmbedBuilder } = await import("discord.js");
        const embed = new EmbedBuilder()
          .setTitle(`🎨 ${groupName.toUpperCase()} – Selección Actual`)
          .setDescription(lines.join("\n"))
          .setColor(Number(`0x${Object.values(colors)[0]?.hex || "5865F2"}`))
          .setFooter({ text: "Reacciona para obtener el rol de color" });

        const msg = await colorChannel.send({ embeds: [embed] });

        // Reacciones con los emojis numerados personalizados
        for (const [, info] of numbered) {
          await reactWithEmoji(msg, { emojiId: info.emojiId, emojiName: info.emojiName });
        }

        config[`${groupName}MessageId`] = msg.id;
        saveConfig();
      }

      // ---- EMBED DE REGIONES (exclusivo 1) ----
      if (!config.regionMessageId && Object.keys(regionOptions).length) {
        const entries = Object.entries(regionOptions); // [[key,{name,emojiId}],...]
        const lines = entries.map(([k, v], i) => `${i + 1}) ${mentionOrBold(guild, v.name)}`);

        const { EmbedBuilder } = await import("discord.js");
        const embed = new EmbedBuilder()
          .setTitle("🌍 Regiones")
          .setDescription(lines.join("\n"))
          .setColor(0x2ecc71)
          .setFooter({ text: "Elige tu región (1 opción)" });

        const msg = await colorChannel.send({ embeds: [embed] });
        for (const [, info] of entries) {
          await reactWithEmoji(msg, { emojiId: info.emojiId, emojiName: info.emojiName });
        }
        config.regionMessageId = msg.id;
        saveConfig();
      }

      // ---- EMBED DE EDAD (exclusivo 1) ----
      if (!config.ageMessageId && Object.keys(ageOptions).length) {
        const entries = Object.entries(ageOptions);
        const lines = entries.map(([k, v], i) => `${i + 1}) ${mentionOrBold(guild, v.name)}`);

        const { EmbedBuilder } = await import("discord.js");
        const embed = new EmbedBuilder()
          .setTitle("🎯 Edad")
          .setDescription(lines.join("\n"))
          .setColor(0xf1c40f)
          .setFooter({ text: "Elige tu edad (1 opción)" });

        const msg = await colorChannel.send({ embeds: [embed] });
        for (const [, info] of entries) {
          await reactWithEmoji(msg, { emojiId: info.emojiId, emojiName: info.emojiName });
        }
        config.ageMessageId = msg.id;
        saveConfig();
      }

      // ---- ZODIACO (se mantiene igual) ----
      if (!config.zodiacMessageId) {
        const { EmbedBuilder } = await import("discord.js");
        const lines = [];
        for (const [emoji, roleName] of Object.entries(config.zodiacRoles || {})) {
          lines.push(`${emoji} → ${mentionOrBold(guild, roleName)}`);
        }

        const zodiacEmbed = new EmbedBuilder()
          .setTitle("♈ Roles Zodiacales")
          .setDescription(lines.join("\n"))
          .setColor(0xe67e22)
          .setFooter({ text: "Reacciona con tu signo para obtener el rol" });

        const zMsg = await zodiacChannel.send({ embeds: [zodiacEmbed] });
        for (const emoji of Object.keys(config.zodiacRoles || {})) {
          await zMsg.react(emoji).catch(() => null);
        }
        config.zodiacMessageId = zMsg.id;
        saveConfig();
      }
    } catch (err) {
      console.error("Error inicializando reaction roles:", err);
    }
  });

  // ------------- HANDLERS REACCIONES -------------
  const handleExclusiveGroup = async (guild, member, optionsObj) => {
    // Quita cualquiera de las opciones del mismo grupo y luego añade la seleccionada
    for (const info of Object.values(optionsObj)) {
      const r = getGuildRoleByName(guild, info.name);
      if (r && member.roles.cache.has(r.id)) {
        await member.roles.remove(r).catch(() => null);
      }
    }
  };

  client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
    const guild = reaction.message.guild;
    if (!guild) return;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    // COLORES (por grupo, exclusivo dentro de cada embed)
    for (const [groupName, colors] of Object.entries(colorGroups)) {
      const msgId = config[`${groupName}MessageId`];
      if (reaction.message.id !== msgId) continue;

      // match por nombre del emoji (custom) o por ID
      const match = Object.values(colors).find((opt) =>
        (reaction.emoji.id && opt.emojiId === reaction.emoji.id) ||
        (!reaction.emoji.id && opt.emojiName === reaction.emoji.name) ||
        // retrocompatibilidad por key (si el usuario aún tiene "🔴", etc.)
        opt.emojiName === reaction.emoji.name
      );
      if (!match) return;

      // Quitar roles del mismo grupo y añadir el nuevo
      await handleExclusiveGroup(guild, member, colors);
      const role = getGuildRoleByName(guild, match.name);
      if (role) await member.roles.add(role).catch(() => null);
      return;
    }

    // REGIONES (exclusivo 1)
    if (reaction.message.id === config.regionMessageId) {
      const match = Object.values(regionOptions).find((opt) =>
        (reaction.emoji.id && opt.emojiId === reaction.emoji.id) ||
        (!reaction.emoji.id && opt.emojiName === reaction.emoji.name)
      );
      if (!match) return;

      await handleExclusiveGroup(guild, member, regionOptions);
      const role = getGuildRoleByName(guild, match.name);
      if (role) await member.roles.add(role).catch(() => null);
      return;
    }

    // EDAD (exclusivo 1)
    if (reaction.message.id === config.ageMessageId) {
      const match = Object.values(ageOptions).find((opt) =>
        (reaction.emoji.id && opt.emojiId === reaction.emoji.id) ||
        (!reaction.emoji.id && opt.emojiName === reaction.emoji.name)
      );
      if (!match) return;

      await handleExclusiveGroup(guild, member, ageOptions);
      const role = getGuildRoleByName(guild, match.name);
      if (role) await member.roles.add(role).catch(() => null);
      return;
    }

    // ZODIACO (exclusivo 1, igual que antes)
    if (reaction.message.id === config.zodiacMessageId) {
      const roleName = (config.zodiacRoles || {})[reaction.emoji.name];
      if (!roleName) return;

      for (const name of Object.values(config.zodiacRoles || {})) {
        const r = getGuildRoleByName(guild, name);
        if (r && member.roles.cache.has(r.id)) await member.roles.remove(r).catch(() => null);
      }
      const role = getGuildRoleByName(guild, roleName);
      if (role) await member.roles.add(role).catch(() => null);
    }
  });

  client.on("messageReactionRemove", async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
    const guild = reaction.message.guild;
    if (!guild) return;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    // COLORES
    for (const [groupName, colors] of Object.entries(colorGroups)) {
      const msgId = config[`${groupName}MessageId`];
      if (reaction.message.id !== msgId) continue;

      const match = Object.values(colors).find((opt) =>
        (reaction.emoji.id && opt.emojiId === reaction.emoji.id) ||
        (!reaction.emoji.id && opt.emojiName === reaction.emoji.name) ||
        opt.emojiName === reaction.emoji.name
      );
      if (!match) return;

      const role = getGuildRoleByName(guild, match.name);
      if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role).catch(() => null);
      }
      return;
    }

    // REGIONES
    if (reaction.message.id === config.regionMessageId) {
      const match = Object.values(regionOptions).find((opt) =>
        (reaction.emoji.id && opt.emojiId === reaction.emoji.id) ||
        (!reaction.emoji.id && opt.emojiName === reaction.emoji.name)
      );
      if (!match) return;

      const role = getGuildRoleByName(guild, match.name);
      if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role).catch(() => null);
      }
      return;
    }

    // EDAD
    if (reaction.message.id === config.ageMessageId) {
      const match = Object.values(ageOptions).find((opt) =>
        (reaction.emoji.id && opt.emojiId === reaction.emoji.id) ||
        (!reaction.emoji.id && opt.emojiName === reaction.emoji.name)
      );
      if (!match) return;

      const role = getGuildRoleByName(guild, match.name);
      if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role).catch(() => null);
      }
    }
  });
}
