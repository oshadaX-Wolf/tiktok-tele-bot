const TelegramBot = require("node-telegram-bot-api");
const { ttdl } = require("btch-downloader");
const util = require("util");
const chalk = require("chalk");
const figlet = require("figlet");
const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const request = require("request");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 8080;

// Initialize bot with polling
const token = '6162835664:AAH4U09W70ro9ltzJ4ikopkccIc-YKl3B5U'; // Replace with your bot token
const bot = new TelegramBot(token, { polling: true });

const adminId = "5310455183"; // Replace with your Telegram user ID

// MongoDB connection
const mongoURI = 'mongodb+srv://fxcloudx:fxcloudx@oshada1.wnuhs.mongodb.net/?retryWrites=true&w=majority'; // Replace with your MongoDB connection string
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(chalk.green('Connected to MongoDB')))
  .catch(err => console.log(chalk.red('MongoDB connection error:', err)));

// Define a User schema
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  dateAdded: { type: Date, default: Date.now }
});

// Create a User model
const User = mongoose.model('User', userSchema);

// Express server
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const data = {
    status: "true",
    message: "Bot Successfully Activated!",
    author: "vimukthi_oshada",
  };
  const result = {
    response: data,
  };
  res.send(JSON.stringify(result, null, 2));
});

function listenOnPort(port) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  app.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${port} is already in use. Trying another port...`);
      listenOnPort(port + 1);
    } else {
      console.error(err);
    }
  });
}

listenOnPort(port);

// Bot startup time
let Start = new Date();

// Logging function
const logs = (message, color) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(chalk[color](`[${timestamp}] => ${message}`));
};

// Figlet banner
const Figlet = () => {
  figlet.text(
    "TikTok Downloader",
    {
      font: "Standard",
      horizontalLayout: "default",
    },
    (err, data) => {
      if (err) {
        console.log("Error:", err);
        return;
      }
      console.log(chalk.cyan.bold(data));
      console.log(chalk.cyan.bold("BOTCAHX - TikTok Downloader Bot"));
    },
  );
};

// Handle polling errors
bot.on("polling_error", (error) => {
  logs(`Polling error: ${error.message}`, "blue");
});

// Set bot commands with emojis
bot.setMyCommands([
  { command: "/start", description: "🚀 Start a new conversation" },
  { command: "/runtime", description: "⏳ Check bot runtime" },
  { command: "/owner", description: "👤 Bot Owner" },
  { command: "/usercount", description: "📊 View user count (Admin)" },
  { command: "/broadcast", description: "📢 Broadcast a message (Admin)" },
]);

// /runtime command
bot.onText(/^\/runtime$/, (msg) => {
  const now = new Date();
  const uptimeMilliseconds = now - Start;
  const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
  const uptimeMinutes = Math.floor(uptimeSeconds / 60);
  const uptimeHours = Math.floor(uptimeMinutes / 60);

  const From = msg.chat.id;
  const uptimeMessage = `🕒 *Active*: ${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`;

  bot.sendMessage(From, uptimeMessage, { parse_mode: "Markdown" });
});

// /start command with three buttons
bot.onText(/^\/start$/, async (msg) => {
  const From = msg.chat.id;

  // Check if user already exists
  let user = await User.findOne({ telegramId: From });
  if (!user) {
    // Add new user to the database
    user = new User({ telegramId: From });
    await user.save();
    logs(`New user added: ${From}`, "green");
  }

  const caption = `
✨ *Welcome to TikTok Downloader Bot!* ✨
I'm here to help you download TikTok videos automatically. Just send me the TikTok URL and I'll do the rest! 

🔹 _Features:_
1. Download TikTok videos 📹
2. Extract audio 🎧
3. Quick and easy to use 🚀

Feel free to share this bot with your friends!`;

  const options = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📥 Download Video", callback_data: "download_video" },
          { text: "⏳ Check Runtime", callback_data: "check_runtime" },
          { text: "👤 Owner Info", callback_data: "owner_info" },
        ],
        [
          { text: "🔗 Join Our Channel", url: "https://t.me/botdves" }, // External link button
        ],
      ],
    },
  };

  bot.sendMessage(From, caption, options);
  bot.sendSticker(
    From,
    "CAACAgIAAxkBAAECWvtm0MgJmvhfy5ZTc83aNr0wU9GxpQACcSAAAr6A-Uqv-laZwM-fdzUE",
  ); // Replace with your sticker file ID
});

// Handle button clicks
bot.on("callback_query", async (callbackQuery) => {
  const message = callbackQuery.message;
  const From = message.chat.id;
  const data = callbackQuery.data;

  switch (data) {
    case "download_video":
      await bot.sendMessage(
        From,
        "📥 *Download Video*\nPlease send me the TikTok URL you wish to download.",
        { parse_mode: "Markdown" },
      );
      break;

    case "check_runtime":
      const now = new Date();
      const uptimeMilliseconds = now - Start;
      const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
      const uptimeMinutes = Math.floor(uptimeSeconds / 60);
      const uptimeHours = Math.floor(uptimeMinutes / 60);

      const uptimeMessage = `🕒 *Active*: ${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`;
      await bot.sendMessage(From, uptimeMessage, { parse_mode: "Markdown" });
      break;

    case "owner_info":
      const ownerMessage = `👤 *Bot Owner*: @vimukthioshada`;
      await bot.sendMessage(From, ownerMessage, { parse_mode: "Markdown" });
      break;

    default:
      await bot.sendMessage(From, "❌ Unknown command.");
  }

  // Acknowledge the callback to remove the loading state
  await bot.answerCallbackQuery(callbackQuery.id);
});

// /owner command
bot.onText(/^\/owner$/, (msg) => {
  const From = msg.chat.id;
  const ownerMessage = `👤 *Bot Owner*: @vimukthioshada`;

  bot.sendMessage(From, ownerMessage, { parse_mode: "Markdown" });
});

// /usercount command for admin to check the user count
bot.onText(/^\/usercount$/, async (msg) => {
  const From = msg.chat.id;
  if (From.toString() === adminId) {
    const userCount = await User.countDocuments();
    const userCountMessage = `📊 *Total Users*: ${userCount}`;
    bot.sendMessage(From, userCountMessage, { parse_mode: "Markdown" });
  } else {
    bot.sendMessage(From, "❌ You do not have permission to use this command.");
  }
});

// /broadcast command for admin to send messages to all users
bot.onText(/^\/broadcast (.+)$/, async (msg, match) => {
  const From = msg.chat.id;
  const message = match[1]; // Extract the message to broadcast

  if (From.toString() !== adminId) {
    await bot.sendMessage(
      From,
      "❌ You do not have permission to use this command.",
    );
    return;
  }

  if (!message) {
    await bot.sendMessage(
      From,
      "❌ Please provide a message to broadcast.",
    );
    return;
  }

  const users = await User.find({});
  for (const user of users) {
    try {
      await bot.sendMessage(user.telegramId, message, { parse_mode: "Markdown" });
    } catch (err) {
      console.log(chalk.red(`Failed to send message to ${user.telegramId}:`, err));
    }
  }

  await bot.sendMessage(From, "✅ Broadcast message sent to all users.");
});

// Handle TikTok URL messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Check if message contains a TikTok URL
  const tikTokRegex = /http(?:s)?:\/\/(?:www\.)?tiktok\.com\/[^\s]+/i;
  if (tikTokRegex.test(text)) {
    const url = text.match(tikTokRegex)[0];

    try {
      await bot.sendMessage(
        chatId,
        "🔄 *Downloading...* Please wait a moment.",
        { parse_mode: "Markdown" },
      );

      const result = await ttdl(url);

      const videoPath = `./downloads/${result.videoDetails.title}.mp4`;
      const audioPath = `./downloads/${result.videoDetails.title}.mp3`;

      // Download video
      request(result.videoDetails.url).pipe(fs.createWriteStream(videoPath))
        .on('close', async () => {
          await bot.sendVideo(chatId, videoPath, { caption: '🎥 *Here is your video*', parse_mode: 'Markdown' });
          fs.unlinkSync(videoPath); // Remove file after sending
        });

      // Download audio
      request(result.audioDetails.url).pipe(fs.createWriteStream(audioPath))
        .on('close', async () => {
          await bot.sendAudio(chatId, audioPath, { caption: '🎧 *Here is the audio*', parse_mode: 'Markdown' });
          fs.unlinkSync(audioPath); // Remove file after sending
        });
    } catch (error) {
      await bot.sendMessage(
        chatId,
        "❌ *Failed to download the video.* Please make sure the URL is correct and try again.",
        { parse_mode: "Markdown" },
      );
      logs(`Error downloading video: ${error.message}`, "red");
    }
  }
});

// Display figlet banner on start
Figlet();
