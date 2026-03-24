require('dotenv').config();
const { Client, Intents, MessageEmbed } = require('discord.js');

// Token
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('TOKEN not set! Add DISCORD_TOKEN to .env');
  process.exit(1);
}

// Rainbow roles (20 prestige roles)
const rainbowRoleIds = [
  '1447609483932205280', // Prestige 1: Frozen Age
  '1447611391979819209', // Prestige 2: Wingful
  '1447611757156630668', // Prestige 3: Wiking
  '1449429902544605255', // Prestige 4: Valhalla
  '1449429946014630072', // Prestige 5: Ragnarok
  '1449429975215247400', // Prestige 6: Frostborn
  '1449430012787687554', // Prestige 7: Cryo Lord
  '1449430087249170582', // Prestige 8: Frostwing
  '1449430129007657120', // Prestige 9: Ice Reign
  '1449430190278053990', // Prestige 10: The snow has fallen
  '1467244766826725478', // Prestige 11: Specialist
  '1467245175645409325', // Prestige 12: Nightfall
  '1467245620594081875', // Prestige 13: Celestial
  '1467246031967354981', // Prestige 14: Influencer
  '1467246602761797852', // Prestige 15: Initiate
  '1476277302370369636', // Prestige 16: Eclipse
  '1476277759893442611', // Prestige 17: Abyss
  '1476278183341985993', // Prestige 18: Voidwalker
  '1476278563283140701', // Prestige 19: Eternal Night
  '1476279015689162934'  // Prestige 20: Godfall
];

// Role IDs for ranks
const rankRoles = {
  1: '1485670782481727508',
  2: '1485670811619561583',
  3: '1485670833123885269',
  4: '1485670859762040983',
  5: '1485670891290366155',
  6: '1485670913465651210',
  7: '1485670933715882174',
  8: '1485670953139703849',
  9: '1485670975079977000',
  10: '1485670993765732403'
};

// Role IDs for prestige
const prestigeRoles = {
  1: '1447609483932205280',
  2: '1447611391979819209',
  3: '1447611757156630668',
  4: '1449429902544605255',
  5: '1449429946014630072',
  6: '1449429975215247400',
  7: '1449430012787687554',
  8: '1449430087249170582',
  9: '1449430129007657120',
  10: '1449430190278053990',
  11: '1467244766826725478',
  12: '1467245175645409325',
  13: '1467245620594081875',
  14: '1467246031967354981',
  15: '1467246602761797852',
  16: '1476277302370369636',
  17: '1476277759893442611',
  18: '1476278183341985993',
  19: '1476278563283140701',
  20: '1476279015689162934'
};

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS
  ]
});

let activeIntervals = new Map();

// Whitelist setup
const OWNER_ID = '722514081856356400';
let whitelist = new Set();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log('Whitelist system ready!');
  console.log(`Owner ID: ${OWNER_ID}`);
  console.log('Rainbow cycle interval: 2 seconds');
});

// Черное оформление для успешной команды
async function sendSuccessNotification(channel, commandName, targetUser = null, extraInfo = null) {
  const embed = new MessageEmbed()
    .setColor(0x000000)
    .setDescription(`**${commandName}**\n\`\`\`\n✓ Command executed successfully\`\`\``)
    .setFooter({ text: '• command executed •' })
    .setTimestamp();
  
  if (targetUser) {
    embed.addField('target', `${targetUser.user ? targetUser.user.tag : targetUser.tag || targetUser}`, true);
  }
  
  if (extraInfo) {
    embed.addField('info', extraInfo, true);
  }
  
  const message = await channel.send({ embeds: [embed] });
  setTimeout(() => message.delete().catch(() => {}), 3000);
}

// Черное оформление для ошибки
async function sendErrorNotification(channel, errorMessage) {
  const embed = new MessageEmbed()
    .setColor(0x000000)
    .setDescription(`**error**\n\`\`\`\n✗ ${errorMessage}\`\`\``)
    .setFooter({ text: '• command failed •' })
    .setTimestamp();
  
  const message = await channel.send({ embeds: [embed] });
  setTimeout(() => message.delete().catch(() => {}), 4000);
}

// Черное оформление для nuke
async function sendNukeNotification(channel) {
  const embed = new MessageEmbed()
    .setColor(0x000000)
    .setDescription(`**nuke**\n\`\`\`\n✓ Channel has been nuked and recreated\`\`\``)
    .setFooter({ text: '• channel destroyed and reborn •' })
    .setTimestamp();
  
  await channel.send({ embeds: [embed] });
}

// Функция для команды ship
function getShipImage(percentage) {
  if (percentage >= 90) {
    return 'https://media.tenor.com/5r7rK5r7rK0AAAAi/anime-love.gif';
  } else if (percentage >= 70) {
    return 'https://media.tenor.com/4r5tY8e9u0oAAAAi/anime-couple.gif';
  } else if (percentage >= 50) {
    return 'https://media.tenor.com/2s3fG7h5j9kAAAAi/anime-hug.gif';
  } else if (percentage >= 30) {
    return 'https://media.tenor.com/1q2w3e4r5t6yAAAAi/anime-shy.gif';
  } else {
    return 'https://media.tenor.com/7u8i9o0p1a2sAAAAi/anime-cry.gif';
  }
}

function getShipMessage(percentage, user1, user2) {
  if (percentage >= 90) {
    return `💕 **${user1}** and **${user2}** are a PERFECT match! ${percentage}% Soulmates! 💕\nThey were meant to be together! 👨‍❤️‍👨`;
  } else if (percentage >= 70) {
    return `💖 **${user1}** and **${user2}** are amazing together! ${percentage}% Great chemistry! 💖\nThis ship is sailing strong! ⛵`;
  } else if (percentage >= 50) {
    return `💛 **${user1}** and **${user2}** have potential! ${percentage}% Could work out! 💛\nGive it some time and see where it goes! 🌱`;
  } else if (percentage >= 30) {
    return `💔 **${user1}** and **${user2}** might need more time... ${percentage}% Just friends? 💔\nSometimes friendship is better than love! 🤝`;
  } else {
    return `💀 **${user1}** and **${user2}** are NOT compatible! ${percentage}% A disaster waiting to happen! 💀\nBetter to stay as acquaintances! 🚫`;
  }
}

// Проверка прав доступа
function hasPermission(userId) {
  return userId === OWNER_ID || whitelist.has(userId);
}

// Rainbow cycle function
async function applyRainbowCycle(target) {
  const current = target.roles.cache;
  const toRemove = rainbowRoleIds.filter(id => current.has(id));
  if (toRemove.length > 0) {
    await target.roles.remove(toRemove).catch(() => {});
  }
  
  let idx = 0;
  let lastRoleId = null;
  
  const interval = setInterval(async () => {
    try {
      const idToAdd = rainbowRoleIds[idx % rainbowRoleIds.length];
      await target.roles.add(idToAdd);
      if (lastRoleId && lastRoleId !== idToAdd) {
        await target.roles.remove(lastRoleId).catch(() => {});
      }
      lastRoleId = idToAdd;
      idx++;
    } catch (err) {
      console.error('Rainbow switch error:', err);
      clearInterval(interval);
    }
  }, 2000);
  
  return interval;
}

// Main commands
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(':')) return;
  
  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  // :whitelist add @user
  if (command === 'whitelist') {
    if (message.author.id !== OWNER_ID) {
      await sendErrorNotification(message.channel, 'only the bot owner can use this command');
      return;
    }
    
    const subCommand = args.shift()?.toLowerCase();
    const target = message.mentions.members.first();
    
    if (!target) {
      await sendErrorNotification(message.channel, 'please mention a user\nusage: :whitelist add @user\n:whitelist remove @user\n:whitelist list');
      return;
    }
    
    if (subCommand === 'add') {
      whitelist.add(target.id);
      await sendSuccessNotification(message.channel, 'whitelist add', target);
    } else if (subCommand === 'remove') {
      whitelist.delete(target.id);
      await sendSuccessNotification(message.channel, 'whitelist remove', target);
    } else {
      await sendErrorNotification(message.channel, 'invalid subcommand\nuse: add, remove, or list');
    }
    return;
  }
  
  // :whitelist list
  if (command === 'whitelist' && args[0] === 'list') {
    if (message.author.id !== OWNER_ID) {
      await sendErrorNotification(message.channel, 'only the bot owner can use this command');
      return;
    }
    
    if (whitelist.size === 0) {
      await sendErrorNotification(message.channel, 'whitelist is empty');
      return;
    }
    
    let list = '';
    for (const userId of whitelist) {
      try {
        const user = await client.users.fetch(userId);
        list += `• ${user.tag} (\`${userId}\`)\n`;
      } catch (err) {
        list += `• unknown user (\`${userId}\`)\n`;
      }
    }
    
    const embed = new MessageEmbed()
      .setColor(0x000000)
      .setTitle('whitelist')
      .setDescription(`\`\`\`\n${list}\`\`\``)
      .setFooter({ text: `• total: ${whitelist.size} users •` })
      .setTimestamp();
    
    await message.channel.send({ embeds: [embed] });
    return;
  }
  
  // :ship @user1 @user2
  if (command === 'ship') {
    if (!hasPermission(message.author.id)) {
      await message.channel.send('fuck off');
      return;
    }
    
    const user1 = message.mentions.members.first();
    const user2 = message.mentions.members.array()[1];
    
    if (!user1 || !user2) {
      await sendErrorNotification(message.channel, 'please mention two users\nusage: :ship @user1 @user2');
      return;
    }
    
    // Генерируем случайный процент совместимости
    const percentage = Math.floor(Math.random() * 101);
    
    // Создаем полоску прогресса
    const barLength = 20;
    const filledLength = Math.round((percentage / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    const shipEmbed = new MessageEmbed()
      .setColor(0x000000)
      .setTitle('💕 SHIP COMPATIBILITY 💕')
      .setDescription(`**${user1.user.username}** ❤️ **${user2.user.username}**`)
      .addField('compatibility', `${percentage}% [${bar}]`, false)
      .addField('result', getShipMessage(percentage, user1.user.username, user2.user.username), false)
      .setImage(getShipImage(percentage))
      .setFooter({ text: '• powered by love •' })
      .setTimestamp();
    
    await message.channel.send({ embeds: [shipEmbed] });
    return;
  }
  
  // Проверка прав для всех остальных команд
  if (!hasPermission(message.author.id)) {
    await message.channel.send('fuck off');
    return;
  }
  
  // :help
  if (command === 'help') {
    const helpEmbed = new MessageEmbed()
      .setColor(0x000000)
      .setTitle('command list')
      .setDescription('\`\`\`\n:rainbow [@user]           - starts rainbow role cycle\n:rainbow_stop [@user]     - stops rainbow cycle\n:clear_rainbow [@user]    - removes rainbow roles\n:purge <amount>           - deletes messages (1-100)\n:nuke                     - recreates current channel\n:ship @user1 @user2       - checks compatibility between users\n:whitelist add @user      - adds user to whitelist (owner)\n:whitelist remove @user   - removes user from whitelist (owner)\n:whitelist list           - shows whitelist (owner)\n:help                     - shows this message\`\`\`')
      .setFooter({ text: '• command prefix: : •' })
      .setTimestamp();
    
    await sendSuccessNotification(message.channel, 'help');
    await message.channel.send({ embeds: [helpEmbed] });
    return;
  }
  
  // :rainbow
  if (command === 'rainbow') {
    const target = message.mentions.members.first() || message.member;
    if (!target) return;
    
    const missing = rainbowRoleIds.filter(id => !message.guild.roles.cache.has(id));
    if (missing.length > 0) {
      await sendErrorNotification(message.channel, 'some rainbow roles are missing on this server');
      return;
    }
    
    if (activeIntervals.has(target.id)) {
      clearInterval(activeIntervals.get(target.id));
      activeIntervals.delete(target.id);
    }
    
    const interval = await applyRainbowCycle(target);
    if (interval) activeIntervals.set(target.id, interval);
    
    await sendSuccessNotification(message.channel, 'rainbow', target);
    return;
  }
  
  // :rainbow_stop
  if (command === 'rainbow_stop') {
    const target = message.mentions.members.first() || message.member;
    if (!target) return;
    
    if (target && activeIntervals.has(target.id)) {
      clearInterval(activeIntervals.get(target.id));
      activeIntervals.delete(target.id);
      await sendSuccessNotification(message.channel, 'rainbow_stop', target);
    } else {
      await sendErrorNotification(message.channel, `${target.user.tag} does not have an active rainbow cycle`);
    }
    return;
  }
  
  // :clear_rainbow
  if (command === 'clear_rainbow') {
    const target = message.mentions.members.first() || message.member;
    if (!target) return;
    
    try {
      const toRemove = rainbowRoleIds.filter(id => target.roles.cache.has(id));
      if (toRemove.length > 0) {
        await target.roles.remove(toRemove);
        await sendSuccessNotification(message.channel, 'clear_rainbow', target);
      } else {
        await sendErrorNotification(message.channel, `${target.user.tag} has no rainbow roles`);
      }
    } catch (err) {
      console.error(err);
      await sendErrorNotification(message.channel, 'an error occurred while removing roles');
    }
    return;
  }
  
  // :purge
  if (command === 'purge') {
    const amount = parseInt(args[0], 10);
    if (isNaN(amount) || amount <= 0 || amount > 100) {
      await sendErrorNotification(message.channel, 'please provide a valid amount (1-100)');
      return;
    }
    
    try {
      const fetched = await message.channel.messages.fetch({ limit: amount });
      await message.channel.bulkDelete(fetched, true);
      await sendSuccessNotification(message.channel, `purge ${amount}`, null, `deleted ${amount} messages`);
    } catch (err) {
      console.error(err);
      await sendErrorNotification(message.channel, 'failed to delete messages (messages may be older than 14 days)');
    }
    return;
  }
  
  // :nuke
  if (command === 'nuke') {
    if (!message.member.permissions.has('MANAGE_CHANNELS')) {
      await sendErrorNotification(message.channel, 'you need manage_channels permission');
      return;
    }
    
    try {
      const channel = message.channel;
      const chanInfo = {
        name: channel.name,
        type: channel.type,
        nsfw: channel.nsfw,
        topic: channel.topic,
        parent: channel.parent ? channel.parent.id : null,
        position: channel.rawPosition
      };
      
      await channel.delete('Nuke command executed');
      
      const guild = channel.guild;
      const newChannel = await guild.channels.create(chanInfo.name, {
        type: chanInfo.type,
        nsfw: chanInfo.nsfw,
        topic: chanInfo.topic,
        parent: chanInfo.parent,
        position: chanInfo.position
      });
      
      await sendNukeNotification(newChannel);
    } catch (err) {
      console.error(err);
      await sendErrorNotification(message.channel, 'failed to nuke channel');
    }
    return;
  }
});

client.login(TOKEN);
