const { Client, Util } = require('discord.js');
const { TOKEN, PREFIX, GOOGLE_API_KEY } = require('./config');
const ytdl = require('ytdl-core');
const YouTube = require('simple-youtube-api');
const fs = require('fs');

const client = new Client({ disableEveryone: true });
const queue = new Map();
const youtube = new YouTube(GOOGLE_API_KEY);

client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => {
    console.log("ARC IS ONLINE")

    client.user.setStatus('Online');
    client.user.setActivity('Use %help to view the command list');

});

client.on('disconnect', () => console.log("ARC IS OFFLINE"));

client.on('reconnecting', () => console.log("ARC IS RECONNECTING"));



client.on('message', async msg => {

    if (msg.author.bot) return undefined;
    if (!msg.content.startsWith(PREFIX)) return undefined;
    const args = msg.content.split(' ');
    const searchString = args.slice(1).join(' ');
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
    const serverQueue = queue.get(msg.guild.id);

    if (msg.content.startsWith(`${PREFIX}play`)) {
        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel) return msg.channel.send("You must join a voice channel first.");
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has('CONNECT')) {

            return msg.channel.send("Do not have proper permissions.(CONNECT)");
        }

        if (!permissions.has('SPEAK')) {

            return msg.channel.send("Do not have proper permissions. (SPEAK)");
        }
        if (url.match(url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/))) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();

            msg.channel.send(`PlayList: **${playlist.title}** is being added to the queue!`);
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id);
                await handleVideo(video2, msg, voiceChannel, true);
            }
            return msg.channel.send(`PlayList: **${playlist.title}** has been added to the queue!`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            }
            catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    msg.channel.send(
                        `
♫***Song Selection***♫
${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}
        
-Please select your song (1-10)
    `
                    );
                    try {
                        var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                            maxMatches: 1,
                            time: 10000,
                            errors: ['time']
                        });
                    } catch (error3) {
                        console.error(error3);
                        return msg.channel.send('Canceling Video Selection');
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                }
                catch (error2) {
                    console.error(error2);
                    return msg.channel.send('Could not find any search results');
                }
            }
            return handleVideo(video, msg, voiceChannel);
        }
        return undefined;
    }



    else if (msg.content.startsWith(`${PREFIX}skip`)) {
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in the Voice Channel.');
        if (!serverQueue) return msg.channel.send(`There are not any songs to skip :P`);
        serverQueue.connection.dispatcher.end('Skip command used');
        return undefined;
    }

    else if (msg.content.startsWith(`${PREFIX}stop`)) {
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in the Voice Channel.');
        if (!serverQueue) return msg.channel.send('There is no song to stop :P');
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('Stop command used');
        msg.member.voiceChannel.leave();
        return undefined;
    }

    else if (msg.content.startsWith(`${PREFIX}volume`)) {
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in the Voice Channel.');
        if (!serverQueue) return msg.channel.send(`There is nothing playing :P`);
        if (!args[1]) return msg.channel.send(`The current volume is **${serverQueue.volume}**`);
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return msg.channel.send(`I have set the volume to: ***${args[1]}***`);
    }

    else if (msg.content.startsWith(`${PREFIX}np`)) {
        if (!serverQueue) return msg.channel.send(`There is nothing playing :P`);
        return msg.channel.send(`Now Playing : ***${serverQueue.songs[0].title}***`)
    }

    else if (msg.content.startsWith(`${PREFIX}queue`)) {
        if (!serverQueue) return msg.channel.send(`There is nothing playing :P`);
        return msg.channel.send(`
♫***Song Queue***♫
${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}
        
***Now playing*** ${serverQueue.songs[0].title}
    `);
    }
    else if (msg.content.startsWith(`${PREFIX}pause`)) {
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return msg.channel.send("Paused!");
        }
        return msg.channel.send(`There is nothing playing :P`);

    }
    else if (msg.content.startsWith(`${PREFIX}resume`)) {
        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return msg.channel.send("Resumed!");
        }
        return msg.channel.send(`There is nothing playing :P`);

    }
    else if (msg.content.startsWith(`${PREFIX}help`)) {
        fs.readFileSync("help.txt", 'utf8');
        var help2 = fs.readFileSync("help.txt", 'utf8');
        msg.author.send(help2);
    }


    else if (msg.content.startsWith(`${PREFIX}d4`)) {
        Math.floor((Math.random() * 20) + 1);
    }
    else if (msg.content.startsWith(`${PREFIX}d6`)) {
        Math.floor((Math.random() * 20) + 1);
    }
    else if (msg.content.startsWith(`${PREFIX}d8`)) {
        Math.floor((Math.random() * 20) + 1);
    }
    else if (msg.content.startsWith(`${PREFIX}d10`)) {
        Math.floor((Math.random() * 20) + 1);
    }
    else if (msg.content.startsWith(`${PREFIX}d12`)) {
        Math.floor((Math.random() * 20) + 1);
    }
    else if (msg.content.startsWith(`${PREFIX}d20`)) {
        Math.floor((Math.random() * 20) + 1);
    }



    else if (msg.content.startsWith(`${PREFIX}nc`)) {
        createCharacter(msg.channel, msg);
    }
    return undefined;
});

client.on('message', message => {
    if (message.author.bot) return undefined;
    if (!message.content.startsWith(PREFIX)) return undefined;
    if (message.content.startsWith(`${PREFIX}reset`)) {
        resetBot(message.channel);
    }
    else if (message.content.startsWith(`${PREFIX}shutdown`)) {
        shutDown(message.channel);
    }
});

async function createCharacter(channel, msg) {
    // try {









        // var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
        //     maxMatches: 1,
        //     time: 10000,
        //     errors: ['time']
        // });
            


        // var name = "never";
        // msg.channel.send("What is the name of your Character?");

        msg.channel.send("What is your character's class?");
         var nameOut = await msg.channel.awaitMessages(response => !response.content.includes('^'),
             {
             maxMatches: 1,
             time: 3000,
             errors: ['time']});
         name = nameOut.content;

         console.log(name);
         //const response = await msg.channel.awaitMessages(msg2 => msg2.content.includes(/[a-zA-Z]/), { time: 3000, maxMatches: 1 });


        // msg.channel.send(msg.content)



        //var name = await msg.channel.awaitMessages();
       // console.log(name);





            // msg.channel.send("What is your character's class?");
            // var cclass = await msg.channel.awaitMessages();
            // msg.channel.send("What is your character's level?");
            // var level = await msg.channel.awaitMessages();
            // msg.channel.send("What is your character's story/description? (Include if it's a joke character)");
            // var story = await msg.channel.awaitMessages();
            // msg.channel.send("What is your character's alignment?");
            // var alignment = await msg.channel.awaitMessages();
            // msg.channel.send("Lastly is it homebrew?(Y/N)");
            // var homebrew = await msg.channel.awaitMessages();
        // } catch (error) {
        //     console.error(error);
        //     console.log("failure");
        // }



        // msg.channel.send(`So the name of your character is : ${name}
        // Who is a level ${level} ${cclass}
        // Their alignment is ${alignment}`)
    }

function resetBot(channel) {
        channel.send('Resetting....')
            .then(msg => client.destroy())
            .then(() => client.login(TOKEN));
    }
    function shutDown(channel) {
        channel.send('Shutting Down....')
            .then(msg => client.destroy())
    }

    async function handleVideo(video, msg, voiceChannel, playlist = false) {
        const serverQueue = queue.get(msg.guild.id);
        console.log(video);
        const song = {
            id: video.id,
            title: Util.escapeMarkdown(video.title),
            url: `https://www.youtube.com/watch?v=${video.id}`
        };
        if (!serverQueue) {
            const queueConstruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
            queue.set(msg.guild.id, queueConstruct);

            queueConstruct.songs.push(song);

            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                play(msg.guild, queueConstruct.songs[0]);
            }
            catch (error) {
                console.error(`Cant join the voice channel : ${error}`);
                queue.delete(msg.guild.id);
                return msg.channel.send(`Cant join the voice channel : ${error}`);
            }

        } else {
            serverQueue.songs.push(song);
            console.log(serverQueue.songs);

            if (playlist) return undefined;
            else return msg.channel.send(`**${song.title} has been queued up!**`);

        }
        return undefined;
    }

    function play(guild, song) {
        const serverQueue = queue.get(guild.id);

        if (!song) {
            serverQueue.voiceChannel.leave();
            queue.delete(guild.id);
            return;
        }
        console.log(serverQueue.songs);


        const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
            .on('end', reason => {
                if (reason === 'Stream is not generating quick enough.') console.log('Song ended');
                else console.log(reason);
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            })
            .on('error', error => console.error(error));
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

        serverQueue.textChannel.send(`Now Playing : ***${song.title}***`);
    }

    client.login(TOKEN);