const spawn = require('child_process').spawn;
const Stream = require('stream');

function soundFileStreamGenerator(filePath) {
    const stream = spawn(require('ffmpeg-static').path, [
        '-i', filePath,
        '-f', 's16le',
        '-ac', '2',
        '-acodec', 'pcm_s16le',
        '-ar', '48000',
        '-y', 'pipe:1'
    ])
    return (stream.stdout)
}

async function addStreamToChannelPlayMixer(stream, voiceChannelID) {
    const mixer = global.discord.audio.playMixer[voiceChannelID];
    const source = mixer.addSource(new Stream.PassThrough());
    stream.on("data", (data) => { source.addBuffer(data); })
}

function generatePCMtoMP3Stream(stream){
    outputStream = spawn(require('ffmpeg-static').path, [
        '-f', 's16le', // 16-bit raw PCM
        '-ac', 2, // in channels
        '-ar', 48000, // in sample rate
        '-i', '-', // stdin
        '-c:a', 'libmp3lame', //  LAME MP3 encoder
        '-ac', 2, // out channels
        '-ar', 48000, // out sample rate
        '-ab', '320k', // bitrate
        '-f', 'mp3', // MP3 container
        '-' // stdout
    ])

    stream.pipe(outputStream.stdin);

    return(outputStream.stdout);
}

module.exports = {
    soundFileStreamGenerator,
    addStreamToChannelPlayMixer,
    generatePCMtoMP3Stream
}