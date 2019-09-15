const LicsonMixer = require("../lisconMixer/mixer.js");
const Recorder = require('./recorder.js');

module.exports = connectToAudio;

function connectToAudio(discordClient) {

    const voiceConfig = global.config.discord.voiceChannels;

    global.discord.audio = {};
    global.discord.audio.connections = {};
    global.discord.audio.playMixer = {};
    global.discord.audio.RecvMixer = {};

    voiceConfig.forEach(channel => {
        console.log("[Discord Voice] Connecting to voice channel => " + channel.channelID + " .");
        discordClient.joinVoiceChannel(channel.channelID).catch((err) => {
            discordClient.createMessage(msg.channel.id, "Can't join channel :( => " + err.message);
            console.log(err);
        }).then((connection) => {
            console.log("[Discord Voice] Connected to voice channel => " + channel.channelID + " .");

            const mixer = global.discord.audio.playMixer[channel.channelID] = new LicsonMixer(16, 2, 48000);

            global.discord.audio.connections[channel.channelID] = connection;

            connection.play(mixer, {
                format: "pcm",
                voiceDataTimeout: -1
            });

            connection.on("error",(err) => {
                conosle.log(`[Discord Voice] Voice connection ${channel.channelID} error : ` , err);
            })
            connection.on("warn",(err) => {
                conosle.log(`[Discord Voice] Voice connection ${channel.channelID} warn : ` , err);
            })
            connection.on("end",() => {
                conosle.log(`[Discord Voice] Voice connection ${channel.channelID} end : `);
            })
            connection.on("ready",() => {
                Recorder.startRecord(connection, channel);
            })

        });
    })

}