/**
 // general stuff to connect to a node server and do a crude json rpc
 */

gotPlayerInfo =0;
gotWorldMap =0;
gotWorldMapArray =0;
joinedGame =0;

legends = [];

year = 1;
season = 1;
seasonArray =['none','Spring','Summer','Autumn','Winter'];

myPlayerName = '';

tMCow.client = {};
tMCow.client.RPC = {};
tMCow.serverAddress = "node.goffmog.com";
tMCow.serverPort = 666;
tMCow.logging = 1;

tMCow.client.rats = [];
tMCow.client.kobolds = [];
tMCow.client.orcs = [];
tMCow.client.skeletons = [];
tMCow.client.balrogs = [];

tMCow.client.worldMap = new tMCow.tiles.World();
tMCow.client.worldMapArray = [];
tMCow.client.worldMapArray[0] = new tMCow.tiles.World();
tMCow.client.worldMapArray[1] = new tMCow.tiles.World();
tMCow.client.worldMapArray[2] = new tMCow.tiles.World();
tMCow.client.worldMapArray[3] = new tMCow.tiles.World();
tMCow.client.worldMapArray[4] = new tMCow.tiles.World();

tMCow.client.currentMap = tMCow.client.worldMapArray[0];

tMCow.client.logit = function(s){
    if(tMCow.logging == 1 && console !== undefined && console !== null && console && console.log){
        console.log(s);
    }
}

tMCow.client.player = {};
tMCow.client.logit("init name");
tMCow.client.player.name = "";
tMCow.client.player.sessionId = "";
tMCow.client.player.tileX =10;
tMCow.client.player.tileY =10;
tMCow.client.player.facing =0;
tMCow.client.player.moving =0;
tMCow.client.player.attackDirection =-1;
tMCow.client.player.displayName ='';
tMCow.client.player.mapLevel = 0;
tMCow.client.player.killedBy = "The Internet";

tMCow.client.player.birthYear = 0;
tMCow.client.player.birthSeason = 0;
tMCow.client.player.attackLevel = 2;
tMCow.client.player.defendLevel = 2;
tMCow.client.player.maxHP = 100;
tMCow.client.player.currentHP = 100;
tMCow.client.player.exp = 0;
tMCow.client.player.gold = 0;



//RPC********************************

function updateLegends(){

    var html = "";
    
    for(legend in legends){
        html += "<p>";
        html += legends[legend].name + "<br/>";
        html += "EXP: " + legends[legend].exp + "<br/>";
        html += "RIP " +seasonArray[legends[legend].season]+ " year " + legends[legend].year + " aged " + legends[legend].age + "<br/>";
        html += "Killed by " + legends[legend].killedby + " " + legends[legend].killedwhere + "<br/>";
        html += "</p>";
    }
    
    document.getElementById("divTopLegends").innerHTML = html;
}

function updateYearandSeason(){
    var seasonElement = document.getElementById("spanSeason");
    var yearElement = document.getElementById("spanYear");

    seasonElement.innerHTML = seasonArray[season];
    yearElement.innerHTML = year;

    updateStats();
}

//time waits for no man
tMCow.client.RPC.getSeasons = function(args){
    year = args.year;
    season = args.season;

    updateYearandSeason();
}

//someone left or joined
tMCow.client.RPC.getNames = function(args){

    var unfound = new Array();

    for(other in tMCow.client.otherPlayers){
        var found =0;
        for(name in args){
            if(tMCow.client.otherPlayers[other]){
                if(tMCow.client.otherPlayers[other].name == name){
                    found = 1;
                }
            }
        }
        if(found ==0){
            tMCow.client.otherPlayers[other] = null;
        }
    }

}

//Someone died
tMCow.client.RPC.getLegends = function(args){
    legends = args;
    updateLegends();
}

//show messages
tMCow.client.RPC.showMessage = function(args){
    document.getElementById('eventbox').innerHTML += args;
    document.getElementById('eventbox').scrollTop =document.getElementById('eventbox').scrollHeight;
}

//update positions of rats
tMCow.client.RPC.ratUpdate = function(args){
    if(tMCow.client.rats[args.name] == null){
        tMCow.client.rats[args.name] = [];
        tMCow.client.rats[args.name][0] = args;
    }else{
        if(args.currentHP <= 0){
            delete tMCow.client.rats[args.name];
        }else{
            tMCow.client.rats[args.name][0] = args;
        }
    }
    //tMCow.client.logit('pushing '+args.name+' counting '+ tMCow.client.otherPlayers[args.name].length);
}

//kobolds
tMCow.client.RPC.koboldUpdate = function(args){
    if(tMCow.client.kobolds[args.name] == null){
        tMCow.client.kobolds[args.name] = [];
        tMCow.client.kobolds[args.name][0] = args;
    }else{
        if(args.currentHP <= 0){
            delete tMCow.client.kobolds[args.name];
        }else{
            tMCow.client.kobolds[args.name][0] = args;
        }
    }
    //tMCow.client.logit('pushing '+args.name+' counting '+ tMCow.client.otherPlayers[args.name].length);
}

//orcs
tMCow.client.RPC.orcUpdate = function(args){
    if(tMCow.client.orcs[args.name] == null){
        tMCow.client.orcs[args.name] = [];
        tMCow.client.orcs[args.name][0] = args;
    }else{
        if(args.currentHP <= 0){
            delete tMCow.client.orcs[args.name];
        }else{
            tMCow.client.orcs[args.name][0] = args;
        }
    }
    //tMCow.client.logit('pushing '+args.name+' counting '+ tMCow.client.otherPlayers[args.name].length);
}

//skeletons
tMCow.client.RPC.skeletonUpdate = function(args){
    if(tMCow.client.skeletons[args.name] == null){
        tMCow.client.skeletons[args.name] = [];
        tMCow.client.skeletons[args.name][0] = args;
    }else{
        if(args.currentHP <= 0){
            delete tMCow.client.skeletons[args.name];
        }else{
            tMCow.client.skeletons[args.name][0] = args;
        }
    }
    //tMCow.client.logit('pushing '+args.name+' counting '+ tMCow.client.otherPlayers[args.name].length);
}

//balrogs
tMCow.client.RPC.balrogUpdate = function(args){
    if(tMCow.client.balrogs[args.name] == null){
        tMCow.client.balrogs[args.name] = [];
        tMCow.client.balrogs[args.name][0] = args;
    }else{
        if(args.currentHP <= 0){
            delete tMCow.client.balrogs[args.name];
        }else{
            tMCow.client.balrogs[args.name][0] = args;
        }
    }
    //tMCow.client.logit('pushing '+args.name+' counting '+ tMCow.client.otherPlayers[args.name].length);
}


//update positions of other players
tMCow.client.RPC.playerUpdate = function(args){
    if(tMCow.client.otherPlayers[args.name] == null)
        tMCow.client.otherPlayers[args.name] = [];

    tMCow.client.otherPlayers[args.name].push(args);

    //tMCow.client.logit('pushing '+args.name+' counting '+ tMCow.client.otherPlayers[args.name].length);
}

// Get map and session id and team at the same time.
tMCow.client.RPC.getPlayerInfo = function(args){

    var oldname = tMCow.client.player.name;
    var olddisplay = tMCow.client.player.displayName;

    tMCow.client.logit(args);
    tMCow.client.player = args;

    if(args.name == ""){
        tMCow.client.player.name = oldname;
        tMCow.client.player.displayName = olddisplay;
    }

    year = args.birthYear;
    season = args.birthSeason;

    updateYearandSeason();

    tMCow.client.player.offsetX =0;
    tMCow.client.player.offsetY =0;

    tMCow.client.logit('got player info');
    gotPlayerInfo = 1;

    if(gotPlayerInfo ==1 && gotWorldMap ==1 && joinedGame == 0){
        joinedGame=1;
        tMCow.canvasInit();
    }
}

tMCow.client.RPC.setNameResponse = function(args){
    if(args == 0){
        alert('Sorry, your name was taken, you will be known as '+args);
    }

    //tMCow.client.player.displayName = args;
    //tMCow.client.player.name = args;
}

// Get world map array
tMCow.client.RPC.getWorldMapArray = function(args){
    tMCow.client.logit(args);

    for(i =0;i<args.length;i++){
        tMCow.client.worldMapArray[i].tileArray = args[i].tileArray.tiles;
    }

    tMCow.client.logit('got world map');
    gotWorldMapArray =1;
    tMCow.client.currentMap = tMCow.client.worldMapArray[0];

    if(gotPlayerInfo ==1 && gotWorldMap ==1 && joinedGame == 0 && gotWorldMapArray == 1){
        joinedGame=1;
        tMCow.canvasInit();
    }
}

// Get map and session id and team at the same time.
tMCow.client.RPC.getWorldMap = function(args){
    tMCow.client.logit(args);
    tMCow.client.worldMap.tileArray = args.tiles;

    tMCow.client.logit('got world map');
    gotWorldMap =1;    

    if(gotPlayerInfo ==1 && gotWorldMap ==1 && joinedGame == 0 && gotWorldMapArray == 1){
        joinedGame=1;
        tMCow.canvasInit();
    }
}

// message the server ******************

//Very very honest client
tMCow.client.iHitOne = function(name,type,damage){
    var args = {};
    args.name = name;
    args.type = type;
    args.damage = damage;

    tMCow.socket.send('{"func":"iGotOne","args":'+JSON.stringify(args)+'}');
}

//Very honest client
tMCow.client.iDied = function(killedby){

    tMCow.client.player.killedBy = killedby;
    tMCow.socket.send('{"func":"iDied","args":'+JSON.stringify(tMCow.client.player)+'}');

    tMCow.client.player.tileX =10;
    tMCow.client.player.tileY =10;
    tMCow.client.player.facing =0;
    tMCow.client.player.moving =0;
    tMCow.client.player.attackDirection =-1;
    tMCow.client.player.mapLevel = 0;

    tMCow.client.player.birthYear = year;
    tMCow.client.player.birthSeason = season;
    tMCow.client.player.attackLevel = 2;
    tMCow.client.player.defendLevel = 2;
    tMCow.client.player.maxHP = 100;
    tMCow.client.player.currentHP = 100;
    tMCow.client.player.exp = 0;
    tMCow.client.player.gold = 0;
    tMCow.client.player.offsetX = 0;
    tMCow.client.player.offsetY = 0;

    tMCow.client.currentMap = tMCow.client.worldMapArray[0];
    var startx,starty;
    startx =2;
    starty =5;

    viewportOrigin = new point2D(startx*tile_dim_x,starty*tile_dim_y);
}

tMCow.client.playerShout = function(){

    var speakbox = document.getElementById('speakbox');
    var message = speakbox.value;
    speakbox.value = '';

    tMCow.socket.send('{"func":"playerShout","args":"'+message+'"}');
}

tMCow.client.playerSetName = function(name){
    tMCow.client.logit("name is "+name);
    tMCow.client.player.name = name;
    tMCow.client.player.displayName = name;
    tMCow.socket.send('{"func":"playerSetName","args":"'+name+'"}');

}

tMCow.client.playerSendLocation = function(){
     tMCow.socket.send('{"func":"playerSendLocation","args":'+JSON.stringify(tMCow.client.player)+'}');
}


// CONNECTION FUNCTIONS**************

tMCow.client.connect = function(){

    if( typeof(io) == 'undefined' ||!io || io === undefined || io === null){
        tMCow.client.logit("Server not found");
        return false;
    }

    try
    {
        tMCow.socket = new io.Socket(
            tMCow.serverAddress,{
                'port':tMCow.serverPort,
                'reconnect': true,
                'reconnection delay': 500,
                'max reconnection attempts': 10
        });
    }
    catch(ex)
    {
        tMCow.client.logit("failed connect with reconnect");
        tMCow.client.logit(ex);
        tMCow.socket = new io.Socket(tMCow.serverAddress,{port:tMCow.serverPort});
    }

    //Client is connected
    tMCow.socket.on('connect', function(){
        tMCow.client.logit("mooo, connected!");
    });

    //A message is sent (always means an RPC)
    tMCow.socket.on('message', function(data){
	    //tMCow.client.logit("incoming moo:  "+data);
		data = JSON.parse(data);
        //tMCow.client.logit("parsed it");
		var args = data.args;
		tMCow.client.RPC[data.func](args);
	});

    //Client is disconnected
    tMCow.socket.on('disconnect', function(){
        tMCow.client.logit("oh noes, disconnected :(");
        alert("Oh noes :( You have been disconnected. Please refresh your browser. Try using Chrome for better stability (if you're not already).");
    });

    tMCow.client.logit("Server found connecting... ");
    tMCow.socket.connect();

    return true;
}

tMCow.client.disconnect = function(){
    tMCow.client.logit("Time to disconnect");
    tMCow.socket.disconnect();
}
