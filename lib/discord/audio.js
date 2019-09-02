const LicsonMixer = require("../lisconMixer/mixer.js");
const Recorder = require('./recorder.js');


module.exports = function (discordClient) {

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

            const mixer = new LicsonMixer(16, 2, 48000);

            connection.play(mixer, {
                format: "pcm",
                voiceDataTimeout: -1
            });

            global.discord.audio.connections[channel.channelID] = connection;
            global.discord.audio.playMixer[channel.channelID] = mixer;

            Recorder.startRecord(connection, channel);
        });
    })

}