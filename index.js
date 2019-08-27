global.config = require("./config.json")

const DiscordHandler = require("./lib/discord/core.js");
const TelegramHandler = require("./lib/telegram/core.js");

console.log("[Info] Starting...")

DiscordHandler();
TelegramHandler();

// GC
setInterval(() => {
    global.gc();
},30 * 1000);