import {
  GuildMember,
  Message,
  MessageEmbed,
  PermissionOverwriteManager,
} from "discord.js";

export async function surpassedRecordMessage(
  message: Message<boolean>,
  user: GuildMember,
  record: number
) {
  await message.channel.send({
    embeds: [
      new MessageEmbed()
        .setTitle("New record! `" + record + "`")
        .setAuthor({
          name: message.author.username,
        })
        .setDescription(`Congratulations, you surpassed the record!`)
        .addField(
          "However",
          "because you failed to continue the count, you may no longer participate."
        )
        .setColor(user.displayHexColor),
    ],
  });
}

export async function excludeUser(
  permissions: PermissionOverwriteManager,
  user: GuildMember
) {
  await permissions.create(
    user,
    {
      // VIEW_CHANNEL: false, // potentially make it a configurable setting
      SEND_MESSAGES: false,
    },
    {
      reason: "Failed to continue the count",
      type: 1,
    }
  );
}

export async function sendExclusionMessage(
  message: Message<boolean>,
  user: GuildMember,
  counter: Number
) {
  await message.channel.send({
    embeds: [
      new MessageEmbed()
        .setAuthor({
          name: message.author.username,
        })
        .setTitle("`OUT` at " + counter)
        .setDescription(
          "This user failed to continue the count and is now excluded from the channel."
        )
        .addField("The counter", "has been set back to `1`.")
        .setColor(user.displayHexColor),
    ],
  });
}
