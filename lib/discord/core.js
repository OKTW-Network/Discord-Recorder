const Discord = require('eris');
const TextUtils = require("./text.js");
const AudioUtils = require("./audio.js");
const FileUtils = require("./file.js");

module.exports = function () {

    const discordClient = Discord(global.config.discord.config.token)

    global.discord = {};

    console.log("[Discord] Connecting...")

    discordClient.on("ready", () => {

        AudioUtils(discordClient);
        TextUtils(discordClient);
        FileUtils(discordClient);

        console.log("[Discord] Ready.")

        global.discord.botUser = discordClient.user;
        global.discord.channelRecvMixers = {};
        global.discord.outputMP3Streams = {};

        global.discord.userOPUSStreams = {};
        global.discord.userDecoders = {};
        global.discord.userPCMStreams = {};
        global.discord.userMixers = {};
        global.discord.userMP3Buffers = {};

    })

    discordClient.connect();

}