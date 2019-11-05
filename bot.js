const Discord = require("discord.js"); //includes the discord.js node package
const client = new Discord.Client(); //Client class of the npm package to interact with the discord api
const fs = require("fs"); //includes the file system package
const { Client } = require("pg"); //PostgreSQL database
client.commands = new Discord.Collection(); //Collection extends Map. A Map with additional utility methods. 
//This is used throughout discord.js rather than Arrays for anything that has an ID, for significantly improved 
//performance and ease-of-use.

client.queue = [];
client.queueIndex;

client.login(NjI1OTk5NTAwMTg3NjY0Mzg2.XcGJ7w.eca6IPGwG5sRcidSRMj0mYbNUaA); //Logs in to the application.

//Online message
client.on("ready", async ()=>{
	console.log(`${client.user.username} is online on ${client.guilds.size} servers.`)
});

//Command Handler:
fs.readdir("./commands/", (err, files) =>{
	//if error,
	if(err) console.log(err);

	//if no error,
	let jsfile = files.filter(f => f.split(".").pop() === "js")
	if(jsfile.length <= 0){
		console.log("Couldn't find commands.");
		return;
	}

	//loading each .js file
	jsfile.forEach((f,i) => {
		let props = require(`./commands/${f}`); 
		console.log(`${f} loaded.`);
		client.commands.set(props.help.name, props); //The set() method adds or updates an element with a specified key and value to a Map object.
	});
});

//PostgreSQL Connection:
const con_database = new Client({
	  connectionString: process.env.DATABASE_URL,
  	  ssl: true,
});
con_database.connect(err =>{
	if(err) console.log(err);
		console.log("Connected to database.");
	});

//Generate a random amount of XP
function generateXp() {
	let min = 20;
	let max = 30;
	return Math.floor(Math.random()*(max - min + 1)) + min;
}

//When a message is recieved by the bot:
client.on("message", async (message) =>{
	if(message.author.bot) return; //Doesn't respond to bots
	if (message.channel.type === "dm") return; //Doesn't respond to DMs
	
	//Getting prefix from Heroku PostgreSQL database:
	const { result, fields } = await new Promise((resolve, reject) => {
		con_database.query(`SELECT * FROM prefixes WHERE guildid = '${message.guild.id}'` , (err, result, fields) =>{
			err ? reject(err) : resolve({ result, fields });
			if(!result.rows[0]){
				let query = `INSERT INTO prefixes (guildid, prefix) VALUES ('${message.guild.id}', '${process.env.prefix}')`;
				con_database.query(query);
				prefix = process.env.prefix;
			} 
			else{
				prefix = `${result.rows[0].prefix}`;
			}
		});
	});
	
	let messageContent = message.content.split(" ");
	let cmd = messageContent[0].toLowerCase(); //type: string | includes prefix at this point
	
	//If message does not start with the prefix:
	if(cmd.substring(0, prefix.length) != prefix){
		//Updating xp when users message:
		con_database.query(`SELECT * FROM xp WHERE id = '${message.author.id}' and guildid = '${message.guild.id}'` , (err, result) => {
			if(err) throw (err);
			let query;
			if(!result.rows[0]){
				query = `INSERT INTO xp (id, xp, guildid) VALUES ('${message.author.id}', ${generateXp()},'${message.guild.id}')`;
			} 
			else{
				let xp = result.rows[0].xp;
				query = `UPDATE xp SET xp = ${xp + generateXp()} WHERE id = '${message.author.id}' and guildid = '${message.guild.id}'`;
			}
			con_database.query(query);
		});//end con_database.query()
		return;
	}//end if
	//else if message does start with prefix
	else if(cmd.substring(0, prefix.length) == prefix){
		let args = messageContent.slice(1);
		let commandfile = client.commands.get(cmd.slice(prefix.length));
		//If command exists, run the command
		if(commandfile) commandfile.run(client,message,args,prefix,con_database);
		else{return message.reply(`Invalid command. Type ${prefix}help for help.`)}
	}//end else if
	else{return;}
});//end client.on("message")

//to do
//1. Check if channel welcome_leave exists
//2. if not create channel
//3. Allow users to change welcome_leave name.
client.on("guildMemberAdd", async member =>{
	console.log(`${member.id} joined the server.`)
	let welcomeChannel = member.guild.channels.find(c => c.name === "welcome_leave");
	welcomeChannel.send(`${member} has joined the server.`);
});

//to do
//1. Check if channel welcome_leave exists
//2. if not create channel
//3. Allow users to change welcome_leave name.
client.on("guildMemberRemove", async member =>{
	console.log(`${member.id} left the server.`)
	let welcomeChannel = member.guild.channels.find(c => c.name === "welcome_leave");
	welcomeChannel.send(`${member} has left the server.`);
});

//To do
//Create command channelnotifications <on/off> that allows user to turn off channel notifications
/*client.on("channelCreate", async channel =>{
	try{
		console.log(`${channel.name} has been created.`);
		let sChannel = channel.guild.channels.find(c => c.name === "general");
		sChannel.send(`${channel} has been created.`);
	}catch(err){
		console.log("Error: ", err);
	}
});

client.on("channelDelete", async channel =>{

	console.log(`${channel.name} has been deleted.`);
	let sChannel = channel.guild.channels.find(c => c.name === "general");
	sChannel.send(`${channel.name} has been deleted.`);
});
*/

// ~~~~~~~~~~ Additional Info ~~~~~~~~~~~
//An “EventEmitter“ takes two parameters: the 
//event type and a function that will be evaluated 
//if the event gets fired.
//syntax: client.on(type, function);

//(message) =>{} is called an arrow function
// regular function call:| arrow function call:
//                       |
//  function(foo){       |  (foo) => { console.log(foo); }
//    console.log(foo);  |
//  }                    |

//Guilds in Discord represent an isolated collection of users and 
//channels, and are often referred to as "servers" in the UI.

//split() method splits a String object into an array of strings by 
//separating the string into substrings, using a specified separator 
//string to determine where to make each split.

//The slice() method returns a shallow copy of a portion of an array 
//into a new array object selected from begin to end (end not included). 
//The original array will not be modified.
