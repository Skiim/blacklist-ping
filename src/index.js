configPath = '../config.json';
const { discord_token, nlp_token } = require(configPath);
let { mod_channel, whitelist } = require(configPath);

const editJsonFile = require("edit-json-file");
const NLPCloudClient = require('nlpcloud');

const nlpclient = new NLPCloudClient({model:'finetuned-llama-2-70b', token:nlp_token, gpu:true});
const { Client, Events, GatewayIntentBits, messageLink } = require('discord.js');

const configFile = editJsonFile(configPath);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ]
});

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.displayName}`);
});

client.on('interactionCreate', (i) => {
    if(!i.isChatInputCommand())
        return;

    if(i.commandName === "set")
    {
        mod_channel = i.options.get('channel').value
        configFile.set("mod_channel", i.options.get('channel').value);
        configFile.save();
        i.reply("New mod notification channel is set.");
    }

    if(i.commandName === "addwhitelist")
    {
        if(i.options.get('channel').value in whitelist){
            i.reply("The channel specified is already in whitelist");
            return;
        }

        whitelist.push(i.options.get('channel').value);
        configFile.append("whitelist", i.options.get('channel').value);
        configFile.save();
        i.reply("New whitelist channel is set.");
    }

    if(i.commandName === "removewhitelist")
    {
        for(x = 0, removals = 0; x < whitelist.length; x++) {
            if(whitelist[x] === i.options.get('channel').value)
                whitelist.splice(x, 1);
        }
        if(removals == 0) {
            i.reply("The specified channel was not whitelisted.");
            return;
        }
        configFile.set("whitelist", whitelist);
        configFile.save();
        i.reply("New whitelist channel is set.");
    }

    if(i.commandName === "clearwhitelist")
    {
        whitelist = [];
        configFile.set("whitelist", "[]");
        configFile.save();
        i.reply("Whitelisted channels have been cleared.");
    }
})

const wordlists = require('../wordlists.json');
blacklist = wordlists.blacklist;
greylist = wordlists.greylist;

client.on('messageCreate', (msg) => {
    if(msg.author.bot || whitelist.includes(msg.channelId))
        return;

    if( blacklist.some((word) => msg.content.toLowerCase().includes(word)) ) {
        client.channels.cache.get(mod_channel).send(
            `Warning @everyone!  ${msg.author} has violated the TOS:  ` +
            `https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`
        );
        return;
    }

    if( greylist.some((word) => msg.content.toLowerCase().includes(word)) ) {
        nlpclient.generation({
            text: `Is the sentiment in the following message positive, negative, or neutral? 
            '${msg.content}'`,
            maxLength:50,
            lengthNoinput:true,
            endSequence:null,
            removeInput:true,
            numBeams:1,
            numReturnSequences:1,
            topK:50,
            topP:1,
            temperature:0.8,
            repetitionPenalty:1,
            badWords:null,
            removeEndSequence:false
        }).then(function (response) {
            if(response.data.generated_text.toLowerCase().includes("neg")){
                client.channels.cache.get(mod_channel).send(
                    `Warning @everyone!  ${msg.author} may have violated the TOS:  ` +
                    `https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`
                );
            }
        }).catch(function (err) {
            console.error(err.response.status);
            console.error(err.response.data.detail);
        });
    }
});

client.login(discord_token);
