// features/spotify.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

async function fetchSpotifyOEmbed(url) {
  const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`).catch(() => null);
  if (!res || !res.ok) return null;
  return await res.json().catch(() => null);
}

export function initSpotify(client, config) {
  const url = config.sharedSpotifyPlaylistUrl; 
  if (!url) return;

  client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;
    if (!/^>spotify\b/i.test(message.content)) return;

    const meta = await fetchSpotifyOEmbed(url);
    const title = meta?.title || "Playlist del servidor";
    const thumb = meta?.thumbnail_url || "https://developer.spotify.com/images/brand-assets/spotify-logo.png";

    const emb = new EmbedBuilder()
      .setColor(0x1DB954)
      .setTitle(`🎶 ${title}`)
      .setURL(url)
      .setThumbnail(thumb)
      .setDescription([
        "Playlist **colaborativa** del server: añade tus temazos y descubre los de los demás.",
        config.playlistNote ? `> ${config.playlistNote}` : null
      ].filter(Boolean).join("\n"))
      .setFooter({ text: "Dexter • Spotify" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Abrir en Spotify")
        .setURL(url)
    );

    await message.channel.send({ embeds: [emb], components: [row] }).catch(() => null);
  });
}
