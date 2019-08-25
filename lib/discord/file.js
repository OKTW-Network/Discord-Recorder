module.exports = function(discordClient) {
    global.discord.sendFile = function (channelID,fileData,fileName){
        discordClient.createMessage(channelID, "", {
            file: fileData,
            name: fileName
        })
    }
}