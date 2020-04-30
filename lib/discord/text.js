const AudioUtils = require("../audio.js");

module.exports = function(discordClient) {
    discordClient.on('messageCreate', async(msg) => {

        if (!msg.member) {
            return;
        }

        const discordConfig = global.config.discord;

        const channelName = msg.channel.name;
        const channelID = msg.channel.id;

        const userNick = (msg.member.nick) ? msg.member.nick : "";
        const userName = msg.member.user.username;
        const userID = msg.member.user.id;

        const messageContent = msg.content;

        // Log
        console.log(`[Discord Log] ${userNick}[${userName},${userID}] => ${channelName} : ${messageContent.split("\n")[0]}`);

        if (userID == global.discord.botUser.id) {
            return;
        }

        // Command
        var commands = [];

        msg.content.split("\n").forEach(command => {
            if (discordConfig.commandPrefix) {
                if (discordConfig.commandPrefix && msg.content[0] == discordConfig.commandPrefix) {
                    commands.push(command.substr(1));
                }
            } else {
                commands.push(command);
            }
        })

        soundPlayHandler(discordClient, msg, commands);

        commands.forEach(command => {
            switch (command.split(" ")[0]) {
                case "ping":
                    sendMessage(discordClient, channelID, "pong")
                    break;
                case "pong":
                    sendMessage(discordClient, channelID, "ping")
                    break;
                case "help":
                    let commandSounds = [];
                    let keywordSounds = [];
                    for (let [filename, sound] of Object.entries(global.config.sounds)) {
                        commandSounds.push(...sound.commands)
                        keywordSounds.push(...sound.keywords)
                    }
                    let prefix = discordConfig.commandPrefix;
                    sendMessage(discordClient, channelID,
                        `Commands : \n${prefix}ping\n${prefix}pong\n${prefix}help\n${prefix}download {userID}\n${prefix}memory\n` + prefix + commandSounds.join("\n" + prefix) + "\nKeywords : \n" + keywordSounds.join("\n"))
                    break;
                case "download":
                    downloadUserMP3(discordClient, msg)
                    break;
                case "memory":
                    sendMessage(discordClient, channelID, "```\n" + JSON.stringify(process.memoryUsage()) + "\n```")
                    break;
                default:
                    break;
            }
        })
    })
}

async function downloadUserMP3(client, msg) {
    const voiceChannelID = msg.member.voiceState.channelID;
    if (voiceChannelID == null && commandSounds.length != 0) {
        sendMessage(client, msg.channel.id, "You are not in any voice channel.")
        return;
    }

    if (!voiceChannelID in global.discord.audio.connections && commandSounds.length != 0) {
        sendMessage(client, msg.channel.id, "Bot not in your voice channel.")
        return;
    }

    const toDownloadUserID = msg.content.split(" ")[1];
    if (toDownloadUserID in global.discord.userMP3Buffers[voiceChannelID]) {
        global.discord.sendFile(msg.channel.id, Buffer.concat(global.discord.userMP3Buffers[voiceChannelID][toDownloadUserID]), toDownloadUserID + ".mp3");
    }
}

async function soundPlayHandler(client, msg, commands) {
    const sounds = global.config.sounds;
    const keywordSounds = [];
    const commandSounds = [];

    for (const [fileName, data] of Object.entries(sounds)) {
        data.commands.forEach(command => {
            commands.forEach(msgCommand => {
                if (msgCommand == command) {
                    commandSounds.push(fileName);
                }
            })
        });
        data.keywords.forEach(keyword => {
            if (msg.content.includes(keyword)) {
                keywordSounds.push(fileName);
            }
        });
    }

    if (commandSounds.length != 0 || keywordSounds.length != 0) {
        const voiceChannelID = msg.member.voiceState.channelID;
        if (voiceChannelID == null && commandSounds.length != 0) {
            sendMessage(client, msg.channel.id, "You are not in any voice channel.")
            return;
        }

        if (!voiceChannelID in global.discord.audio.connections && commandSounds.length != 0) {
            sendMessage(client, msg.channel.id, "Bot not in your voice channel.")
            return;
        }

        commandSounds.forEach(fileName => {
            soundPlay(msg, fileName);
        })
        keywordSounds.forEach(fileName => {
            soundPlay(msg, fileName);
        })
    }
}

async function soundPlay(msg, fileName) {
    const voiceChannelID = msg.member.voiceState.channelID;

    console.log("[Discord Sound] Play " + fileName + " in voice channel " + voiceChannelID + " trigger by " + msg.member.user.username);

    const playStream = AudioUtils.soundFileStreamGenerator("assets/sounds/" + fileName);
    AudioUtils.addStreamToChannelPlayMixer(playStream, voiceChannelID);
}

async function sendMessage(client, channelID, message) {
    client.createMessage(channelID, message);
}
