require('dotenv').config();
const express=require('express');
const session=require('express-session');
const cors=require('cors');
const path=require('path');
const {Client,GatewayIntentBits,Partials,Events}=require('discord.js');
const app=express();
const PORT=process.env.PORT||3000;
const GUILD_ID=process.env.DISCORD_GUILD_ID||'1492960921667240019';
const ANNOUNCEMENT_CHANNEL_ID=process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID||'1513979739012993169';
const ROBLOX_PLACE_ID=process.env.ROBLOX_PLACE_ID||'108493794932864';
const CLIENT_URL=process.env.PUBLIC_URL||`http://localhost:${PORT}`;
const DISCORD_CLIENT_ID=process.env.DISCORD_CLIENT_ID||'';
const DISCORD_CLIENT_SECRET=process.env.DISCORD_CLIENT_SECRET||'';
const DISCORD_REDIRECT_URI=process.env.DISCORD_REDIRECT_URI||`${CLIENT_URL}/api/auth/callback`;
const ADMIN_ROLE_IDS=new Set((process.env.ADMIN_ROLE_IDS||'').split(',').map(x=>x.trim()).filter(Boolean));
const admins=new Set((process.env.ADMIN_USER_IDS||'').split(',').map(x=>x.trim()).filter(Boolean));
let cache={discord:{members:null,online:null,channels:null,events:null},roblox:{playing:null,visits:null,likes:null,favorites:null},updatedAt:new Date().toISOString()};
let announcements=[];
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildPresences,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent],partials:[Partials.Channel]});
app.use(cors({origin:CLIENT_URL,credentials:true}));app.use(express.json());app.use(session({secret:process.env.SESSION_SECRET||'change-me',resave:false,saveUninitialized:false,cookie:{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax'}}));
function isAdmin(req){return !!req.session.discordUser && (admins.has(req.session.discordUser.id)||req.session.discordUser.isAdmin)}
async function discordFetch(url,token){const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});if(!r.ok)throw new Error(`Discord ${r.status}`);return r.json();}
async function refreshStats(){
 try{
  const g=await client.guilds.fetch(GUILD_ID); await g.fetch();
  const members=g.memberCount; const channels=g.channels.cache.size; const online=g.members.cache.filter(m=>m.presence?.status&&m.presence.status!=='offline').size; const events=g.scheduledEvents?.cache?.size||0;
  let roblox=cache.roblox;
  const u=await fetch(`https://apis.roblox.com/universes/v1/places/${ROBLOX_PLACE_ID}/universe`); if(u.ok){const uj=await u.json(); const universeId=uj.universeId; const r=await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`); if(r.ok){const j=await r.json();const x=j.data?.[0];if(x)roblox={playing:x.playing,visits:x.visits,likes:x.likes,favorites:x.favoritedCount};}}
  cache={discord:{members,online,channels,events},roblox,updatedAt:new Date().toISOString()};
 }catch(e){console.error('stats',e.message)}
}
async function refreshAnnouncements(){try{const c=await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);if(!c?.messages)return;const ms=await c.messages.fetch({limit:10});announcements=[...ms.values()].map(m=>({id:m.id,type:'Announcement',text:m.content||'New announcement',time:m.createdAt.toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}));}catch(e){console.error('announcements',e.message)}}
app.get('/api/stats',(req,res)=>res.json(cache));app.get('/api/announcements',(req,res)=>res.json({items:announcements}));
app.get('/api/auth/login',(req,res)=>{
 if(!DISCORD_CLIENT_ID)return res.status(500).send('Discord OAuth is not configured yet.');
 const state=Math.random().toString(36).slice(2)+Date.now().toString(36); req.session.oauthState=state;
 const u=new URL('https://discord.com/oauth2/authorize'); u.searchParams.set('client_id',DISCORD_CLIENT_ID);u.searchParams.set('redirect_uri',DISCORD_REDIRECT_URI);u.searchParams.set('response_type','code');u.searchParams.set('scope','identify guilds.members.read');res.redirect(u.toString());
});
app.get('/api/auth/callback',async(req,res)=>{
 try{if(!req.query.code||req.query.state!==undefined&&req.query.state!==req.session.oauthState) return res.status(400).send('Invalid OAuth state.');
  const body=new URLSearchParams({client_id:DISCORD_CLIENT_ID,client_secret:DISCORD_CLIENT_SECRET,grant_type:'authorization_code',code:req.query.code,redirect_uri:DISCORD_REDIRECT_URI});
  const tr=await fetch('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body}); if(!tr.ok)throw new Error('OAuth token exchange failed'); const tok=await tr.json();
  const user=await discordFetch('https://discord.com/api/users/@me',tok.access_token);
  let member=null; try{member=await discordFetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`,tok.access_token)}catch{}
  const roleAdmin=member?.roles?.some(r=>ADMIN_ROLE_IDS.has(r)); const userAdmin=admins.has(user.id);
  req.session.discordUser={id:user.id,username:user.global_name||user.username,avatar:user.avatar,isAdmin:userAdmin||roleAdmin}; delete req.session.oauthState; res.redirect('/#admin');
 }catch(e){console.error('oauth',e);res.status(500).send('Discord login failed. Check your OAuth configuration.');}
});
app.post('/api/auth/logout',(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get('/api/auth/me',(req,res)=>res.json({authenticated:!!req.session.discordUser,user:req.session.discordUser||null,admin:isAdmin(req)}));
app.get('/api/admin/stats',(req,res)=>{if(!isAdmin(req))return res.status(403).json({error:'forbidden'});res.json(cache)});
app.post('/api/admin/preview-stats',(req,res)=>{if(!isAdmin(req))return res.status(403).json({error:'forbidden'});cache.discord={...cache.discord,...req.body};res.json(cache)});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'..','site','index.html')));
client.once(Events.ClientReady,async c=>{console.log(`Discord connected as ${c.user.tag}`);await refreshStats();await refreshAnnouncements();setInterval(refreshStats,30000);setInterval(refreshAnnouncements,60000)});
client.on(Events.MessageCreate,async m=>{if(m.channelId===ANNOUNCEMENT_CHANNEL_ID)await refreshAnnouncements()});
app.listen(PORT,()=>console.log(`Odd Signals running on ${PORT}`));
if(process.env.DISCORD_BOT_TOKEN)client.login(process.env.DISCORD_BOT_TOKEN);else console.warn('DISCORD_BOT_TOKEN missing: API runs but Discord data is unavailable.');
