const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  client.commands = new Map();

  // cargar comandos de moderación
  const commandsPath = path.join(__dirname, "../commands/moderation");
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
  }

  // listener para ejecutar slash commands
  client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: "❌ Error al ejecutar el comando.", ephemeral: true });
    }
  });
};
