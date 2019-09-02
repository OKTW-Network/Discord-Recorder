module.exports = function (telegramClient) {
    global.telegram.sendAudio = function (chatID, fileData, filename, caption) {
        telegramClient.sendAudio(
                chatID,
                fileData, {
                    filename: filename,
                    caption: caption
                }
            )
            .catch((err) => {
                console.log(chatID, fileData.toString(), filename, caption);
                console.error(err)
            })
    }
    global.telegram.sendDocument = function (chatID, fileData, filename, caption) {
        telegramClient.sendDocument(
                chatID,
                fileData, {
                    filename: filename,
                    caption: caption
                }
            )
            .catch((err) => {
                console.error(err)
            })
    }
}