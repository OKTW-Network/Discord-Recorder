const Stream = require('stream');
const Prism = require('prism-media');
const moment = require('moment-timezone')
const AudioUtils = require('./../audio.js');
const LicsonMixer = require('./../lisconMixer/mixer.js');

function startRecord(connection, channelConfig) {
    const recvStream = connection.receive("opus");
    const outputMixer = new LicsonMixer(16, 2, 48000);

    console.log("[Discord Record] Start record in voice channel => " + channelConfig.channelID + " .");

    const userDecoders = {};
    const userStreams = {};

    global.discord.userMP3Buffer[channelConfig.channelID] = {};

    recvStream.on("data", (data, userID, timestamp, sequence) => {
        if (userID == undefined || channelConfig.record.ignoreUsers.includes(userID)) {
            return;
        }
        if (!(userID in userDecoders)) {
            var outputStream = new Stream.PassThrough();

            console.log("[Discord Record] Add user " + userID + " to record mixer " + channelConfig.channelID + " .")

            userDecoders[userID] = new Prism.opus.Decoder({ channels: 2, rate: 48000, frameSize: 960 });
            userStreams[userID] = new Stream.PassThrough();

            // recvData(OPUS) => decoders(OPUS)
            userStreams[userID].pipe(userDecoders[userID]);
            // decoder(PCM) => outputStream(PCM)
            userDecoders[userID].pipe(outputStream)
            // outputStream(PCM) => mixer(PCM)
            outputMixer.addSource(outputStream)
            
            // decoder(PCM) => userMixer(PCM)
            const userMixer = new LicsonMixer(16, 2, 48000);
            userMixer.addSource(outputStream)
            // userMixer(PCM) => userMP3Stream(MP3)
            global.discord.userMP3Buffer[channelConfig.channelID][userID] = [];
            AudioUtils.generatePCMtoMP3Stream(userMixer).on("data",mp3Data=>{
                global.discord.userMP3Buffer[channelConfig.channelID][userID].push(mp3Data);
                if (global.discord.userMP3Buffer[channelConfig.channelID][userID].length > 2048) {
                    global.discord.userMP3Buffer[channelConfig.channelID][userID].shift(global.discord.userMP3Buffer[channelConfig.channelID][userID].length - 2048)
                }
            });
        }
        userStreams[userID].push(data);

    });

    const mp3Stream = AudioUtils.generatePCMtoMP3Stream(outputMixer);

    if (channelConfig.record.sendTo.type == 'telegram' && channelConfig.record.sendTo.chatID) {
        var mp3File = []
        var mp3Start = moment().tz('Asia/Taipei').format('YYYY-MM-DD hh:mm:ss')
        mp3Stream.on('data', function(data) {
            mp3File.push(data)
        })
        setInterval(() => {
            var mp3End = moment().tz('Asia/Taipei').format('YYYY-MM-DD hh:mm:ss')
            const caption = `${mp3Start} -> ${mp3End} \n${moment().tz("Asia/Taipei").format("#YYYYMMDD #YYYY")}`
            const fileName = mp3Start + ' to ' + mp3End + '.mp3'

            mp3Start = moment().tz('Asia/Taipei').format('YYYY-MM-DD hh:mm:ss')

            const fileData = Buffer.concat(mp3File)

            global.telegram.sendAudio(channelConfig.record.sendTo.chatID, fileData, fileName, caption)

            mp3File = [];
        }, 20 * 1000)
    }
}

module.exports = {
    startRecord
}