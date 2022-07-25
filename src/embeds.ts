import { MessageEmbed } from "discord.js";
import {
    CommandContext,
    SlasherClient
} from "discord.js-slasher";

export function showHelpEmbed(context: CommandContext) {
    context.reply(
        {
            embeds: [
                new MessageEmbed()
                    .setTitle('Help with roles!')
                    .setDescription('A listing of commands that you can use')
                    .setColor('#FFBCB5')
                    .addFields(
                        { name: '`/help`', value: 'Shows this message' },
                        {
                            name: '`/start`',
                            value: 'Creates a new channel and sets the counter to 1',
                        },
                        { name: '`/stop`', value: 'Deletes the channel' },
                        { 
                            name: '`/stats`',
                            value: 'Shows how many users have been excluded since channel creation'
                        }
                    ),
            ],
        },
        true
    );
}

