const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');
const { discord_token, client_id } = require('../config.json');

const commands = [
    {
        name: 'set',
        description: 'Set the channel that notifies mods of a blacklisted word.',
        options: [{
                name: 'channel',
                description: 'Notification channel',
                type: ApplicationCommandOptionType.Channel,
                required: true
        }]
    },
    {
        name: 'addwhitelist',
        description: 'Whitelists a channel.',
        options: [{
                name: 'channel',
                description: 'Whitelist channel',
                type: ApplicationCommandOptionType.Channel,
                required: true
        }]
    },
    {
        name: 'removewhitelist',
        description: 'Un-whitelists a channel.',
        options: [{
                name: 'channel',
                description: 'Remove whitelist channel',
                type: ApplicationCommandOptionType.Channel,
                required: true
        }]
    },
    {
        name: 'clearwhitelist',
        description: 'Clears whitelisted channels.'
    }
];

const rest = new REST({ version: '10' }).setToken(discord_token);

(async () => {
    try {
        console.log("Setting up slash commands.");
        await rest.put(
            Routes.applicationCommands(client_id),
            { body: commands }
        );
        console.log("Slash commands are set up.");
    } catch (e) {
        console.error(e);
    }

})();
