import {
  Client,
  Collector,
  DataResolver,
  Emoji,
  Guild,
  GuildInviteManager,
  GuildMember,
  HexColorString,
  Intents,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageManager,
  MessagePayload,
  MessageSelectMenu,
  Modal,
  ModalActionRowComponent,
  RoleManager,
  Snowflake,
  TextInputComponent,
  User,
} from 'discord.js';
import { CommandContext, SlasherClient } from 'discord.js-slasher';
// const dotenv = require('dotenv');
import { excludeUser, sendExclusionMessage, surpassedRecordMessage } from './exclude';
import { showHelpEmbed } from './embeds';
import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';

enum Commands {
  Help = 'help',
  Start = 'start',
}

let countingChannelId = '';
let lastMessageAuthorId = '';
let record = 1;
let counter = 1;
let usersOut = 0;
let zeroWidthCharacters = [
    '\u200B',
    '\u200C',
    '\u200D',
    '\u200E',
    '\u202A',
    '\u202C',
    '\u202D',
    '\u2062',
    '\u2063',
    '\uFEFF',
]

let data = {
  countingChannelId: countingChannelId,
  lastMessageAuthorId: lastMessageAuthorId,
  record: record,
  counter: counter,
  usersOut: usersOut
};

const client = new SlasherClient({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
  ],
  token: process.env.TOKEN,
});

client.once('ready', async (ready) => {
  console.log(`${client.user.tag} is ready`);
  data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

  countingChannelId = data.countingChannelId;
  lastMessageAuthorId = data.lastMessageAuthorId;
  record = data.record;
  counter = data.counter;

  console.log(data);
});

client.on('command', async (context) => {
  // create a new thread
  // first, get the channel
  let Channel = context.channel;

  if (context.name === 'help') {
    showHelpEmbed(context);
  } else if (context.name === 'start') {

    // if a channel already exists, delete it
    if (countingChannelId !== '') {
      await context.server.guild.channels.delete(countingChannelId);
    }

    // create a new channel
    // first, get the channel list
    let ChannelManager = context.server.guild.channels;

    let countingChannel = await ChannelManager.create('Counting', {
      rateLimitPerUser: 2,
      reason: `${context.user.username} used the start command to create a counting channel`,
    });

    countingChannelId = countingChannel.id;
    console.log('Counting channel ID: ' + countingChannelId);

    await countingChannel.send(`
        :sparkles: Welcome to the **Counting Channel** :sparkles:\n
        You **must** continue the count from the last mesasge.\n
        If you do not continue the count for any reason, you shall be excluded from counting.\n
        Happy counting! :blush:
        `);

    // save the channel id to the data file
    data.countingChannelId = countingChannelId;
    fs.writeFileSync('data.json', JSON.stringify(data));

    await context.reply(
      { embeds: [new MessageEmbed().setTitle('Counting Channel created.')] },
      true,
    );
  } else if (context.name === 'stop') {
    // if there is no channel, do not do anything
    if (countingChannelId === '') {
      context.reply(
        {
          embeds: [
            new MessageEmbed().setTitle(
              'Unable to delete channel. No counting channel exists.',
            ),
          ],
        },
        true,
      );
      return;
    }

    // delete the channel
    let ChannelManager = context.server.guild.channels;
    let countingChannel = ChannelManager.resolve(countingChannelId);
    await countingChannel.delete();
    data.usersOut = usersOut = 0;

    context.reply(
      {
        embeds: [
          new MessageEmbed().setTitle('Counting channel has been deleted.'),
        ],
      },
      true,
    );

    // save the channel id to the data file
    countingChannelId = '';
    data.countingChannelId = countingChannelId;
    fs.writeFileSync('data.json', JSON.stringify(data));
  } else if (context.name === 'reset') {
    // will do soon
    return;
    /* 
        // reset the permissions of all the uesrs for the channel
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
                .setTitle("Unable to reset permissions. No counting channel exists.")
            ]}, true);
            return;
        }

        // reset the permissions of all the users for the channel
        let ChannelManager = context.server.guild.channels;
        let countingChannel = ChannelManager.resolve(countingChannelId);
        if (countingChannel.type !== "GUILD_TEXT") {
            // do nothing
            return;
        }
        let members = countingChannel.members;
        // get permission overrides
        let overrides = countingChannel.permissionOverwrites;
        */
  } else if (context.name === 'clean') {
    console.log('Cleaning channels...');
    // debugger;
    // clean the counting channels
    let ChannelManager = context.server.guild.channels;
    let countingChannels = ChannelManager.cache.filter(
      (channel) => channel.name === 'counting',
    );

    if (countingChannels.size === 0) {
      // no counting channels exist, send reply to user
      context.reply(
        {
          embeds: [
            new MessageEmbed()
              .setTitle('No counting channels exist.')
              .setDescription('No channels have been removed.'),
          ],
        },
        true,
      );
      return;
    }

    for (let [countingChannelID] of countingChannels) {
      console.log('Deleting channel: ' + countingChannelID);
      await ChannelManager.delete(countingChannelID);
      console.log('Channel deleted.');
    }

    console.log('Channels gone!\nRemoving data...');
    // remove the data
    countingChannelId = '';
    lastMessageAuthorId = '';
    data.countingChannelId = countingChannelId;
    data.lastMessageAuthorId = lastMessageAuthorId;
    fs.writeFileSync('data.json', JSON.stringify(data));

    // reply to the user
    context.reply(
      {
        embeds: [
          new MessageEmbed().setTitle('Counting channels have been cleaned.'),
        ],
      },
      true,
    );
  } else if (context.name === 'stats') {
    if (
        context.channel.id !== countingChannelId ||
        context.channel.type !== 'GUILD_TEXT'
      )
        return;
    
    let channelCreationDate = context.channel.createdAt;
    await context.reply({
        embeds: [
            new MessageEmbed()
            .setTitle('Counting channel stats')
            .setDescription('Since the channel\'s creation at '+channelCreationDate+':')
            .addFields(
                { name: 'Users out', value: '`'+usersOut+'`'}
            )
        ]
    }, true)
  }
});

client.on('messageCreate', async (message) => {
  // scan the message
  // initially, check if it's in the right channel
  if (
    message.channel.id !== countingChannelId ||
    message.channel.type !== 'GUILD_TEXT'
  )
    return;

  // check if the last message is from the same user
  // if it is, ignore it
  if (message.author.id === lastMessageAuthorId) {
    console.log('Ignoring message from same user.');
    return;
  }

  lastMessageAuthorId = message.author.id;
  data.lastMessageAuthorId = lastMessageAuthorId;

  // write the last message author id to the data file
  console.log('Current number: ' + counter);
  fs.writeFileSync('data.json', JSON.stringify(data));

  // check if it's not the bot
  if (message.author.bot || message.author.id === client.user.id) return;

  // check the content
  // if it's not purely a number, stop
  let isNumber: boolean = false;
  let numberRegex = /\d+/;

  // I guess we could start out just by scanning each character of
  // the message and seeing if it's a number
  // scan messages for zero-width characters and ignore them
  for (let pos = 0; pos < message.content.length; pos++) {
    for (let zeroWidthChar in zeroWidthCharacters) {
        if (message.content[pos] === zeroWidthChar) {
            console.log('Zero-width character detected. Ignoring message.');
            return;
        }
    }

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

    await message.react('❌');

    if (counter > record) {
      counter--;
      record = counter;
      console.log('New record: ' + record);
      // send a message congratulating the user on surpassing the record
      await surpassedRecordMessage(message, user, record);
    }

    await sendExclusionMessage(message, user, counter);

    await excludeUser(permissions, user);

    counter = 1;
    console.log('The counter has been reset to ' + counter);
    data.record = record;
    data.counter = counter;
    data.usersOut++;
    usersOut++;
    fs.writeFileSync('data.json', JSON.stringify(data));

    return;
  }

  counter++;
  console.log('Number incremented to ' + counter);
  data.counter = counter;
  fs.writeFileSync('data.json', JSON.stringify(data));
});

// TODO: delete the 'process.env.TOKEN' part once Slasher bug is fixed
// see: https://github.com/Romejanic/slasher/issues/11
// that will stop the token related warnings being printed
client.login(process.env.TOKEN);
