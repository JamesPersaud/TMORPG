// zombies don't understand A*, or even diagonal movement!
// They just want to eat your BRAINS!
//
// node server for a horrible LD#20 entry by goffmog

var http = require('http');
var io = require('socket.io') // for npm, otherwise use require('./path/to/socket.io');

require('../commonjs/json2.js');
require('../commonjs/tileworld.js');

clients = []; //indexed by sessionId
players = []; //indexed by sessionId
playerStats = []; //indexed by sessionId

legends = [];

rats = [];
kobolds = [];
orcs = [];
skeletons = [];
balrogs = [];

monsterMax = [];

monsterMax[0] = {"rats":0,"kobolds":0,"orcs":0,"skeletons":0,"balrogs":0};
monsterMax[1] = {"rats":6,"kobolds":2,"orcs":0,"skeletons":0,"balrogs":0};
monsterMax[2] = {"rats":1,"kobolds":5,"orcs":1,"skeletons":0,"balrogs":0};
monsterMax[3] = {"rats":0,"kobolds":1,"orcs":6,"skeletons":2,"balrogs":0};
monsterMax[4] = {"rats":0,"kobolds":0,"orcs":0,"skeletons":8,"balrogs":1};

monsterCount = [];

monsterCount[0] = {"rats":0,"kobolds":0,"orcs":0,"skeletons":0,"balrogs":0};
monsterCount[1] = {"rats":0,"kobolds":0,"orcs":0,"skeletons":0,"balrogs":0};
monsterCount[2] = {"rats":0,"kobolds":0,"orcs":0,"skeletons":0,"balrogs":0};
monsterCount[3] = {"rats":0,"kobolds":0,"orcs":0,"skeletons":0,"balrogs":0};
monsterCount[4] = {"rats":0,"kobolds":0,"orcs":0,"skeletons":0,"balrogs":0};

ratSpawnInterval = setInterval(spawnRats,5000);
koboldSpawnInterval = setInterval(spawnKobolds,5000);
orcSpawnInterval = setInterval(spawnOrcs,5000);
skeletonSpawnInterval = setInterval(spawnSkeletons,2000);
balrogSpawnInterval = setInterval(spawnBalrogs,30000);

monsterUpdateInterval = setInterval(updateMonsters,60);

function updateMonsters(){
    ratMovers =[];
    //send nearby monsters to players for drawing, etc
    for(rat in rats){
        rats[rat].target = null;
        for(var player in players){
            if(rats[rat].mapLevel == players[player].mapLevel && Math.abs(players[player].tileX - rats[rat].tileX) <=20
                && Math.abs(players[player].tileY - rats[rat].tileY) <=11){

                //rat targets this player
                if(rats[rat].target == null){
                    rats[rat].target = player;
                    ratMovers.push(rat);
                }

                //tell player where the rat is
                clients[player].send('{"func":"ratUpdate","args":'+JSON.stringify(rats[rat])+'}');
            }
        }
    }

    //kobolds
    for(kobold in kobolds){
        kobolds[kobold].target = null;
        for(var player in players){
            if(kobolds[kobold].mapLevel == players[player].mapLevel && Math.abs(players[player].tileX - kobolds[kobold].tileX) <=20
                && Math.abs(players[player].tileY - kobolds[kobold].tileY) <=11){

                //rat targets this player
                if(kobolds[kobold].target == null){
                    kobolds[kobold].target = player;
                    ratMovers.push(kobold);
                }

                //tell player where the rat is
                clients[player].send('{"func":"koboldUpdate","args":'+JSON.stringify(kobolds[kobold])+'}');
            }
        }
    }

    //orcs
    for(orc in orcs){
        orcs[orc].target = null;
        for(var player in players){
            if(orcs[orc].mapLevel == players[player].mapLevel && Math.abs(players[player].tileX - orcs[orc].tileX) <=20
                && Math.abs(players[player].tileY - orcs[orc].tileY) <=11){

                //rat targets this player
                if(orcs[orc].target == null){
                    orcs[orc].target = player;
                    ratMovers.push(orc);
                }

                //tell player where the rat is
                clients[player].send('{"func":"orcUpdate","args":'+JSON.stringify(orcs[orc])+'}');
            }
        }
    }

    //skellies
    for(skeleton in skeletons){
        skeletons[skeleton].target = null;
        for(var player in players){
            if(skeletons[skeleton].mapLevel == players[player].mapLevel && Math.abs(players[player].tileX - skeletons[skeleton].tileX) <=20
                && Math.abs(players[player].tileY - skeletons[skeleton].tileY) <=11){

                //rat targets this player
                if(skeletons[skeleton].target == null){
                    skeletons[skeleton].target = player;
                    ratMovers.push(skeleton);
                }

                //tell player where the rat is
                clients[player].send('{"func":"skeletonUpdate","args":'+JSON.stringify(skeletons[skeleton])+'}');
            }
        }
    }

    //rogs
    for(balrog in balrogs){
        balrogs[balrog].target = null;
        for(var player in players){
            if(balrogs[balrog].mapLevel == players[player].mapLevel && Math.abs(players[player].tileX - balrogs[balrog].tileX) <=20
                && Math.abs(players[player].tileY - balrogs[balrog].tileY) <=11){

                //rat targets this player
                if(balrogs[balrog].target == null){
                    balrogs[balrog].target = player;
                    ratMovers.push(balrog);
                }

                //tell player where the rat is
                clients[player].send('{"func":"balrogUpdate","args":'+JSON.stringify(balrogs[balrog])+'}');
            }
        }
    }

}

globalMonsterCounter =0;

function spawnRats(){
    for(level =0; level< monsterMax.length;level++){
        if(monsterCount[level].rats < monsterMax[level].rats){
            var randy = Math.floor(Math.random()*worldMapArray[level].viableMonsterLocations.length);
            var location = worldMapArray[level].viableMonsterLocations[randy];
            //console.log(randy);
            //console.log(location);
            var newRat = new Player("rat_"+globalMonsterCounter,2,location.x,location.y);
            newRat.name = "rat_"+globalMonsterCounter;
            newRat.displayName = "rat_"+globalMonsterCounter;
            newRat.mapLevel = level;
            newRat.offsetX = 0;
            newRat.offsetY = 0;
            newRat.tileX = location.x;
            newRat.tileY = location.y;
            newRat.maxHP = 100;
            newRat.currentHP = 100;
            newRat.gold = 5;
            newRat.exp = 10;
            newRat.attackLevel = 1;
            newRat.defendLevel = 1;
            rats.push(newRat);
            monsterCount[level].rats ++;
            console.log("Spawned rat on level "+level+" at "+location.x+":"+location.y);
            globalMonsterCounter++;
        }
    }
}

function spawnKobolds(){
    for(level =0; level< monsterMax.length;level++){
        if(monsterCount[level].kobolds < monsterMax[level].kobolds){
            var randy = Math.floor(Math.random()*worldMapArray[level].viableMonsterLocations.length);
            var location = worldMapArray[level].viableMonsterLocations[randy];
            //console.log(randy);
            //console.log(location);
            var newKob = new Player("kobold",2,location.x,location.y);
            newKob.name = "kobold_"+globalMonsterCounter;
            newKob.displayName = "kobold_"+globalMonsterCounter;
            newKob.mapLevel = level;
            newKob.offsetX = 0;
            newKob.offsetY = 0;
            newKob.tileX = location.x;
            newKob.tileY = location.y;
            newKob.maxHP = 100;
            newKob.currentHP = 100;
            newKob.gold = 15;
            newKob.exp = 30;
            newKob.attackLevel = 3;
            newKob.defendLevel = 1;
            kobolds.push(newKob);
            monsterCount[level].kobolds ++;
            console.log("Spawned kobold on level "+level+" at "+location.x+":"+location.y);
            globalMonsterCounter++;
        }
    }
}

function spawnOrcs(){
    for(level =0; level< monsterMax.length;level++){
        if(monsterCount[level].orcs < monsterMax[level].orcs){
            var randy = Math.floor(Math.random()*worldMapArray[level].viableMonsterLocations.length);
            var location = worldMapArray[level].viableMonsterLocations[randy];
            //console.log(randy);
            //console.log(location);
            var newOrc = new Player("orc",2,location.x,location.y);
            newOrc.name = "orc_"+globalMonsterCounter;
            newOrc.displayName = "orc_"+globalMonsterCounter;
            newOrc.mapLevel = level;
            newOrc.offsetX = 0;
            newOrc.offsetY = 0;
            newOrc.tileX = location.x;
            newOrc.tileY = location.y;
            newOrc.maxHP = 100;
            newOrc.currentHP = 100;
            newOrc.gold = 100;
            newOrc.exp = 100;
            newOrc.attackLevel = 5;
            newOrc.defendLevel = 5;
            orcs.push(newOrc);
            monsterCount[level].orcs ++;
            console.log("Spawned orc on level "+level+" at "+location.x+":"+location.y);
            globalMonsterCounter++;
        }
    }
}

function spawnSkeletons(){
    for(level =0; level< monsterMax.length;level++){
        if(monsterCount[level].skeletons < monsterMax[level].skeletons){
            var randy = Math.floor(Math.random()*worldMapArray[level].viableMonsterLocations.length);
            var location = worldMapArray[level].viableMonsterLocations[randy];
            //console.log(randy);
            //console.log(location);
            var newSke = new Player("skeleton",2,location.x,location.y);
            newSke.name = "skeleton_"+globalMonsterCounter;
            newSke.displayName = "skeleton_"+globalMonsterCounter;
            newSke.mapLevel = level;
            newSke.offsetX = 0;
            newSke.offsetY = 0;
            newSke.tileX = location.x;
            newSke.tileY = location.y;
            newSke.maxHP = 100;
            newSke.currentHP = 100;
            newSke.gold = 50;
            newSke.exp = 500;
            newSke.attackLevel = 7;
            newSke.defendLevel = 4;
            skeletons.push(newSke);
            monsterCount[level].skeletons ++;
            console.log("Spawned skeleton on level "+level+" at "+location.x+":"+location.y);
            globalMonsterCounter++;
        }
    }
}

function spawnBalrogs(){
    for(level =0; level< monsterMax.length;level++){
        if(monsterCount[level].skeletons < monsterMax[level].balrogs){
            var randy = Math.floor(Math.random()*worldMapArray[level].viableMonsterLocations.length);
            var location = worldMapArray[level].viableMonsterLocations[randy];
            //console.log(randy);
            //console.log(location);
            var newBal = new Player("balrog",2,location.x,location.y);
            newBal.name = "balrog_"+globalMonsterCounter;
            newBal.displayName = "balrog_"+globalMonsterCounter;
            newBal.mapLevel = level;
            newBal.offsetX = 0;
            newBal.offsetY = 0;
            newBal.tileX = location.x;
            newBal.tileY = location.y;
            newBal.maxHP = 100;
            newBal.currentHP = 100;
            newBal.gold = 50;
            newBal.exp = 500;
            newBal.attackLevel = 10;
            newBal.defendLevel = 10;
            balrogs.push(newBal);
            monsterCount[level].balrogs ++;
            console.log("Spawned balrog on level "+level+" at "+location.x+":"+location.y);
            globalMonsterCounter++;
        }
    }
}

function compareLegends(a,b){
    if(a.exp > b.exp){
        return -1;
    }else if(a.exp < b.exp){
        return 1;
    }else{
        if(a.age < b.age){
            return 1;
        }else if(a.age > b.age){
            return -1;
        }
    }
    return 0;
}

function Legend(player,killedby,killedwhere){

    var playerAge = 18 + year -player.birthYear;
    if(season < player.birthSeason){
        playerAge -=1;
    }

    this.name = player.name;
    this.age = playerAge;
    this.exp = player.exp;
    this.killedby = killedby;
    this.killedwhere = killedwhere;
    this.year = year;
    this.season = season;

    console.log("made legend");
    console.log(this);
}

year = 1;
season = 1;

names = [];

playercount = 0;
var serverRPC = {};

function Player(n,t,x,y){
    this.name = "";
    this.sessionId = "";
    this.tileX =10;
    this.tileY =10;
    this.facing =0;
    this.displayName ='';
    this.moving =0;
    this.eyeColour;
    this.skinColour;
    this.emotion;
    this.attackDirection = -1;
    this.birthYear = year;
    this.birthSeason = season;
    this.attackLevel = 2;
    this.defendLevel = 2;
    this.maxHP = 100;
    this.currentHP = 100;
    this.exp = 0;
    this.gold = 0;
    this.mapLevel = 0;
    this.killedBy = "The Internet";
}

function PlayerStats(){
    this.race = "";
    this.mhp = 0;
    this.exp = 0;
    this.gold = 0;
    this.thac0 = 0;
    this.ac = 0;
    this.str = 0;
    this.dex = 0;
    this.con = 0;
    this.intel = 0;
    this.wis = 0;
}

worldMap = new tMCow.tiles.World();
worldMap.loadMap('../commondata/village.tilemap');

worldMapArray = [];

worldMapArray[0] = new tMCow.tiles.World();
worldMapArray[0].loadMap('../commondata/village.tilemap');

worldMapArray[1] = new tMCow.tiles.World();
worldMapArray[1].loadMap('../commondata/dungeon1.tilemap');

worldMapArray[2] = new tMCow.tiles.World();
worldMapArray[2].loadMap('../commondata/dungeon2.tilemap');

worldMapArray[3] = new tMCow.tiles.World();
worldMapArray[3].loadMap('../commondata/dungeon3.tilemap');

worldMapArray[4] = new tMCow.tiles.World();
worldMapArray[4].loadMap('../commondata/dungeon4.tilemap');

console.log("loaded worldmaps");

var server = http.createServer(function(req, res){
 res.writeHead(200, {'Content-Type': 'text/html'});
 res.end('<h1>Hello world</h1>'); 
});
server.listen(666);
console.log("waiting for some clients");

//GAME

gametimeInterval = setInterval(advanceTime,30000);

function advanceTime(){
    if(season == 4){
        season = 1;
        year ++;
    }else{
        season++;
    }

    console.log("Time now year "+year+" season "+season);
    sendSeasons();
}

//RPC********************************

serverRPC.iDied = function(args,client){

    sendServerMessage("On noes! "+args.name+" died :(");

    var deadwhere = "in the village";
    if(args.mapLevel >0){
        deadwhere = "on level "+args.mapLevel;
    }

    console.log(args.killedBy);

    legends.push(new Legend(args,args.killedBy,deadwhere));
    legends.sort(compareLegends);

    sendLegends();
}

//a player hit a monster
serverRPC.iGotOne = function(args,client){

    console.log(args.name);
    console.log(args.type);
    console.log(args.damage);

    var lookin;

    if(args.type == "rat"){
        lookin = rats;
    }else if(args.type = "kobold"){
        lookin = kobolds;
    }else if (args.type = "orc"){
        lookin = orcs;
    }else if (args.type = "skeleton"){
        lookin = skeletons;
    }else if (args.type = "balrog"){
        lookin = balrogs;
    }

    for(var searchName in lookin){
        if(lookin[searchName].name == args.name){

            console.log("found" +searchName);

            lookin[searchName].currentHP -= args.damage;
            if(lookin[searchName].currentHP <=0){

                if(args.type == "rat"){
                    monsterCount[lookin[searchName].mapLevel].rats --;
                }else if(args.type = "kobold"){
                    monsterCount[lookin[searchName].mapLevel].kobolds --;
                }else if (args.type = "orc"){
                    monsterCount[lookin[searchName].mapLevel].orcs --;
                }else if (args.type = "skeleton"){
                    monsterCount[lookin[searchName].mapLevel].skeletons --;
                }else if (args.type = "balrog"){
                    monsterCount[lookin[searchName].mapLevel].balrogs --;
                }

                delete lookin[searchName];
            }
            break;
        }
    }
}

// player has sent his location, update and send to other players
serverRPC.playerSendLocation = function(args,client){

    players[client] = args;
    console.log("got update from "+client+" "+args.name);

    for(otherPlayer in players){
        if(Math.abs(players[otherPlayer].tileX - args.tileX) <=20
                && Math.abs(players[otherPlayer].tileY - args.tileY) <=11
                && otherPlayer != client){
            clients[otherPlayer].send('{"func":"playerUpdate","args":'+JSON.stringify(args)+'}');
        }
    }
}

function distPythag(x1,y1,x2,y2){
    var opp = Math.abs(x1-x2);
    var adj = Math.abs(y1-y2);
    return Math.sqrt((opp*opp) + (adj*adj));   
}

serverRPC.playerSetName = function(args,client){

    if(args == ''){
        clients[client].send('{"func":"setNameResponse","args":"'+players[client].name+'"}');
        names.push(players[client].name);
        sendServerMessage(players[client].name+" has joined the game.");
        sendNames();
        return;
    }

    for(var sess in players){
        if(players[sess] !=null){
            if(players[sess].displayName == args && sess != client){
                clients[client].send('{"func":"setNameResponse","args":"'+players[client].name+'"}');
                names.push(players[client].name);
                sendServerMessage(players[client].name+" has joined the game.");
                sendNames();
                return;
            }
        }
    }

    players[client].displayName = args;
    clients[client].send('{"func":"setNameResponse","args":"'+args+'"}');
    names.push(args);
    sendServerMessage(args+" has joined the game.");
    sendNames();
}

serverRPC.playerShout = function(args,client){
    args = args.replace("'","");
    args = args.replace('"','');
    args = args.replace('\\','');

    var message = "<br/>"+players[client].displayName+ " : " + args;

    for(var sess in players){
        if(players[sess] !=null){
            console.log("Messaging" + sess);
            clients[sess].send('{"func":"showMessage","args":"'+message+'"}');
        }
    }
}

function sendSeasons(){

    var seasonal = {};
    seasonal.year = year;
    seasonal.season = season;

    for(var sess in players){
        if(players[sess] !=null){
            clients[sess].send('{"func":"getSeasons","args":'+JSON.stringify(seasonal)+'}');
        }
    }
}

function sendNames(){

    for(var sess in players){
        if(players[sess] !=null){
            console.log("Messaging" + sess);
            clients[sess].send('{"func":"getNames","args":'+JSON.stringify(names)+'}');
        }
    }
}

function sendLegends(){

    var toplegends = [];

    if(legends.length < 4){
        toplegends = legends;
    }else{
        toplegends.push(legends[0]);
        toplegends.push(legends[1]);
        toplegends.push(legends[2]);
    }

    for(var sess in players){
        if(players[sess] !=null){
            console.log("Messaging" + sess);
            clients[sess].send('{"func":"getLegends","args":'+JSON.stringify(toplegends)+'}');
        }
    }
}

function sendServerMessage(message){
    //&#34;
    console.log("Message function called");
    message = message.replace('"','&#34;');

    message = "<br/><span style=&#34;color:green;&#34;>"+message+"</span>";


    for(var sess in players){
        if(players[sess] !=null){
            console.log("Messaging" + sess);
            clients[sess].send('{"func":"showMessage","args":"'+message+'"}');
        }
    }
}

// socket.io ****************************
var socket = io.listen(server); 
console.log("socket object made");
socket.on('connection', function(client){
  // new client is here! 
 console.log("Client is here, yay!");

 //ADDING A NEW PLAYER TO GAME************************

 clients[client.sessionId] = client;
 client.send('{"func":"getWorldMap","args":'+worldMap.serializeTiles()+'}');
 client.send('{"func":"getWorldMapArray","args":'+JSON.stringify(worldMapArray)+'}');
 playercount++;
 var startx = 10;
 var starty = 10;

 var newplay = new Player(client.sessionId,0,startx,starty);

 players[client.sessionId] = newplay;
 playerStats[client.sessionId] = new PlayerStats();
 client.send('{"func":"getPlayerInfo","args":'+JSON.stringify(players[client.sessionId])+'}');

 sendNames();
 sendLegends();

 //END ADDING*******************************************


  client.on('message', function(data){
	console.log("Client message? "+data);
	data = JSON.parse(data);
	var args = data.args;
	serverRPC[data.func](args,client.sessionId);
  });

  //console.log(client);
  client.on('disconnect', function(){

    console.log("client disconnect (ohnoes)");
    sendServerMessage(players[client.sessionId].displayName+" has disconnected.. Bye!");

    var name = names.indexOf(players[client.sessionId].displayName);
    if(name > -1){
        delete names[name];
    }

    var deadwhere = "in the village";
    if(players[client.sessionId].mapLevel >0){
        deadwhere = "on level "+players[client.sessionId].mapLevel;
    }

    legends.push(new Legend(players[client.sessionId],"The Internet",deadwhere));
    legends.sort(compareLegends);

    delete players[client.sessionId];
    delete clients[client.sessionId];

    sendNames();
    sendLegends();

  });
  console.log('sessid: '+client.sessionId);
}); 
console.log("serving now");


