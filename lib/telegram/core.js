const Telegram = require('node-telegram-bot-api')

const TextUtils = require("./text.js");
const FileUtils = require("./file.js");

module.exports = function () {

    const telegramClient = new Telegram(global.config.telegram.config.token)

    global.telegram = {};

    TextUtils(telegramClient);
    FileUtils(telegramClient);

}