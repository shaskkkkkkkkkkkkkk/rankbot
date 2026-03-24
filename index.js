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

// Role IDs for ranks (оставлены но не используются)
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
const OWNER_ID = 'ВАШ_ID_АККАУНТА'; // Замените на ваш Discord ID!
let whitelist = new Set(); // Хранит ID пользователей, которым разрешено использовать команды

// Загрузка whitelist из памяти (можно сохранять в файл при необходимости)

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log('Whitelist system ready!');
  console.log(`Owner ID: ${OWNER_ID}`);
  console.log('Rainbow cycle interval: 2 seconds');
});

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
  
  // :whitelist add @user - добавить пользователя в whitelist (только владелец)
  if (command === 'whitelist') {
    if (message.author.id !== OWNER_ID) {
      await message.channel.send('❌ Only the bot owner can use this command!');
      return;
    }
    
    const subCommand = args.shift()?.toLowerCase();
    const target = message.mentions.members.first();
    
    if (!target) {
      await message.channel.send('❌ Please mention a user!\nUsage: :whitelist add @user\n:whitelist remove @user\n:whitelist list');
      return;
    }
    
    if (subCommand === 'add') {
      whitelist.add(target.id);
      await message.channel.send(`✅ ${target.user.tag} has been added to the whitelist!`);
    } else if (subCommand === 'remove') {
      whitelist.delete(target.id);
      await message.channel.send(`❌ ${target.user.tag} has been removed from the whitelist!`);
    } else {
      await message.channel.send('❌ Invalid subcommand! Use: add, remove, or list');
    }
    return;
  }
  
  // :whitelist list - показать список whitelist (только владелец)
  if (command === 'whitelist' && args[0] === 'list') {
    if (message.author.id !== OWNER_ID) {
      await message.channel.send('❌ Only the bot owner can use this command!');
      return;
    }
    
    if (whitelist.size === 0) {
      await message.channel.send('📋 Whitelist is empty.');
      return;
    }
    
    let list = '📋 **Whitelisted Users:**\n';
    for (const userId of whitelist) {
      try {
        const user = await client.users.fetch(userId);
        list += `• ${user.tag} (\`${userId}\`)\n`;
      } catch (err) {
        list += `• Unknown user (\`${userId}\`)\n`;
      }
    }
    await message.channel.send(list);
    return;
  }
  
  // Проверка прав для всех остальных команд
  if (!hasPermission(message.author.id)) {
    await message.channel.send('fuck off');
    return;
  }
  
  // :help
  if (command === 'help') {
    const helpEmbed = {
      color: 0x0099ff,
      title: '📋 Command List',
      description: 'Here are all available bot commands:',
      fields: [
        {
          name: ':rainbow [@user]',
          value: 'Starts the rainbow role cycle for the specified user (changes every 2 seconds)',
          inline: false
        },
        {
          name: ':rainbow_stop [@user]',
          value: 'Stops the rainbow cycle for the specified user',
          inline: false
        },
        {
          name: ':clear_rainbow [@user]',
          value: 'Removes all rainbow roles from the specified user',
          inline: false
        },
        {
          name: ':purge <amount>',
          value: 'Deletes the specified number of messages (max 100)',
          inline: false
        },
        {
          name: ':nuke',
          value: 'Recreates the current channel (requires MANAGE_CHANNELS permission)',
          inline: false
        },
        {
          name: ':whitelist add @user',
          value: 'Adds a user to whitelist (Owner only)',
          inline: false
        },
        {
          name: ':whitelist remove @user',
          value: 'Removes a user from whitelist (Owner only)',
          inline: false
        },
        {
          name: ':whitelist list',
          value: 'Shows all whitelisted users (Owner only)',
          inline: false
        },
        {
          name: ':help',
          value: 'Shows this message with the list of all commands',
          inline: false
        }
      ],
      footer: {
        text: 'Command prefix: : | Only whitelisted users can use commands'
      }
    };
    
    await message.channel.send({ embeds: [helpEmbed] });
    return;
  }
  
  // :rainbow
  if (command === 'rainbow') {
    const target = message.mentions.members.first() || message.member;
    if (!target) return;
    
    const missing = rainbowRoleIds.filter(id => !message.guild.roles.cache.has(id));
    if (missing.length > 0) return;
    
    if (activeIntervals.has(target.id)) {
      clearInterval(activeIntervals.get(target.id));
      activeIntervals.delete(target.id);
    }
    
    const interval = await applyRainbowCycle(target);
    if (interval) activeIntervals.set(target.id, interval);
    return;
  }
  
  // :rainbow_stop
  if (command === 'rainbow_stop') {
    const target = message.mentions.members.first() || message.member;
    if (target && activeIntervals.has(target.id)) {
      clearInterval(activeIntervals.get(target.id));
      activeIntervals.delete(target.id);
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
      }
    } catch (err) {
      console.error(err);
    }
    return;
  }
  
  // :purge
  if (command === 'purge') {
    const amount = parseInt(args[0], 10);
    if (isNaN(amount) || amount <= 0 || amount > 100) return;
    
    try {
      const fetched = await message.channel.messages.fetch({ limit: amount });
      await message.channel.bulkDelete(fetched, true);
    } catch (err) {
      console.error(err);
    }
    return;
  }
  
  // :nuke
  if (command === 'nuke') {
    if (!message.member.permissions.has('MANAGE_CHANNELS')) return;
    
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
      
      await newChannel.send('Channel nuked and recreated');
    } catch (err) {
      console.error(err);
    }
    return;
  }
});

client.login(TOKEN);
