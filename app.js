// DO NOT EDIT THIS IF YOU DONT KNOW WHAT YOU ARE DOING!!!!
// THIS IS A SENSITIVE FILE
// YOU HAVE BEEN WARNED
// Require dotenv for simple use!!!
require("dotenv").config();
// Constant with the Client Enum and Discord.js require
const { Client, GatewayIntentBits } = require("discord.js");
// IRC require
var irc = require("irc");
const { threadId } = require("worker_threads");
var dc;


// Below starts the first seen command testing
const sqlite3 = require("sqlite3").verbose();
//create table seen
const db = new sqlite3.Database('./seen.db');
//sql = 'CREATE TABLE users(nick,msg,time)';
//db.run(sql);
//db.run('CREATE TABLE users(nick TEXT,msg TEXT,time TEXT)');

// Webhook constants to send msg to discord as nick from IRC
const { hook, WebhookClient } = require("discord.js");
const { AllowedMentionsTypes } = require("discord-api-types/v10");
const { isNull } = require("util");
const namehook = new WebhookClient({ id: "1019732296288456725", token: "MuyVwfY4S52i526R5QyH-YOAX9OJytpTEEGrEaBzz8VIAQAPYTc_unW6JQWWgobOMmx4" });
//var hookerid = "1019732296288456725"

// These are the intents to ask the API for certain things
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ],
});

//check if the messages contain only spaces.
function onlySpaces(str) {
    return str.trim().length === 0;
}

// Starts the client connection to the API and displays msg to console that you are logged in
client.on("ready", () => {
    console.log(`Logged To Discord.js API As - ${client.user.tag}!`);
});
// Starts the IRC bot with a new irc.CLient to connect to the API also logs into IRC here
var bot = new irc.Client(process.env.irc_server, process.env.nick, {
    channels: ["#" + process.env.channel],
    password: process.env.pass,
    // Undenote below line if channel has a password
    //channels: ["#" + process.env.chan_and_pass],
    // change below to false to see everything the irc api sends to your console
    debug: false,
    showErrors: false,
});

// Creating an async await function (needed to properly use discord.js channel for channel.send)
// THIS IN ITSELF IS A BITCH
(async () => {
    // Logs in client to discord API
    await client.login(process.env.DISCORD_BOT_TOKEN);
    // Need this line below to tell the code later on what channel the bot sends messages to!
    const discordchannel = await client.channels.fetch(process.env.discord_chan_id);
    dc = discordchannel;
    // Create our first IRC MSG READER
    bot.addListener("message", function (from, to, message) {
        console.log('Discord '+message.charCodeAt(0))
        //newSeen is the msg ouputted into seen.json
        //var newSeen = [{ nick: from, msg: message },];
        //discordchannel.send("[" + from + "]: " + message);
	if (message == "-version") {
		bot.send("PRIVMSG", "#" + process.env.channel, "Akuma Version 2 by 000");
	}
        else if (message.startsWith("-seen ")) {
            namehook.send({
                content: message,
                username: from + " [IRC]",
                avatar: "https://imgur.com/hkBEZbg",
                allowedMentions: {
                    parse: ["users"]
                }
            })
            var yop = message.replace("-seen ", "")
            var kip = yop.replace(/ +$/, '')
            db.all("SELECT * FROM users WHERE nick = ? LIMIT 1", kip, (err, row) => {
                if (row.length === 0) {
                    setTimeout(() => {
                        discordchannel.send("I have not seen " + yop);
                        bot.send("PRIVMSG", "#" + process.env.channel, "I have not seen " + yop);
                    }, 1.5 * 1000)
                };

                row.forEach((row) => {
                    var ate = new Date();
                    var sin = ate.getTime();
                    var poo = sin - row.time
                    var don = convertToDays(poo);
                    var lol = JSON.stringify(don)
                    var hor = lol.replace(/"/g, "")
                    var lor = hor.replace("{", "")
                    var cor = lor.replace("}", "")
                    var gor = cor.replace(/,/g, " ")
                    var tor = gor.replace(/:/g, ": ")
                    var d2y = tor.replace("days: ", " ")
                    var h2r = d2y.replace("hours: ", "Days, ")
                    var m2n = h2r.replace("minutes: ", "Hours, and ")
                    var m3n = m2n + " minutes"
                    var d0y = m3n.replace(" 0 Days, ", " ")
                    var h0r = d0y.replace(" 0 Hours, and ", " ")
                    setTimeout(() => {
                        discordchannel.send(kip + " was seen" + h0r + " ago saying " + row.msg);
                        bot.send("PRIVMSG", "#" + process.env.channel, kip + " was seen" + h0r + " ago saying " + row.msg);
                    }, 1.5 * 1000)
                })
            })

            //prevent the webhook from crashing if user sends only whitespaces
        } else if (onlySpaces(message)) {
            console.log("msg was null, not sending it")
			// prevent rook from sending ctrl + i and killing it
        } else if (message == "\x1D") {
            console.log("msg was null, not sending it")

        } else {
            namehook.send({
                content: message,
                username: from + " [IRC]",
                avatar: "https://imgur.com/hkBEZbg",
                allowedMentions: {
                    parse: ["users"]
                }
            });
            console.log("%s => %s: %s", from, to, message);
            // insert new msg into database from irc
            db.get("SELECT * FROM users WHERE nick = ? LIMIT 1", from, (err, row) => {
                var ate = new Date();
                var sin = ate.getTime();
                if (row) {
                    db.run('UPDATE users SET msg = ?, time = ? WHERE nick = ?', [message, sin, from]);
                } else {
                    db.run('INSERT INTO users(nick, msg, time) VALUES(?, ?, ?)', [from, message, sin], (err) => {
                        if (err) {
                            return console.log(err.message);
                        }
                        console.log('Row was added to the seen database: ' + from + ', ' + message);
                    })
                }
            });
        }
    });

    // Below put simply is 4 ways to interpret IRC actions, join, quit, and kick msgs to IRC
    bot.addListener('action', function (from, to, text, message) {
        console.log('***' + from + ' ' + text + '***')
        //discordchannel.send('***' + from + ' ' + text + '***')
        namehook.send({
            content: '***' + text + '***',
            username: from + " [IRC]",
            avatar: "https://imgur.com/hkBEZbg",
            allowedMentions: {
                parse: ["users"]
            }
        });
    });
    bot.addListener('join', function (channel, nick, message) {
        console.log('**```' + nick + ' has joined IRC ' + '#' + process.env.channel + '      [' + process.env.irc_server + ']```**')
        discordchannel.send('**```' + nick + ' has joined IRC ' + '#' + process.env.channel + '      [' + process.env.irc_server + ']```**');
    });
    bot.addListener('quit', function (nick) {
        console.log('**```' + nick + ' has left IRC ' + '#' + process.env.channel + '      [' + process.env.irc_server + ']```**')
        discordchannel.send('**```' + nick + ' has left IRC ' + '#' + process.env.channel + '      [' + process.env.irc_server + ']```**');
    });
    bot.addListener('kick', function (channel, who, by, reason) {
        console.log('**```' + who + ' was kicked by ' + by + '      [' + process.env.irc_server + ']```**')
        discordchannel.send('**```' + who + ' was kicked by ' + by + '      [' + process.env.irc_server + ']```**');
    });
    bot.addListener('nick', function (oldnick, newnick, channels, message) {
        console.log('**```' + oldnick + ' is now known as ' + newnick + '```**')
        discordchannel.send('**```' + oldnick + ' is now known as ' + newnick + '```**');
    });
    
    // Creates a function to wait for any messages created in discord
    client.on("messageCreate", async (message) => {
        // If the message is from the bot itself or its webhook, ignore it
        if (message.author === client.user || message.webhookId) return;
        // Narrows new messages down to process.env.discord_chan_id
        else if (message.channel.id === process.env.discord_chan_id) {
            // Checks to see is user has a nick. This is caused by message.member.nickname == null
            if (message.channel.id === process.env.discord_chan_id && message.content.startsWith("-seen ") && message.member.nickname == undefined) {
                bot.send("PRIVMSG", "#" + process.env.channel, "[" + message.author.username + "]: " + message.content);
                var kop = message.content.replace("-seen ", "")
                db.all("SELECT * FROM users WHERE nick = ? LIMIT 1", kop, (err, row) => {
                    if (row.length === 0) {
                        discordchannel.send("I have not seen " + kop);
                        bot.send("PRIVMSG", "#" + process.env.channel, "I have not seen " + kop);
                    }
                    row.forEach((row) => {
                        var ate = new Date();
                        var sin = ate.getTime();
                        var poo = sin - row.time
                        var don = convertToDays(poo);
                        var lol = JSON.stringify(don)
                        var hor = lol.replace(/"/g, "")
                        var lor = hor.replace("{", "")
                        var cor = lor.replace("}", "")
                        var gor = cor.replace(/,/g, " ")
                        var tor = gor.replace(/:/g, ": ")
                        var d2y = tor.replace("days: ", " ")
                        var h2r = d2y.replace("hours: ", "Days, ")
                        var m2n = h2r.replace("minutes: ", "Hours, and ")
                        var m3n = m2n + " minutes"
                        var d0y = m3n.replace(" 0 Days, ", " ")
                        var h0r = d0y.replace(" 0 Hours, and ", " ")
                        discordchannel.send(kop + " was seen" + h0r + " ago saying " + row.msg);
                        bot.send("PRIVMSG", "#" + process.env.channel, kop + " was seen" + h0r + " ago saying " + row.msg);
                    })
                })
            }
            else if (message.channel.id === process.env.discord_chan_id && message.content.startsWith("-seen ")) {
                bot.send("PRIVMSG", "#" + process.env.channel, "[" + message.member.nickname + "]: " + message.content);
                var kop = message.content.replace("-seen ", "")
                db.all("SELECT * FROM users WHERE nick = ? LIMIT 1", kop, (err, row) => {
                    if (row.length === 0) {
                        discordchannel.send("I have not seen " + kop);
                        bot.send("PRIVMSG", "#" + process.env.channel, "I have not seen " + kop);
                    }
                    row.forEach((row) => {
                        var ate = new Date();
                        var sin = ate.getTime();
                        var poo = sin - row.time
                        var don = convertToDays(poo);
                        var lol = JSON.stringify(don)
                        var hor = lol.replace(/"/g, "")
                        var lor = hor.replace("{", "")
                        var cor = lor.replace("}", "")
                        var gor = cor.replace(/,/g, " ")
                        var tor = gor.replace(/:/g, ": ")
                        var d2y = tor.replace("days: ", " ")
                        var h2r = d2y.replace("hours: ", "Days, ")
                        var m2n = h2r.replace("minutes: ", "Hours, and ")
                        var m3n = m2n + " minutes"
                        var d0y = m3n.replace(" 0 Days, ", " ")
                        var h0r = d0y.replace(" 0 Hours, and ", " ")
                        discordchannel.send(kop + " was seen" + h0r + " ago saying " + row.msg);
                        bot.send("PRIVMSG", "#" + process.env.channel, kop + " was seen" + h0r + " ago saying " + row.msg);
                    })
                })
            }
            else if (message.channel.id === process.env.discord_chan_id && message.member.nickname == undefined) {
                // If user has no nick then use message.author.username which is the normal username example Tester#0123
                console.log("#"+process.env.channel+" [" + message.author.username + "]: " + message.content);
                var joa = message.content
				var oof = joa.split(/\r?\n/) // Split input text into an array of lines
				var rab = oof.filter(line => line.trim() !== "") // Filter out lines that are empty or contain only whitespac
				var ooc = rab.join(" "); // Join line array into a string
				// empty newline fix?
				let result = joa.replace(/^\s*[\r\n]/gm, '');
				var kai = ooc.replace("\n", " ")
                bot.send("PRIVMSG", "#" + process.env.channel, "[" + message.author.username + "]: " + ooc);
                // insert new msg into database from discord without nicknames
                db.get("SELECT * FROM users WHERE nick = ? LIMIT 1", message.author.username, (err, row) => {
                    var ate = new Date();
                    var sin = ate.getTime();
                    if (row) {
                        db.run('UPDATE users SET msg = ?, time = ? WHERE nick = ?', [message.content, sin, message.author.username]);
                    } else {
                        db.run('INSERT INTO users(nick, msg, time) VALUES(?, ?, ?)', [message.author.username, message.content, sin], (err) => {
                            if (err) {
                                return console.log(err.message);
                            }
                            console.log('Row was added to the seen database: ' + message.author.username + ', ' + message.content + ', ' + sin);
                        })
                    }
                })
            } else if (message.channel.id === process.env.discord_chan_id) {
                // If message.member.nickname has a value it will do this below
                var ate = new Date();
                var sin = ate.getTime();
                console.log("[" + message.member.nickname + "]: " + message.content);
                var loa = message.content
				var foo = loa.split(/\r?\n/) // Split input text into an array of lines
				var bar = foo.filter(line => line.trim() !== "") // Filter out lines that are empty or contain only whitespac
				var coo = bar.join(" "); // Join line array into a string
				// empty newline fix?
				let resolt = loa.replace(/^\s*[\r\n]/gm, '');
				var iak = coo.replace("\n", " ")
                bot.send("PRIVMSG", "#" + process.env.channel, "[" + message.member.nickname + "]: " + coo);
                db.get("SELECT * FROM users WHERE nick = ? LIMIT 1", message.member.nickname, (err, row) => {
                    if (row) {
                        db.run('UPDATE users SET msg = ?, time = ? WHERE nick = ?', [message.content, sin, message.member.nickname]);
                    } else {
                        db.run('INSERT INTO users(nick, msg, time) VALUES(?, ?, ?)', [message.member.nickname, message.content, sin], (err) => {
                            if (err) {
                                return console.log(err.message);
                            }
                            console.log('Row was added to the seen database: ' + message.member.nickname + ', ' + message.content + ', ' + sin);
                        })
                    }
                })
            }
        }
    })
})();

function multiLine1(nok, tet) {}
	//send msg 
function multiLine2(kon, iei) {}
	//send msg

function convertToDays(poo) {
    let days = Math.floor(poo / (86400 * 1000));
    poo -= days * (86400 * 1000);
    let hours = Math.floor(poo / (60 * 60 * 1000));
    poo -= hours * (60 * 60 * 1000);
    let minutes = Math.floor(poo / (60 * 1000));
    return {
        days, hours, minutes
    }

}

try {
    // do some shit
} catch { };

    // MY FAV FEAUTURE by Samathingamajig
    // This Takes input from the console and allows you to send it to IRC and Discord as [console]:
    // Displaying some werid error on irc if you wanna test it denote the next 4 lines
    process.stdin.on("data", (data) => {
        bot.send("PRIVMSG", "#"+process.env.channel, "[console]: " + data.toString().trim());
	dc.send("[console]: "+data.toString().trim());
    });
//})();
