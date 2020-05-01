const LicsonMixer = require("../licsonMixer/mixer.js");
const Stream = require("stream");
const moment = require("moment-timezone");
const AudioUtils = require("../audio")

module.exports = (discordClient) => {

    const voiceConfig = global.config.discord.voiceChannels;

    global.discord.audio = {};
    global.discord.audio.connections = {};
    global.discord.audio.playMixer = {};
    global.discord.audio.RecvMixer = {};

    const joinVoiceChannel = () => {
        voiceConfig.forEach(channel => {
            console.log("[Discord Voice] Connecting to voice channel => " + channel.channelID + " .");
            discordClient.joinVoiceChannel(channel.channelID).catch((err) => {
                console.log("[Discord Voice] Can't join channel :( => " + err.message);
                console.log(err);
            }).then((connection) => {
                console.log("[Discord Voice] Connected to voice channel => " + channel.channelID + " .");
                console.log("[Discord Record] Start record in voice channel => " + channel.channelID + " .");

                connection.once("disconnect", (err) => {
                    console.error(err);
                    connection.removeAllListeners();
                    streams.removeAllListeners();

                    setTimeout(() => {
                        discordClient.leaveVoiceChannel(channel.channelID);
                        joinVoiceChannel();
                    }, 5 * 1000);
                });
    
                const mixer = global.discord.audio.playMixer[channel.channelID] = new LicsonMixer(16, 2, 48000);
                const streams = connection.receive("pcm");
                const userMixer = new LicsonMixer(16, 2, 48000);
                const userMP3Buffers = global.discord.userMP3Buffers[channel.channelID] = {};
                let users = {};
                let userPCMStream = {}
    
                global.discord.audio.connections[channel.channelID] = connection;

                connection.play(mixer, {
                    format: "pcm",
                    voiceDataTimeout: -1
                });

                discordClient.on('voiceChannelSwitch', (member, newChannel, oldChannel) => {
                    if (newChannel != channel.channelID) {
                        if (users[member.id] && userPCMStream[member.id]) {
                            users[member.id].end()
                            userPCMStream[member.id].end()
                            delete users[member.id]
                            delete userPCMStream[member.id]
                        }
                    }
                })
    
                connection.on('userDisconnect', userID => {
                    if (users[userID] && userPCMStream[userID]) {
                        users[userID].end()
                        userPCMStream[userID].end()
                        delete users[userID]
                        delete userPCMStream[userID]
                    }
                })
    
                streams.on('data', (data, userID) => {
                    if (userID == undefined || channel.record.ignoreUsers.includes(userID)) return
                    if (!users[userID]) {
                        console.log(`[Discord Record] Add user ${userID} to record mixer ${channel.channelID} .`)
                        const userMP3Buffer = userMP3Buffers[userID] = [];
                        const userMixerSplit = new LicsonMixer(16, 2, 48000);
                        users[userID] = new Stream.PassThrough()
                        userPCMStream[userID] = new Stream.PassThrough()

                        userMixer.addSource(users[userID])
                        userMixerSplit.addSource(userPCMStream[userID])

                        AudioUtils.generatePCMtoMP3Stream(userMixerSplit).on('data', mp3Data => {
                            userMP3Buffer.push(mp3Data)
                            if (userMP3Buffer.length > 4096) userMP3Buffer.shift(userMP3Buffer.length - 4096)
                        })
                    }
                    users[userID].write(data)
                    userPCMStream[userID].write(data)
                })

                if (channel.record.sendTo.type == 'telegram' && channel.record.sendTo.chatID) {
                    let mp3File = []
    
                    AudioUtils.generatePCMtoMP3Stream(userMixer).on('data', data => {
                        mp3File.push(data)
                    })
    
                    const sendFile = setInterval(() => {
                        const mp3Start = moment().tz('Asia/Taipei').format('YYYY-MM-DD hh:mm:ss')
                        const mp3End = moment().tz('Asia/Taipei').format('YYYY-MM-DD hh:mm:ss')
                        const caption = `${mp3Start} -> ${mp3End} \n${moment().tz('Asia/Taipei').format('#YYYYMMDD #YYYY')}`
                        const fileName = `${mp3Start} to ${mp3End}.mp3`
                        const fileData = Buffer.concat(mp3File)
    
                        mp3File = []
                        global.telegram.sendAudio(channel.record.sendTo.chatID, fileData, fileName, caption)
                    }, 20 * 1000)
    
                    connection.once('disconnect', err => {
                        clearInterval(sendFile)
                    })
                }

                if (global.config.debug) {
                    connection.on("error", (err) => {
                        console.log(`[Discord Voice] Voice connection ${channel.channelID} error : `, err);
                    })
                    connection.on("warn", (err) => {
                        console.log(`[Discord Voice] Voice connection ${channel.channelID} warn : `, err);
                    })
                    connection.on("end", () => {
                        console.log(`[Discord Voice] Voice connection ${channel.channelID} end .`);
                    })
                    connection.on("ready", () => {
                        console.log(`[Discord Voice] Voice connection ready.`);
                    })
                }
            });
        })
    }

    joinVoiceChannel()
}
