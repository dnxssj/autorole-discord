// features/autoStar.js
export function initAutoStar(client) {
  client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();

      if (reaction.emoji.name === "⭐") {
        const already = reaction.users.cache.has(client.user.id);
        if (!already) {
          await reaction.message.react("⭐");
        }
      }
    } catch (err) {
      console.error("Error en auto-star:", err);
    }
  });

  // opcional: que quite su ⭐ si se quita la última del usuario
  client.on("messageReactionRemove", async (reaction, user) => {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();

      if (reaction.emoji.name === "⭐") {
        // si ya no queda ninguna ⭐ de usuarios normales, el bot quita la suya
        const stillHasStars = reaction.users.cache.some(u => u.id !== client.user.id);
        if (!stillHasStars) {
          const me = reaction.message.reactions.cache.get("⭐");
          if (me) {
            await me.users.remove(client.user.id).catch(() => null);
          }
        }
      }
    } catch (err) {
      console.error("Error en auto-star remove:", err);
    }
  });
}
