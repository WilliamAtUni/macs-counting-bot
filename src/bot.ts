import { Console, debug } from "console";
import { Client, Collector, DataResolver, Emoji, Guild, GuildInviteManager, HexColorString, Intents, Message, MessageActionRow, MessageButton, MessageEmbed, MessageManager, MessagePayload, MessageSelectMenu, Modal, ModalActionRowComponent, RoleManager, Snowflake, TextInputComponent, User } from "discord.js";
import { CommandContext, SlasherClient } from "discord.js-slasher";
// const dotenv = require('dotenv');
import * as dotenv from 'dotenv';
dotenv.config();
// import * as embeds from "./embeds";
// import { pool, clientMigrationConfig, toDB } from "./db";
import fs from "fs";
import path from 'path';
import pg from 'node-postgres';
import { migrate } from 'postgres-migrations';
import { Channel, channel } from "diagnostics_channel";
// import * as structures from "./dbstructures";

// const dbpool = pool;

enum Commands {
    Help = "help",
    Start = "start"
}

let countingChannelId = "";
let lastMessageAuthorId = "";
let record = 1;
let counter = 1;

const client = new SlasherClient({
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS, 
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_TYPING
    ],
    token: process.env.TOKEN 
    // useAuth: true
});


client.once("ready", async (ready) => {
    console.log(`${client.user.tag} is ready`);
    
});

client.on("command", async (context) => {
    // create a new thread
    // first, get the channel
    let Channel = context.channel;

    if (context.name === "help") {
        context.reply({embeds: [
            new MessageEmbed()
    .setTitle("Help with roles!")
    .setDescription("A listing of commands that you can use")
    .setColor('#FFBCB5')
    .addFields(
        { name: "`/help`", value: "Shows this message" },
        { name: "`/start`", value: "Creates a new channel and sets the counter to 1"},
    )
        ]})
    }

    else if (context.name === "start") {
        { // threads to be implemented soon
            /*
        if (Channel.type !== "GUILD_TEXT") {
            context.reply({ embeds: [
                new MessageEmbed()
                .setTitle("You can only create a counting thread in a text channel.")
            ]}, true);
            return;
        }
    
        let threadManager = Channel.threads;
    
        threadManager.create({
            name: "Counting",
            reason: `${context.user.username} used the start command to initate a counting thread`,
            autoArchiveDuration: 60
        })

        */
        }

        // if a channel already exists, delete it
        if (countingChannelId !== "") {
            await context.server.guild.channels.delete(countingChannelId);
        }

        // create a new channel
        // first, get the channel list
        let ChannelManager = context.server.guild.channels;

        let countingChannel = await ChannelManager.create("Counting", {
            rateLimitPerUser: 5,
            reason: `${context.user.username} used the start command to create a counting channel`
        });

        countingChannelId = countingChannel.id;
        console.log("Counting channel ID: "+countingChannelId);

        await countingChannel.send(`
        :sparkles: Welcome to the **Counting Channel** :sparkles:\n
        You **must** continue the count from the last mesasge.\n
        If you do not continue the count for any reason, you will be removed from the channel.\n
        Happy counting! :blush:
        `)

        await context.reply({ embeds: [
            new MessageEmbed()
            .setTitle("Counting Channel created.")
        ]}, true);
    }

    else if (context.name === "stop") {
        // check if the user is not an exec
        // let user = await context.server.guild.members.fetch(context.user.id);
        // let roles = context.server.guild.roles;
        // let hasExecRole = roles.cache.some(role => role.name === "Executive");
        // if (!hasExecRole) {
        //     return;
        // }

        // if there is no channel, do not do anything
        if (countingChannelId === "") {
            context.reply({embeds: [
                new MessageEmbed()
                .setTitle("Unable to delete channel. No counting channel exists.")
            ]}, true);
            return;
        }

        // delete the channel
        let ChannelManager = context.server.guild.channels;
        let countingChannel = ChannelManager.resolve(countingChannelId);
        await countingChannel.delete();

        context.reply({ embeds: [
            new MessageEmbed()
            .setTitle("Counting channel has been deleted.")
        ]}, true)

        countingChannelId = "";
    }

    else if (context.name === "clean") {
        
        console.log("Cleaning channels...");
        // debugger;
        // clean the counting channels
        let ChannelManager = context.server.guild.channels;
        let countingChannels = ChannelManager.cache.filter(channel => channel.name === "counting");

        for (let [countingChannelID, channel] of countingChannels) {
            console.log("Deleting channel: "+countingChannelID);
            await ChannelManager.delete(countingChannelID).catch(
                (err) => {console.log(err);
                }
            );
            console.log("Channel deleted.");
        }

        console.log("Channels gone!");
    }
});

client.on("messageCreate", async (message) => {
    console.log("Current number: "+counter);
    
    // scan the message
    // initially, check if it's in the right channel
    if (message.channel.id !== countingChannelId || message.channel.type !== "GUILD_TEXT") return;

    // check if the last message is from the same user
    // if it is, ignore it
    if (message.author.id === lastMessageAuthorId) {
        console.log("Ignoring message from same user.");
        return;
    }
    else lastMessageAuthorId = message.author.id;

    // check if it's not the bot
    if (message.author.bot) return;

    // check the content
    // if it's not purely a number, stop
    let isNumber:boolean = false;
    let numberRegex = /\d+/;

    // I guess we could start out just by scanning each character of 
    // the message and seeing if it's a number
    for (let pos = 0; pos < message.content.length; pos++) {
        if (!numberRegex.test(message.content[pos])) {
            return; // it's not just a number
        }
    }

    if (message.content !== counter.toString()) {
        // remove the user from the channel
        let members = message.guild.members;
        let user = members.resolve(message.author);
        let channel = message.channel;
        let permissions = channel.permissionOverwrites;
        
        // debugger;
        
        await message.react("❌");

        if (counter > record) {
            counter--;
            record = counter;
            console.log("New record: "+record);
            // send a message congratulating the user on surpassing the record
            await message.channel.send({
                embeds: [
                    new MessageEmbed()
                    .setTitle("New record! `"+record+"`")
                    .setAuthor({
                        name: message.author.username
                    })
                    .setDescription(`Congratulations, you surpassed the record!`)
                    .addField("However", "because you failed to continue the count, you will be removed from the channel.")
                    .setColor(user.displayHexColor)
                ]
            })
        }
        
        await message.channel.send({embeds: [
            new MessageEmbed()
            .setAuthor({
                name: message.author.username,
            })
            .setTitle("`OUT`")
            .setDescription("This user failed to continue the count and is now banned from the channel.")
            .addField("The counter...", "has been set back to `1`.")
            .setColor(user.displayHexColor)
        ]})
        
        await permissions.create(user, {
            VIEW_CHANNEL: false,
            SEND_MESSAGES: false,
        }, {
            reason: "Failed to continue the count",
            type: 1
        });

        counter = 1;
        console.log("The counter has been reset to "+counter);

        return;
    }

    counter++;
    console.log("Number is now "+counter);
    
})

client.login(process.env.TOKEN);