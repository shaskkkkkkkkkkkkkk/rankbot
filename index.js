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
  '1447609483932205280',
  '1447611391979819209',
  '1447611757156630668',
  '1449429902544605255',
  '1449429946014630072',
  '1449429975215247400',
  '1449430012787687554',
  '1449430087249170582',
  '1449430129007657120',
  '1449430190278053990',
  '1467244766826725478',
  '1467245175645409325',
  '1467245620594081875',
  '1467246031967354981',
  '1467246602761797852',
  '1476277302370369636',
  '1476277759893442611',
  '1476278183341985993',
  '1476278563283140701',
  '1476279015689162934'
];

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
  
  const msg = await channel.send({ embeds: [embed] });
  setTimeout(() => msg.delete().catch(() => {}), 3000);
}

// Черное оформление для ошибки
async function sendErrorNotification(channel, errorMessage) {
  const embed = new MessageEmbed()
    .setColor(0x000000)
    .setDescription(`**error**\n\`\`\`\n✗ ${errorMessage}\`\`\``)
    .setFooter({ text: '• command failed •' })
    .setTimestamp();
  
  const msg = await channel.send({ embeds: [embed] });
  setTimeout(() => msg.delete().catch(() => {}), 4000);
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

// Функция для погоды (симуляция)
function getRandomWeather(city) {
  const conditions = ['☀️ Sunny', '🌤️ Partly Cloudy', '☁️ Cloudy', '🌧️ Rainy', '⛈️ Stormy', '❄️ Snowy', '🌫️ Foggy'];
  const temps = [-10, -5, 0, 5, 10, 15, 20, 25, 30, 35];
  const humidity = [30, 40, 50, 60, 70, 80, 90];
  const wind = [0, 5, 10, 15, 20, 25];
  
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const temp = temps[Math.floor(Math.random() * temps.length)];
  const hum = humidity[Math.floor(Math.random() * humidity.length)];
  const windSpeed = wind[Math.floor(Math.random() * wind.length)];
  
  return { condition, temp, hum, windSpeed };
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
  
  // :weather <city>
  if (command === 'weather') {
    if (!hasPermission(message.author.id)) {
      await message.channel.send('fuck off');
      return;
    }
    
    const city = args.join(' ');
    if (!city) {
      await sendErrorNotification(message.channel, 'please provide a city name\nusage: :weather Moscow');
      return;
    }
    
    const weather = getRandomWeather(city);
    
    const weatherEmbed = new MessageEmbed()
      .setColor(0x000000)
      .setTitle(`🌍 weather in ${city}`)
      .setDescription(`\`\`\`\n${weather.condition}\nTemperature: ${weather.temp}°C\nHumidity: ${weather.hum}%\nWind Speed: ${weather.windSpeed} km/h\`\`\``)
      .setFooter({ text: '• weather data •' })
      .setTimestamp();
    
    await message.channel.send({ embeds: [weatherEmbed] });
    return;
  }
  
  // :say <text>
  if (command === 'say') {
    if (!hasPermission(message.author.id)) {
      await message.channel.send('fuck off');
      return;
    }
    
    const text = args.join(' ');
    if (!text) {
      await sendErrorNotification(message.channel, 'please provide text to say\nusage: :say hello world');
      return;
    }
    
    // Удаляем сообщение пользователя
    await message.delete().catch(() => {});
    
    // Отправляем текст
    await message.channel.send(text);
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
      .setDescription('\`\`\`\n:rainbow [@user]           - starts rainbow role cycle\n:rainbow_stop [@user]     - stops rainbow cycle\n:clear_rainbow [@user]    - removes rainbow roles\n:purge <amount>           - deletes messages (1-100)\n:nuke                     - recreates current channel\n:weather <city>           - shows weather for a city\n:say <text>               - bot repeats your text\n:whitelist add @user      - adds user to whitelist (owner)\n:whitelist remove @user   - removes user from whitelist (owner)\n:whitelist list           - shows whitelist (owner)\n:help                     - shows this message\`\`\`')
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
