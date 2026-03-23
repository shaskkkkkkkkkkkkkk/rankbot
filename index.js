// Проверка переменных окружения
console.log('Environment variables:');
console.log('DISCORD_TOKEN exists:', !!process.env.DISCORD_TOKEN);
console.log('DISCORD_TOKEN length:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0);

if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is missing!');
    process.exit(1);
}
require('dotenv').config();
const { Client, Intents } = require('discord.js');

// Token
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('TOKEN not set! Add DISCORD_TOKEN to .env');
  process.exit(1);
}

// Rainbow roles (now using prestige roles for rainbow effect)
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

// Role IDs for prestige (1-20) - same as rainbow roles
const prestigeRoles = {
  1: '1447609483932205280',  // Frozen Age
  2: '1447611391979819209',  // Wingful
  3: '1447611757156630668',  // Wiking
  4: '1449429902544605255',  // Valhalla
  5: '1449429946014630072',  // Ragnarok
  6: '1449429975215247400',  // Frostborn
  7: '1449430012787687554',  // Cryo Lord
  8: '1449430087249170582',  // Frostwing
  9: '1449430129007657120',  // Ice Reign
  10: '1449430190278053990', // The snow has fallen
  11: '1467244766826725478', // Specialist
  12: '1467245175645409325', // Nightfall
  13: '1467245620594081875', // Celestial
  14: '1467246031967354981', // Influencer
  15: '1467246602761797852', // Initiate
  16: '1476277302370369636', // Eclipse
  17: '1476277759893442611', // Abyss
  18: '1476278183341985993', // Voidwalker
  19: '1476278563283140701', // Eternal Night
  20: '1476279015689162934'  // Godfall
};

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS
  ]
});

let activeIntervals = new Map();

// Store user rank and prestige data
const userProgress = new Map();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log('Prestige system ready!');
  console.log('Rainbow cycle uses 20 prestige roles');
  console.log('Rainbow cycle interval: 2 seconds (stable mode)');
});

// Function to update user rank
async function updateUserRank(member, currentRank, currentPrestige) {
  try {
    const rankRoleIds = Object.values(rankRoles);
    const toRemove = rankRoleIds.filter(id => member.roles.cache.has(id));
    if (toRemove.length > 0) {
      await member.roles.remove(toRemove);
    }
    
    const newRankRole = rankRoles[currentRank];
    if (newRankRole && member.guild.roles.cache.has(newRankRole)) {
      await member.roles.add(newRankRole);
    }
  } catch (err) {
    console.error('Error updating rank:', err);
  }
}

// Function to update user prestige
async function updateUserPrestige(member, prestigeLevel) {
  try {
    const prestigeRoleIds = Object.values(prestigeRoles);
    const toRemove = prestigeRoleIds.filter(id => member.roles.cache.has(id));
    if (toRemove.length > 0) {
      await member.roles.remove(toRemove);
    }
    
    const newPrestigeRole = prestigeRoles[prestigeLevel];
    if (newPrestigeRole && member.guild.roles.cache.has(newPrestigeRole)) {
      await member.roles.add(newPrestigeRole);
    }
  } catch (err) {
    console.error('Error updating prestige:', err);
  }
}

// Function to get rank icon
function getRankIcon(rank) {
  const icons = {
    1: '🥉',
    2: '🥉',
    3: '🥉',
    4: '🥈',
    5: '🥈',
    6: '🥈',
    7: '🥇',
    8: '🥇',
    9: '🥇',
    10: '👑'
  };
  return icons[rank] || '⭐';
}

// Function to get prestige icon
function getPrestigeIcon(prestige) {
  if (prestige >= 15) return '💎';
  if (prestige >= 10) return '🌟';
  if (prestige >= 5) return '✨';
  return '⭐';
}

// Function to get prestige name
function getPrestigeName(prestige) {
  const names = {
    1: 'Frozen Age',
    2: 'Wingful',
    3: 'Wiking',
    4: 'Valhalla',
    5: 'Ragnarok',
    6: 'Frostborn',
    7: 'Cryo Lord',
    8: 'Frostwing',
    9: 'Ice Reign',
    10: 'The snow has fallen',
    11: 'Specialist',
    12: 'Nightfall',
    13: 'Celestial',
    14: 'Influencer',
    15: 'Initiate',
    16: 'Eclipse',
    17: 'Abyss',
    18: 'Voidwalker',
    19: 'Eternal Night',
    20: 'Godfall'
  };
  return names[prestige] || `Prestige ${prestige}`;
}

// :rankup command with mass support
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(':')) return;
  
  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  // :rankup - Support multiple users
  if (command === 'rankup') {
    // Get all mentioned users, if none, use the author
    let targets = message.mentions.members.size > 0 
      ? Array.from(message.mentions.members.values())
      : [message.member];
    
    if (!targets.length) return;
    
    let results = [];
    
    for (const target of targets) {
      const userId = target.id;
      
      // Initialize user progress if not exists
      if (!userProgress.has(userId)) {
        userProgress.set(userId, {
          rank: 0,
          prestige: 0
        });
      }
      
      const userData = userProgress.get(userId);
      let { rank, prestige } = userData;
      
      // Check if user is at max prestige
      if (prestige >= 20) {
        results.push({
          user: target,
          success: false,
          message: `❌ Already at max prestige (20: ${getPrestigeName(20)})!`,
          type: 'error'
        });
        continue;
      }
      
      // Check if user is at max rank
      if (rank >= 10) {
        // Prestige upgrade
        const newPrestige = prestige + 1;
        
        if (newPrestige <= 20) {
          userProgress.set(userId, {
            rank: 0,
            prestige: newPrestige
          });
          
          await updateUserPrestige(target, newPrestige);
          
          const rankRoleIds = Object.values(rankRoles);
          const toRemove = rankRoleIds.filter(id => target.roles.cache.has(id));
          if (toRemove.length > 0) {
            await target.roles.remove(toRemove);
          }
          
          results.push({
            user: target,
            success: true,
            type: 'prestige',
            oldPrestige: prestige,
            newPrestige: newPrestige,
            oldPrestigeName: getPrestigeName(prestige),
            newPrestigeName: getPrestigeName(newPrestige)
          });
        }
      } else {
        // Normal rank up
        const newRank = rank + 1;
        
        userProgress.set(userId, {
          rank: newRank,
          prestige: prestige
        });
        
        await updateUserRank(target, newRank, prestige);
        
        results.push({
          user: target,
          success: true,
          type: 'rank',
          oldRank: rank,
          newRank: newRank,
          prestige: prestige,
          prestigeName: getPrestigeName(prestige)
        });
      }
    }
    
    // Create beautiful embed for results
    if (results.length === 1) {
      // Single user - detailed embed
      const result = results[0];
      
      if (result.success) {
        if (result.type === 'rank') {
          const rankIcon = getRankIcon(result.newRank);
          const embed = {
            color: 0xFFD700,
            title: `${rankIcon} RANK UP! ${rankIcon}`,
            description: `**${result.user.user.tag}** has leveled up!`,
            fields: [
              {
                name: '📈 Previous Rank',
                value: `${result.oldRank}/10`,
                inline: true
              },
              {
                name: '🎯 New Rank',
                value: `${result.newRank}/10`,
                inline: true
              },
              {
                name: '🎖️ Prestige',
                value: `${result.prestige} - ${result.prestigeName}`,
                inline: true
              }
            ],
            thumbnail: {
              url: result.user.user.displayAvatarURL()
            },
            footer: {
              text: `Keep going! ${10 - result.newRank} more ranks until next prestige!`
            },
            timestamp: new Date()
          };
          await message.channel.send({ embeds: [embed] });
        } else if (result.type === 'prestige') {
          const prestigeIcon = getPrestigeIcon(result.newPrestige);
          const embed = {
            color: 0xFF44FF,
            title: `${prestigeIcon} PRESTIGE ACHIEVED! ${prestigeIcon}`,
            description: `**${result.user.user.tag}** has reached a new prestige level!`,
            fields: [
              {
                name: '🎖️ Previous Prestige',
                value: `${result.oldPrestige} - ${result.oldPrestigeName}`,
                inline: true
              },
              {
                name: '🌟 New Prestige',
                value: `${result.newPrestige} - ${result.newPrestigeName}`,
                inline: true
              },
              {
                name: '🔄 Status',
                value: 'Ranks have been reset to 0!',
                inline: true
              }
            ],
            thumbnail: {
              url: result.user.user.displayAvatarURL()
            },
            footer: {
              text: `${20 - result.newPrestige} more prestiges to go! Next: ${getPrestigeName(result.newPrestige + 1)}`
            },
            timestamp: new Date()
          };
          await message.channel.send({ embeds: [embed] });
        }
      } else {
        const embed = {
          color: 0xFF4444,
          title: '❌ Cannot Rank Up',
          description: `**${result.user.user.tag}** cannot rank up!`,
          fields: [
            {
              name: 'Reason',
              value: result.message,
              inline: false
            }
          ],
          thumbnail: {
            url: result.user.user.displayAvatarURL()
          },
          timestamp: new Date()
        };
        await message.channel.send({ embeds: [embed] });
      }
    } else if (results.length > 1) {
      // Multiple users - summary embed
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      let description = '';
      
      if (successful.length > 0) {
        description += `**✅ Successful Rank Ups (${successful.length}):**\n`;
        for (const result of successful) {
          if (result.type === 'rank') {
            description += `• ${result.user.user.tag}: Rank ${result.oldRank} → **${result.newRank}** ${getRankIcon(result.newRank)} (Prestige ${result.prestige}: ${result.prestigeName})\n`;
          } else if (result.type === 'prestige') {
            description += `• ${result.user.user.tag}: Prestige ${result.oldPrestige} → **${result.newPrestige}** ${getPrestigeIcon(result.newPrestige)} (${result.newPrestigeName})\n`;
          }
        }
      }
      
      if (failed.length > 0) {
        description += `\n**❌ Failed (${failed.length}):**\n`;
        for (const result of failed) {
          description += `• ${result.user.user.tag}: ${result.message}\n`;
        }
      }
      
      const embed = {
        color: 0x44FF44,
        title: '🎉 Mass Rank Up Results 🎉',
        description: description,
        footer: {
          text: `Total: ${successful.length} successful, ${failed.length} failed`
        },
        timestamp: new Date()
      };
      
      await message.channel.send({ embeds: [embed] });
    }
    return;
  }
  
  // :get_roles command
  if (command === 'get_roles') {
    if (!message.member.permissions.has('ADMINISTRATOR')) {
      const embed = {
        color: 0xFF4444,
        title: '❌ Permission Denied',
        description: 'You need administrator permissions to use this command.',
        timestamp: new Date()
      };
      await message.channel.send({ embeds: [embed] });
      return;
    }
    
    try {
      const guild = message.guild;
      const roles = guild.roles.cache
        .filter(role => role.name !== '@everyone')
        .sort((a, b) => b.position - a.position);
      
      if (roles.size === 0) {
        await message.channel.send('No roles found on this server.');
        return;
      }
      
      let roleList = '📋 **Role IDs on this server:**\n\n';
      roles.forEach(role => {
        roleList += `**${role.name}**: \`${role.id}\`\n`;
      });
      
      if (roleList.length > 1900) {
        const buffer = Buffer.from(roleList, 'utf-8');
        await message.channel.send({
          content: '📋 Here are all role IDs from this server:',
          files: [{
            attachment: buffer,
            name: 'role_ids.txt'
          }]
        });
      } else {
        const embed = {
          color: 0x44AAFF,
          title: '📋 Server Roles',
          description: roleList,
          footer: {
            text: `Total roles: ${roles.size}`
          },
          timestamp: new Date()
        };
        await message.channel.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error('Error getting roles:', err);
      await message.channel.send('❌ An error occurred while fetching roles.');
    }
    return;
  }
});

// Other commands
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(':')) return;
  
  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  // :help
  if (command === 'help') {
    const helpEmbed = {
      color: 0x0099ff,
      title: '📋 Command List',
      description: 'Here are all available bot commands:',
      fields: [
        {
          name: ':rankup [@user1] [@user2] ...',
          value: 'Increase rank or prestige for one or multiple users (Rank 1-10 → Prestige 1-20)',
          inline: false
        },
        {
          name: ':rainbow [@user]',
          value: 'Starts the rainbow role cycle using all 20 prestige roles (changes every 2 seconds)',
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
          name: ':get_roles',
          value: 'Shows all role IDs on the server (Admin only)',
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
          name: ':help',
          value: 'Shows this message with the list of all commands',
          inline: false
        }
      ],
      footer: {
        text: 'Command prefix: : | Rainbow cycle: 20 prestige roles, 2 seconds each'
      }
    };
    
    await message.channel.send({ embeds: [helpEmbed] });
    return;
  }
  
  // :rainbow - with 20 prestige roles
  if (command === 'rainbow') {
    const target = message.mentions.members.first() || message.member;
    if (!target) return;
    
    const missing = rainbowRoleIds.filter(id => !message.guild.roles.cache.has(id));
    if (missing.length > 0) {
      console.log('Missing roles:', missing);
      return;
    }
    
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

// Rainbow cycle function with 2 second interval using 20 prestige roles
async function applyRainbowCycle(target) {
  const current = target.roles.cache;
  const toRemove = rainbowRoleIds.filter(id => current.has(id));
  if (toRemove.length > 0) {
    await target.roles.remove(toRemove).catch(() => {});
  }
  
  let idx = 0;
  let lastRoleId = null;
  
  // 2000 milliseconds = 2 seconds
  const interval = setInterval(async () => {
    try {
      const idToAdd = rainbowRoleIds[idx % rainbowRoleIds.length];
      
      // First add the new role
      await target.roles.add(idToAdd);
      
      // Then remove the previous role if it exists and is different from the new one
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

client.login(TOKEN);
