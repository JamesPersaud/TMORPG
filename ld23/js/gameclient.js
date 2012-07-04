
//globals
cm = {};

tMCow.client.otherPlayers = [];

attacking =0;
coolingDown = 0;

monstersCoolingDown = 0;
monsterAttackCooldown = 500;

attackCooldown = 250;
attackDuration = 80;

standingOnStairs = 0;

lastPlayerMovement = 2;

var nextServerSpam = 60;

var playerMoveSpeed = 6; // go on, change it if you dare!
var playerMoveSpeedDiag = Math.floor((Math.sqrt((playerMoveSpeed*playerMoveSpeed)/2))); // x and y lengths of diagonal move.

var playerFacing = 0;
var facingDirections = ['n','ne','e','se','s','sw','w','nw'];

var tile_dim_x = 32;
var tile_dim_y = 32;

var sprite_height = 32;
var sprite_width = 32;

var viewportTileWidth = 20;
var viewportTileHeight = 11;

var viewportHeight = 352;
var viewportWidth = 640;

function point2D(x,y){
    this.X = x;
    this.Y = y;
}

setInterval(regen,10000);

function regen(){
    tMCow.client.player.currentHP += 5;
    if(tMCow.client.player.currentHP > 100){
        tMCow.client.player.currentHP = 100;
    }
}

function intersectRectWalls(rect){

    var c =[];

    c[0] = tMCow.client.currentMap.getTile(rect.topleft.getTileX(),rect.topleft.getTileY());
    c[1] = tMCow.client.currentMap.getTile(rect.bottomleft.getTileX(),rect.bottomleft.getTileY());
    c[2] = tMCow.client.currentMap.getTile(rect.topright.getTileX(),rect.topright.getTileY());
    c[3] = tMCow.client.currentMap.getTile(rect.bottomright.getTileX(),rect.bottomright.getTileY());


    //staircheck

    for(i in c){
        if(c[i] == tMCow.tiles.TILE_TYPE_STAIRDOWN){
            if(standingOnStairs == 0){
                goDownStairs();
            }
            standingOnStairs = 1;break;
        }
        if(c[i] == tMCow.tiles.TILE_TYPE_STAIRUP){
            if(standingOnStairs == 0){
                goUpStairs();
            }
            standingOnStairs = 1;break;
        }

        //not standing on stairs
        standingOnStairs = 0;
    }


    for(i in c){

        if(c[i] == tMCow.tiles.TILE_TYPE_DOOR){
            tMCow.client.player.currentHP = 100;
        }

        if(c[i] != tMCow.tiles.TILE_TYPE_FLOOR
            && c[i] != tMCow.tiles.TILE_TYPE_DOOR
            && c[i] != tMCow.tiles.TILE_TYPE_DUNFLOOR
            && c[i] != tMCow.tiles.TILE_TYPE_STAIRDOWN
            && c[i] != tMCow.tiles.TILE_TYPE_STAIRUP){

            return true;
        }
    }

    return false;
}

// get bounding rectangle corner tile locations - hotspot is top left in world coords
function intersectCornerTiles(hotSpot,width,height){
    var retval = {};

    var trSpot = new point2D(hotSpot.X+width,hotSpot.Y);
    var brSpot = new point2D(hotSpot.X+width,hotSpot.Y+height);
    var blSpot = new point2D(hotSpot.X,hotSpot.Y+height);

    retval.topleft = new point2D(hotSpot.X,hotSpot.Y);
    retval.topright = new point2D(trSpot.X,trSpot.Y);
    retval.bottomright = new point2D(brSpot.X,brSpot.Y);
    retval.bottomleft = new point2D(blSpot.X,blSpot.Y);

    return retval;
}

point2D.prototype.getTileY = function(){
    return Math.floor(this.Y / tile_dim_y);    
}
point2D.prototype.getTileX = function(){
    return Math.floor(this.X / tile_dim_x);
}

viewportOrigin = new point2D(160,160);

//Canvas Manager constructor
function canvasManager(id){
	this.canvas = document.getElementById(id);
	this.context2D = this.canvas.getContext('2d');
	this.images = new Array();
	this.imageCount =0;
	this.imageLoadedCount =0;
	this.updateInterval = null;
	this.lastTime = (new Date()).getTime();
	this.fps = 0;
	this.trackFPS = 0;
}

//blank the canvas
canvasManager.prototype.clearCanvas = function(){
	this.context2D.clearRect(0,0,this.canvas.width,this.canvas.height);
}

//write some text
canvasManager.prototype.writeText = function(text,colour,x,y){
    this.context2D.strokeStyle = colour;
    this.context2D.font = '14px arial';
    this.context2D.textBaseline = 'bottom';
    this.context2D.strokeText(text, x, y);
}

//draw a filled rectangle
canvasManager.prototype.fillRectangle = function(x1,y1,x2,y2,r,g,b,a) {
	this.context2D.fillStyle = "rgba("+r+", "+g+", "+b+", "+a+")";
	this.context2D.fillRect(x1,y1,x2,y2);
}

//draw an image from the collection 
canvasManager.prototype.renderImage = function(imageName, dx, dy){
	
	if(imageName.length >0){
		var img = this.images[imageName];
		 this.context2D.drawImage(img,0,0,img.width,img.height,dx,dy,img.width,img.height);
	}
}

canvasManager.prototype.renderImageSlice = function(imageName, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight){
	var img = this.images[imageName];
	this.context2D.drawImage(img,sx,sy,sWidth,sHeight,dx,dy,dWidth,dHeight);
}

//Load an image into the collection
canvasManager.prototype.setImage = function(imageName,imageURL){
	var img = new Image();
	img.canvas = this;
	img.loaded = 0;
	img.name = imageName;
	img.onload = function() {this.loaded =1;};
	this.images[imageName] = img;
	img.loadURL = imageURL;	
	img.preload = function(){this.loaded=0;this.src=this.loadURL;this.canvas.imagePreloaded(this);};
	this.imageCount ++;
}

//preload all images
canvasManager.prototype.preLoadImages = function(){		
	for(var img in this.images){
		this.images[img].preload();
	}
}

//Handle the event of an image preloading
canvasManager.prototype.imagePreloaded = function(img){

	//debug
	//alert(img.name + " LOADED "+img.src+" "+img.width+ " x " + img.height);

	this.imageLoadedCount ++;
	if(this.imageCount == this.imageLoadedCount)
		this.onPreload();		
}

//To be overrided as needed.
canvasManager.prototype.onPreload = function(){;}

//#######################################################################
//intervals

//Draw function - override me!
canvasManager.prototype.onRender = function(){
	
}

//Every Update
canvasManager.prototype.onUpdate = function(){
	if(this.trackFPS ==1)
	{
		var now = (new Date()).getTime();	
		this.fps = 1000 / (now - cm.lastTime);
		this.lastTime = now;	
	}
}

//every update 0 OVERRIDE ME!!
canvasManager.prototype.update = function(){
	this.onUpdate();
}

canvasManager.prototype.render = function(){
	this.onRender();
}

canvasManager.prototype.start = function(renderSpeed,updateSpeed){
	window.addEventListener('keydown',doKeyDown,true);
    window.addEventListener('keyup',doKeyUp,true);
	this.updateInterval = setInterval(this.update,updateSpeed);
    this.updateInterval = setInterval(this.render,renderSpeed);
}

//#######################################################################
// test functions
tMCow.canvasInit = function()
{
	cm = new canvasManager("canvy");
	cm.canvas.width= viewportWidth;
	cm.canvas.height=viewportHeight;
	//init
	cm.onPreload = function(){cm.start(30,30);};
	cm.update = function(){cm.onUpdate();};
    cm.render = function(){cm.onRender();};
	cm.onRender = draw;
    cm.onUpdate = update;

    //monsters
    cm.setImage('rat','./img/rat.png');
    cm.setImage('kobold','./img/kobold.png');
    cm.setImage('orc','./img/orc.png');
    cm.setImage('skeleton','./img/skeleton.png');
    cm.setImage('balrog','./img/balrog.png');

    //eyecolours
    cm.setImage('eye_gold','./img/eyegold.png');
    cm.setImage('eye_blue','./img/eyeblue.png');
    cm.setImage('eye_cyan','./img/eyecyan.png');
    cm.setImage('eye_green','./img/eyegreen.png');
    cm.setImage('eye_orange','./img/eyeorange.png');
    cm.setImage('eye_pink','./img/eyepink.png');

    //eyes
    cm.setImage('eye_f','./img/eye_f.png');
    cm.setImage('eye_n','./img/eye_n.png');
    cm.setImage('eye_ne','./img/eye_ne.png');
    cm.setImage('eye_e','./img/eye_e.png');
    cm.setImage('eye_se','./img/eye_se.png');
    cm.setImage('eye_s','./img/eye_s.png');
    cm.setImage('eye_sw','./img/eye_sw.png');
    cm.setImage('eye_w','./img/eye_w.png');
    cm.setImage('eye_nw','./img/eye_nw.png');

    eyeFacingImageArray = ["eye_n","eye_ne","eye_e","eye_se","eye_s","eye_sw","eye_w","eye_nw"];

    //attacks
    cm.setImage('mele_n','./img/mele_n.png');
    cm.setImage('mele_ne','./img/mele_ne.png');
    cm.setImage('mele_e','./img/mele_e.png');
    cm.setImage('mele_se','./img/mele_se.png');
    cm.setImage('mele_s','./img/mele_s.png');
    cm.setImage('mele_sw','./img/mele_sw.png');
    cm.setImage('mele_w','./img/mele_w.png');
    cm.setImage('mele_nw','./img/mele_nw.png');

    attackDirectionImages = ['mele_n','mele_ne','mele_e','mele_se','mele_s','mele_sw','mele_w','mele_nw'];

    //mouths
    cm.setImage('mouth_happy','./img/mouth_happy.png');
    cm.setImage('mouth_neutral','./img/mouth_neutral.png');
    cm.setImage('mouth_sad','./img/mouth_sad.png');

    //skins
    cm.setImage('skin_blue','./img/skin_blue.png');
    cm.setImage('skin_red','./img/skin_red.png');

    //walls and floors
	cm.setImage('floor','./img/grass.png');
	cm.setImage('wall','./img/rock.png');
    cm.setImage('villagewall','./img/wall.png');
    cm.setImage('thatch','./img/thatch.png');
    cm.setImage('door','./img/door.png');
    cm.setImage('dunfloor','./img/dungeon_floor.png');
    cm.setImage('dunwall','./img/dungeon_wall.png');
    cm.setImage('stairdown','./img/stair_down.png');
    cm.setImage('stairup','./img/stair_up.png');


	cm.preLoadImages();	
	//cm.trackFPS = 1;

    // Where do I start?
    var startx,starty;
    startx =2;
    starty =5;

    viewportOrigin = new point2D(startx*tile_dim_x,starty*tile_dim_y);
    tMCow.client.logit(viewportOrigin);
}

keyState = {'UP':0,'DOWN':0,'LEFT':0,'RIGHT':0};

function setPlayerFacing(){
    if(keyState.UP==1 && keyState.LEFT==0 && keyState.RIGHT == 0){
        playerFacing = 0;
    }else if(keyState.UP==1 && keyState.RIGHT == 1){
        playerFacing = 1;
    }else if(keyState.UP==0 && keyState.DOWN ==0 && keyState.RIGHT == 1){
        playerFacing = 2;
    }else if(keyState.DOWN ==1 && keyState.RIGHT == 1){
        playerFacing = 3;
    }else if(keyState.DOWN ==1 && keyState.RIGHT == 0 && keyState.LEFT ==0){
        playerFacing = 4;
    }else if(keyState.DOWN ==1 && keyState.LEFT ==1){
        playerFacing = 5;
    }else if(keyState.DOWN ==0 && keyState.LEFT ==1 && keyState.UP ==0){
        playerFacing = 6;
    }else if(keyState.LEFT ==1 && keyState.UP ==1){
        playerFacing = 7;
    }

    tMCow.client.player.facing = playerFacing;
}

function getPlayerMovement(){

    var move = -1;

    if(keyState.UP==1 && keyState.LEFT==0 && keyState.RIGHT == 0){
        move= 0;
    }else if(keyState.UP==1 && keyState.RIGHT == 1){
        move= 1;
    }else if(keyState.UP==0 && keyState.DOWN ==0 && keyState.RIGHT == 1){
        move= 2;
    }else if(keyState.DOWN ==1 && keyState.RIGHT == 1){
        move= 3;
    }else if(keyState.DOWN ==1 && keyState.RIGHT == 0 && keyState.LEFT ==0){
        move= 4;
    }else if(keyState.DOWN ==1 && keyState.LEFT ==1){
        move= 5;
    }else if(keyState.DOWN ==0 && keyState.LEFT ==1 && keyState.UP ==0){
        move= 6;
    }else if(keyState.LEFT ==1 && keyState.UP ==1){
        move= 7;
    }else{
        move= -1;
    }

    if(move >-1){
        lastPlayerMovement = move;
    }

    return move;
}

function doKeyDown(evt){

    if(evt.keyCode == 32 && coolingDown == 0 ) {
		attack();
	}
	if(evt.keyCode == 38 || evt.keyCode == 87) {
		keyState.UP = 1;
	}
	if(evt.keyCode == 40 || evt.keyCode == 83) {
		keyState.DOWN =1;
	}
	if (evt.keyCode == 37 || evt.keyCode == 65){
		keyState.LEFT = 1;
	}
	if (evt.keyCode == 39 || evt.keyCode == 68){
		keyState.RIGHT = 1;
	}

    setPlayerFacing();
}

function doKeyUp(evt){

	if(evt.keyCode == 38 || evt.keyCode == 87) {
		keyState.UP = 0;
	}
	if(evt.keyCode == 40 || evt.keyCode == 83) {
		keyState.DOWN =0;
	}
	if (evt.keyCode == 37 || evt.keyCode == 65){
		keyState.LEFT = 0;
	}
	if (evt.keyCode == 39 || evt.keyCode == 68){
		keyState.RIGHT = 0;
	}

    setPlayerFacing();
}

function update()
{

    var absX = (tMCow.client.player.tileX*32) + tMCow.client.player.offsetX + 16;
    var absY = (tMCow.client.player.tileY*32) + tMCow.client.player.offsetY + 16;

    //monsters... ATTACK!
    if(monstersCoolingDown != 1){

        var monstersAttacked =0;

        //rats attack
        for(name in tMCow.client.rats){
            if(tMCow.client.rats[name] != null
                && tMCow.client.rats[name].length>0){
                var z = tMCow.client.rats[name][0];

                var zabsX = (z.tileX*32) + z.offsetX + 16;
                var zabsY = (z.tileY*32) + z.offsetY + 16;

                if(z.mapLevel == tMCow.client.player.mapLevel && distPythag(absX,absY,zabsX,zabsY) < 32+16){

                    monstersAttacked = 1;

                    var dam = getAttackDamage(z,tMCow.client.player);
                    tMCow.client.player.currentHP -= dam;

                    document.getElementById('eventbox').innerHTML += "<br/>" + name + " hits you " + getAttackName(dam);
                    document.getElementById('eventbox').scrollTop =document.getElementById('eventbox').scrollHeight;


                    if(tMCow.client.player.currentHP <= 0){
                        tMCow.client.iDied("a dirty rat");
                    }
                    updateStats();
                }
            }
        }
        //kobolds
        for(name in tMCow.client.kobolds){
            if(tMCow.client.kobolds[name] != null
                && tMCow.client.kobolds[name].length>0){
                var z = tMCow.client.kobolds[name][0];

                var zabsX = (z.tileX*32) + z.offsetX + 16;
                var zabsY = (z.tileY*32) + z.offsetY + 16;

                if(z.mapLevel == tMCow.client.player.mapLevel && distPythag(absX,absY,zabsX,zabsY) < 32+16){

                    monstersAttacked = 1;

                    var dam = getAttackDamage(z,tMCow.client.player);
                    tMCow.client.player.currentHP -= dam;

                    document.getElementById('eventbox').innerHTML += "<br/>" + name + " hits you " + getAttackName(dam);
                    document.getElementById('eventbox').scrollTop =document.getElementById('eventbox').scrollHeight;

                    if(tMCow.client.player.currentHP <= 0){
                        tMCow.client.iDied("a sneaky kobold");
                    }

                    updateStats();
                }
            }
        }
        //orcs
        for(name in tMCow.client.orcs){
            if(tMCow.client.orcs[name] != null
                && tMCow.client.orcs[name].length>0){
                var z = tMCow.client.orcs[name][0];

                var zabsX = (z.tileX*32) + z.offsetX + 16;
                var zabsY = (z.tileY*32) + z.offsetY + 16;

                if(z.mapLevel == tMCow.client.player.mapLevel && distPythag(absX,absY,zabsX,zabsY) < 32+16){

                    monstersAttacked = 1;

                    var dam = getAttackDamage(z,tMCow.client.player);
                    tMCow.client.player.currentHP -= dam;

                    document.getElementById('eventbox').innerHTML += "<br/>" + name + " hits you " + getAttackName(dam);
                    document.getElementById('eventbox').scrollTop =document.getElementById('eventbox').scrollHeight;

                    if(tMCow.client.player.currentHP <= 0){
                        tMCow.client.iDied("a brutish orc");
                    }

                    updateStats();
                }
            }
        }
        //skeletons
        for(name in tMCow.client.skeletons){
            if(tMCow.client.skeletons[name] != null
                && tMCow.client.skeletons[name].length>0){
                var z = tMCow.client.skeletons[name][0];

                var zabsX = (z.tileX*32) + z.offsetX + 16;
                var zabsY = (z.tileY*32) + z.offsetY + 16;

                if(z.mapLevel == tMCow.client.player.mapLevel && distPythag(absX,absY,zabsX,zabsY) < 32+16){

                    monstersAttacked = 1;

                    var dam = getAttackDamage(z,tMCow.client.player);
                    tMCow.client.player.currentHP -= dam;

                    document.getElementById('eventbox').innerHTML += "<br/>" + name + " hits you " + getAttackName(dam);
                    document.getElementById('eventbox').scrollTop =document.getElementById('eventbox').scrollHeight;

                    if(tMCow.client.player.currentHP <= 0){
                        tMCow.client.iDied("a creepy skeleton");
                    }

                    updateStats();
                }
            }
        }
        //balrogs
        for(name in tMCow.client.balrogs){
            if(tMCow.client.balrogs[name] != null
                && tMCow.client.balrogs[name].length>0){
                var z = tMCow.client.balrogs[name][0];

                var zabsX = (z.tileX*32) + z.offsetX + 16;
                var zabsY = (z.tileY*32) + z.offsetY + 16;

                if(z.mapLevel == tMCow.client.player.mapLevel && distPythag(absX,absY,zabsX,zabsY) < 32+16){

                    monstersAttacked = 1;

                    var dam = getAttackDamage(z,tMCow.client.player);
                    tMCow.client.player.currentHP -= dam;

                    document.getElementById('eventbox').innerHTML += "<br/>" + name + " hits you " + getAttackName(dam);
                    document.getElementById('eventbox').scrollTop =document.getElementById('eventbox').scrollHeight;

                    if(tMCow.client.player.currentHP <= 0){
                        tMCow.client.iDied("a mighty balrog");
                    }

                    updateStats();
                }
            }
        }

        if(monstersAttacked ==1){
            monstersCoolingDown =1;
            setTimeout("monstersCoolingDown=0",monsterAttackCooldown);
        }
    }

    nextServerSpam -= 1;
    if(nextServerSpam == 0){
        nextServerSpam = 60;

        // spam server
        tMCow.client.playerSendLocation();

    }

    //updates from server
    for(name in tMCow.client.otherPlayers){
        if(tMCow.client.otherPlayers[name] != null
                && tMCow.client.otherPlayers[name].length>1)
        tMCow.client.otherPlayers[name].shift(); // remove the oldest update
    }

    //update the player
    var move = getPlayerMovement();
    tMCow.client.player.moving = move;
    if(move <0) return;

    var xmove=0,ymove=0;

    if(move ==0){
        ymove -= playerMoveSpeed;
    }else if(move ==1){
        ymove -= playerMoveSpeedDiag;
        xmove += playerMoveSpeedDiag;
    }else if(move ==2){
        xmove += playerMoveSpeed;
    }else if(move ==3){
        ymove += playerMoveSpeedDiag;
        xmove += playerMoveSpeedDiag;
    }else if(move ==4){
        ymove += playerMoveSpeed;
    }else if(move ==5){
        ymove += playerMoveSpeedDiag;
        xmove -= playerMoveSpeedDiag;
    }else if(move ==6){
        xmove -= playerMoveSpeed;
    }else if(move ==7){
        ymove -= playerMoveSpeedDiag;
        xmove -= playerMoveSpeedDiag;
    }

    var diag =0;
    var yfailed =0;
    var xfailed=0;

    if(xmove !=0 && ymove!=0){
        diag =1;
    }

    var xtest = intersectCornerTiles(
            new point2D(
                    tMCow.client.player.tileX*32 + tMCow.client.player.offsetX + xmove + 6,
                    tMCow.client.player.tileY*32 + tMCow.client.player.offsetY + 6),20,20);

    var ytest = intersectCornerTiles(
            new point2D(
                    tMCow.client.player.tileX*32 + tMCow.client.player.offsetX + 6,
                    tMCow.client.player.tileY*32 + tMCow.client.player.offsetY + ymove + 6),20,20);

    if(intersectRectWalls(ytest)){
        yfailed =1;
        if(ymove<0){//hit some tiles going up, by how much?
            var over = (tMCow.client.player.tileY*32 + tMCow.client.player.offsetY +ymove+6) % 32;
            ymove += 32-over;
        }else if(ymove>0){//hit tiles going down
            var over = (tMCow.client.player.tileY*32 + tMCow.client.player.offsetY +ymove+26) % 32;
            ymove -= (over+1);
        }
    }
    if(intersectRectWalls(xtest)){
        xfailed =1;
        if(xmove<0){//hit some tiles going left, by how much?
            var over = (tMCow.client.player.tileX*32 + tMCow.client.player.offsetX +xmove+6) % 32;
            xmove += 32-over;
        }else if(xmove>0){//hit tiles going right
            var over = (tMCow.client.player.tileX*32 + tMCow.client.player.offsetX +xmove+26) % 32;
            xmove -= (over+1);
        }
    }

    if(yfailed==1 && xfailed ==0 && diag==1){
        if(xmove>0) xmove = playerMoveSpeed; else xmove = 0-playerMoveSpeed;
    }else if (yfailed==0 && xfailed ==1 && diag==1){
        if(ymove>0) ymove = playerMoveSpeed; else ymove = 0-playerMoveSpeed;
    }

    tMCow.client.player.offsetY += ymove;
    tMCow.client.player.offsetX += xmove;

    if(tMCow.client.player.offsetX <= -32){
        tMCow.client.player.tileX --;
        tMCow.client.player.offsetX +=32;
    }
    if(tMCow.client.player.offsetX >= 32){
        tMCow.client.player.tileX ++;
        tMCow.client.player.offsetX -=32;
    }
    if(tMCow.client.player.offsetY <= -32){
        tMCow.client.player.tileY --;
        tMCow.client.player.offsetY +=32;
    }
    if(tMCow.client.player.offsetY >= 32){
        tMCow.client.player.tileY ++;
        tMCow.client.player.offsetY -=32;
    }

    //if the player is moving outside the middle rect of the viewport and the viewport is able to move in the player's
    //direction, the viewport moves.

    if(tMCow.client.player.tileY < viewportOrigin.getTileY() +4
            && viewportOrigin.Y >0
            && ymove<0){
        viewportOrigin.Y +=ymove;
        if(viewportOrigin.Y<0){
            viewportOrigin.Y =0;
        }
    }else if(tMCow.client.player.tileY > viewportOrigin.getTileY() +6
            && viewportOrigin.Y < (tile_dim_y*tMCow.tiles.DEFAULT_WORLD_HEIGHT) - viewportHeight
            && ymove>0){
        viewportOrigin.Y +=ymove;
        if(viewportOrigin.Y>(tile_dim_y*tMCow.tiles.DEFAULT_WORLD_HEIGHT) - viewportHeight){
            viewportOrigin.Y =(tile_dim_y*tMCow.tiles.DEFAULT_WORLD_HEIGHT) - viewportHeight;
        }
    }

    if(tMCow.client.player.tileX < viewportOrigin.getTileX() +6
            && viewportOrigin.X >0
            && xmove<0){
        viewportOrigin.X += xmove;
        if(viewportOrigin.X<0){
            viewportOrigin.X =0;
        }
    }else if(tMCow.client.player.tileX > viewportOrigin.getTileX() +13
            && viewportOrigin.X < (tile_dim_x*tMCow.tiles.DEFAULT_WORLD_HEIGHT) - viewportWidth
            && xmove >0){
        viewportOrigin.X += xmove;
        if(viewportOrigin.X>(tile_dim_x*tMCow.tiles.DEFAULT_WORLD_HEIGHT) - viewportWidth){
            viewportOrigin.X =(tile_dim_y*tMCow.tiles.DEFAULT_WORLD_HEIGHT) - viewportWidth;
        }
    }

    var dead = 0;

    //finally tell server where we think we should be
    tMCow.client.playerSendLocation();
}

function distPythag(x1,y1,x2,y2){
    var opp = Math.abs(x1-x2);
    var adj = Math.abs(y1-y2);
    return Math.sqrt((opp*opp) + (adj*adj));
}

function draw()
{
   
    cm.clearCanvas();

    var tx = viewportOrigin.getTileX();
    var ty = viewportOrigin.getTileY();
    var offx = viewportOrigin.X % tile_dim_x;
    var offy = viewportOrigin.Y % tile_dim_y;

    var renderX =0 - offx; // the scrolling offset
    var renderY =0 - offy;

    var im = 'wall';

    for(var y =ty;y<ty+viewportTileHeight+1;y++){
        for(var x = tx;x<tx+viewportTileWidth+1;x++){
            if(x<tMCow.tiles.DEFAULT_WORLD_HEIGHT && y<tMCow.tiles.DEFAULT_WORLD_HEIGHT){
                if(tMCow.client.currentMap.getTile(x,y) == tMCow.tiles.TILE_TYPE_FLOOR){
                    im = 'floor'
                }else if(tMCow.client.currentMap.getTile(x,y) == tMCow.tiles.TILE_TYPE_WALL){
                    im = 'wall'
                }else if(tMCow.client.currentMap.getTile(x,y) == tMCow.tiles.TILE_TYPE_VILLAGEWALL){
                    im = 'villagewall'
                }else if(tMCow.client.currentMap.getTile(x,y) == tMCow.tiles.TILE_TYPE_THATCH){
                    im = 'thatch'
                }else if(tMCow.client.currentMap.getTile(x,y) == tMCow.tiles.TILE_TYPE_DOOR){
                    im = 'door'
                }else if(tMCow.client.currentMap.getTile(x,y) == tMCow.tiles.TILE_TYPE_DUNFLOOR){
                    im = 'dunfloor'
                }else if(tMCow.client.currentMap.getTile(x,y) == tMCow.tiles.TILE_TYPE_DUNWALL){
                    im = 'dunwall'
                }else if(tMCow.client.currentMap.getTile(x,y) == tMCow.tiles.TILE_TYPE_STAIRDOWN){
                    im = 'stairdown'
                }else if(tMCow.client.currentMap.getTile(x,y) == tMCow.tiles.TILE_TYPE_STAIRUP){
                    im = 'stairup'
                }

                //draw tiles
                //tMCow.client.logit("about to draw "+x+" : "+y+" at "+renderX+" : "+renderY);
                cm.renderImage(im,renderX,renderY);
                renderX += tile_dim_x;
            }
        }
        renderY += tile_dim_y;
        renderX =0 - offx;
    }

    var activePlayerList = document.getElementById("divActivePlayers");
    activePlayerList.innerHTML = tMCow.client.player.name + "<br/>";


    var deadrats = [];
    var deadorcs = [];
    var deadkobolds = [];
    var deadbalrogs = [];
    var deadskeletons = [];

    //draw any monsties
    //rats
    for(name in tMCow.client.rats){
        if(tMCow.client.rats[name] != null
            && tMCow.client.rats[name].length>0){
            var z = tMCow.client.rats[name][0];

            if(z.currentHP <=0){
                deadrats.push(name);
            }

            //is z in viewport?
            if(z.tileX >= viewportOrigin.getTileX()
                && z.tileX <= viewportOrigin.getTileX() +20
                && z.tileY >= viewportOrigin.getTileY()
                && z.tileY <= viewportOrigin.getTileY()+11
                && z.mapLevel == tMCow.client.player.mapLevel){

                cm.renderImage('rat',
                    (z.tileX*tile_dim_x) +z.offsetX - viewportOrigin.X,
                    (z.tileY*tile_dim_y) +z.offsetY - viewportOrigin.Y);

                var mpx = (z.tileX*tile_dim_x) +z.offsetX - viewportOrigin.X;
                var mpy = (z.tileY*tile_dim_y) +z.offsetY - viewportOrigin.Y;

                var mbar_y = opy;
                var mtext_y = opy;
                var minner_y = opy;
                var mgreenlength = 30 * (z.currentHP / z.maxHP);

                if(z.attackDirection == 7 || z.attackDirection == 0 || z.attackDirection == 1){
                    mbar_y = mpy+34;
                    minner_y = mpy + 35;
                    mtext_y = mpy + 46 + 12;
                }else{
                    mbar_y = mpy - 13;
                    minner_y = mpy - 12;
                    mtext_y = mpy - 17;
                }

                cm.fillRectangle(mpx,mbar_y,32,8,150,0,0,1);
                cm.fillRectangle(mpx+1,minner_y,mgreenlength,6,0,200,0,1);
                cm.writeText(z.name,'#ff0000',mpx,mtext_y);
            }
        }
    }

    //kobolds
    for(name in tMCow.client.kobolds){
        if(tMCow.client.kobolds[name] != null
            && tMCow.client.kobolds[name].length>0){
            var z = tMCow.client.kobolds[name][0];

            if(z.currentHP <=0){
                deadkobolds.push(name);
            }

            //is z in viewport?
            if(z.tileX >= viewportOrigin.getTileX()
                && z.tileX <= viewportOrigin.getTileX() +20
                && z.tileY >= viewportOrigin.getTileY()
                && z.tileY <= viewportOrigin.getTileY()+11
                && z.mapLevel == tMCow.client.player.mapLevel){

                cm.renderImage('kobold',
                    (z.tileX*tile_dim_x) +z.offsetX - viewportOrigin.X,
                    (z.tileY*tile_dim_y) +z.offsetY - viewportOrigin.Y);

                var mpx = (z.tileX*tile_dim_x) +z.offsetX - viewportOrigin.X;
                var mpy = (z.tileY*tile_dim_y) +z.offsetY - viewportOrigin.Y;

                var mbar_y = opy;
                var mtext_y = opy;
                var minner_y = opy;
                var mgreenlength = 30 * (z.currentHP / z.maxHP);

                if(z.attackDirection == 7 || z.attackDirection == 0 || z.attackDirection == 1){
                    mbar_y = mpy+34;
                    minner_y = mpy + 35;
                    mtext_y = mpy + 46 + 12;
                }else{
                    mbar_y = mpy - 13;
                    minner_y = mpy - 12;
                    mtext_y = mpy - 17;
                }

                cm.fillRectangle(mpx,mbar_y,32,8,150,0,0,1);
                cm.fillRectangle(mpx+1,minner_y,mgreenlength,6,0,200,0,1);
                cm.writeText(z.name,'#ff0000',mpx,mtext_y);
            }
        }
    }

    //orcs
    for(name in tMCow.client.orcs){
        if(tMCow.client.orcs[name] != null
            && tMCow.client.orcs[name].length>0){
            var z = tMCow.client.orcs[name][0];

            if(z.currentHP <=0){
                deadorcs.push(name);
            }

            //is z in viewport?
            if(z.tileX >= viewportOrigin.getTileX()
                && z.tileX <= viewportOrigin.getTileX() +20
                && z.tileY >= viewportOrigin.getTileY()
                && z.tileY <= viewportOrigin.getTileY()+11
                && z.mapLevel == tMCow.client.player.mapLevel){

                cm.renderImage('orc',
                    (z.tileX*tile_dim_x) +z.offsetX - viewportOrigin.X,
                    (z.tileY*tile_dim_y) +z.offsetY - viewportOrigin.Y);

                var mpx = (z.tileX*tile_dim_x) +z.offsetX - viewportOrigin.X;
                var mpy = (z.tileY*tile_dim_y) +z.offsetY - viewportOrigin.Y;

                var mbar_y = opy;
                var mtext_y = opy;
                var minner_y = opy;
                var mgreenlength = 30 * (z.currentHP / z.maxHP);

                if(z.attackDirection == 7 || z.attackDirection == 0 || z.attackDirection == 1){
                    mbar_y = mpy+34;
                    minner_y = mpy + 35;
                    mtext_y = mpy + 46 + 12;
                }else{
                    mbar_y = mpy - 13;
                    minner_y = mpy - 12;
                    mtext_y = mpy - 17;
                }

                cm.fillRectangle(mpx,mbar_y,32,8,150,0,0,1);
                cm.fillRectangle(mpx+1,minner_y,mgreenlength,6,0,200,0,1);
                cm.writeText(z.name,'#ff0000',mpx,mtext_y);
            }
        }
    }

    //skeletons
    for(name in tMCow.client.skeletons){
        if(tMCow.client.skeletons[name] != null
            && tMCow.client.skeletons[name].length>0){
            var z = tMCow.client.skeletons[name][0];

            if(z.currentHP <=0){
                deadskeletons.push(name);
            }

            //is z in viewport?
            if(z.tileX >= viewportOrigin.getTileX()
                && z.tileX <= viewportOrigin.getTileX() +20
                && z.tileY >= viewportOrigin.getTileY()
                && z.tileY <= viewportOrigin.getTileY()+11
                && z.mapLevel == tMCow.client.player.mapLevel){

                cm.renderImage('skeleton',
                    (z.tileX*tile_dim_x) +z.offsetX - viewportOrigin.X,
                    (z.tileY*tile_dim_y) +z.offsetY - viewportOrigin.Y);

                var mpx = (z.tileX*tile_dim_x) +z.offsetX - viewportOrigin.X;
                var mpy = (z.tileY*tile_dim_y) +z.offsetY - viewportOrigin.Y;

                var mbar_y = opy;
                var mtext_y = opy;
                var minner_y = opy;
                var mgreenlength = 30 * (z.currentHP / z.maxHP);

                if(z.attackDirection == 7 || z.attackDirection == 0 || z.attackDirection == 1){
                    mbar_y = mpy+34;
                    minner_y = mpy + 35;
                    mtext_y = mpy + 46 + 12;
                }else{
                    mbar_y = mpy - 13;
                    minner_y = mpy - 12;
                    mtext_y = mpy - 17;
                }

                cm.fillRectangle(mpx,mbar_y,32,8,150,0,0,1);
                cm.fillRectangle(mpx+1,minner_y,mgreenlength,6,0,200,0,1);
                cm.writeText(z.name,'#ff0000',mpx,mtext_y);
            }
        }
    }

    //balrogs
    for(name in tMCow.client.balrogs){
        if(tMCow.client.balrogs[name] != null
            && tMCow.client.balrogs[name].length>0){
            var z = tMCow.client.balrogs[name][0];

            if(z.currentHP <=0){
                deadbalrogs.push(name);
            }

            //is z in viewport?
            if(z.tileX >= viewportOrigin.getTileX()
                && z.tileX <= viewportOrigin.getTileX() +20
                && z.tileY >= viewportOrigin.getTileY()
                && z.tileY <= viewportOrigin.getTileY()+11
                && z.mapLevel == tMCow.client.player.mapLevel){

                cm.renderImage('balrog',
                    (z.tileX*tile_dim_x) +z.offsetX - viewportOrigin.X,
                    (z.tileY*tile_dim_y) +z.offsetY - viewportOrigin.Y);

                var mpx = (z.tileX*tile_dim_x) +z.offsetX - viewportOrigin.X;
                var mpy = (z.tileY*tile_dim_y) +z.offsetY - viewportOrigin.Y;

                var mbar_y = opy;
                var mtext_y = opy;
                var minner_y = opy;
                var mgreenlength = 30 * (z.currentHP / z.maxHP);

                if(z.attackDirection == 7 || z.attackDirection == 0 || z.attackDirection == 1){
                    mbar_y = mpy+34;
                    minner_y = mpy + 35;
                    mtext_y = mpy + 46 + 12;
                }else{
                    mbar_y = mpy - 13;
                    minner_y = mpy - 12;
                    mtext_y = mpy - 17;
                }

                cm.fillRectangle(mpx,mbar_y,32,8,150,0,0,1);
                cm.fillRectangle(mpx+1,minner_y,mgreenlength,6,0,200,0,1);
                cm.writeText(z.name,'#ff0000',mpx,mtext_y);
            }
        }
    }

    //remove any dead rats
    for(var deadrat in deadrats){
        delete tMCow.client.rats[deadrats[deadrat]];
    }
    //remove any dead kobolds
    for(var deadkobold in deadkobolds){
        delete tMCow.client.kobolds[deadkobolds[deadkobold]];
    }
    //remove any dead orc
    for(var deadorc in deadorcs){
        delete tMCow.client.orcs[deadorcs[deadorc]];
    }
    //remove any dead skeletons
    for(var deadskeleton in deadskeletons){
        delete tMCow.client.orcs[deadskeletons[deadskeleton]];
    }
    //remove any dead balrogs
    for(var deadbalrog in deadbalrogs){
        delete tMCow.client.balrogs[deadbalrogs[deadbalrog]];
    }

    //draw other players
    for(name in tMCow.client.otherPlayers){
        if(tMCow.client.otherPlayers[name] != null
                && tMCow.client.otherPlayers[name].length>0){
            var p = tMCow.client.otherPlayers[name][0];

            activePlayerList.innerHTML += p.name + "<br/>";

            //is p in viewport?
            if(p.tileX >= viewportOrigin.getTileX()
                && p.tileX <= viewportOrigin.getTileX() +20
                && p.tileY >= viewportOrigin.getTileY()
                && p.tileY <= viewportOrigin.getTileY()+11
                && p.mapLevel == tMCow.client.player.mapLevel){


                var opx = (p.tileX*tile_dim_x) +p.offsetX - viewportOrigin.X;
                var opy = (p.tileY*tile_dim_y) +p.offsetY - viewportOrigin.Y;

                cm.renderImage('skin_red',opx,opy);
                cm.renderImage('eye_green',opx,opy);
                if(p.moving<0){
                    cm.renderImage('eye_f',opx,opy);
                }else{
                    cm.renderImage(eyeFacingImageArray[p.facing],opx,opy);
                }
                cm.renderImage('mouth_happy',opx,opy);


                var obar_y = opy;
                var otext_y = opy;
                var oinner_y = opy;
                var ogreenlength = 30 * (p.currentHP / p.maxHP);

                if(p.attackDirection == 7 || p.attackDirection == 0 || p.attackDirection == 1){
                    obar_y = opy+34;
                    oinner_y = opy + 35;
                    otext_y = opy + 46 + 12;
                }else{
                    obar_y = opy - 13;
                    oinner_y = opy - 12;
                    otext_y = opy - 17;
                }

                cm.fillRectangle(opx,obar_y,32,8,150,0,0,1);
                cm.fillRectangle(opx+1,oinner_y,ogreenlength,6,0,200,0,1);
                cm.writeText(p.name,'#777777',opx,otext_y);

                if(p.attackDirection > -1){

                    var oax = opx;
                    var oay = opy;

                    switch(p.attackDirection){
                        case 0: oay -= tile_dim_y; break;
                        case 1: oay -= tile_dim_y/1.2; oax += tile_dim_x/1.2; break;
                        case 2: oax += tile_dim_x; break;
                        case 3: oax += tile_dim_x/1.2; oay += tile_dim_y/1.2; break;
                        case 4: oay += tile_dim_y; break;
                        case 5: oay += tile_dim_y/1.2; oax -= tile_dim_x/1.2; break;
                        case 6: oax -= tile_dim_x; break;
                        case 7: oay -= tile_dim_y/1.2; oax -= tile_dim_x/1.2; break;
                    }

                    cm.renderImage(attackDirectionImages[p.attackDirection],oax,oay);
                }
            }
        }
    }

    //draw player
    //cm.renderImage('man_b'+'_'+facingDirections[playerFacing]
//            +'_m_n',
//            (tMCow.client.player.tileX*tile_dim_x) +tMCow.client.player.offsetX - viewportOrigin.X,
//            (tMCow.client.player.tileY*tile_dim_y) +tMCow.client.player.offsetY - viewportOrigin.Y);

    var px = (tMCow.client.player.tileX*tile_dim_x) +tMCow.client.player.offsetX - viewportOrigin.X;
    var py = (tMCow.client.player.tileY*tile_dim_y) +tMCow.client.player.offsetY - viewportOrigin.Y;

    cm.renderImage('skin_blue',px,py);
    cm.renderImage('eye_green',px,py);
    if(getPlayerMovement()<0){
        cm.renderImage('eye_f',px,py);
    }else{
        cm.renderImage(eyeFacingImageArray[playerFacing],px,py);
    }
    cm.renderImage('mouth_happy',px,py);


    //player's health bar and name

    var bar_y = py;
    var text_y = py;
    var inner_y = py;
    var greenlength = 30 * (tMCow.client.player.currentHP / tMCow.client.player.maxHP);

    if(lastAttackDirection == 7 || lastAttackDirection == 0 || lastAttackDirection == 1){
        bar_y = py+34;
        inner_y = py + 35;
        text_y = py + 46 + 12;
    }else{
        bar_y = py - 13;
        inner_y = py - 12;
        text_y = py - 17;
    }

    cm.fillRectangle(px,bar_y,32,8,150,0,0,1);
    cm.fillRectangle(px+1,inner_y,greenlength,6,0,200,0,1);
    cm.writeText(tMCow.client.player.name,'#333333',px,text_y);

    //is player attacking?
    if(attacking == 1){

        var ax = (tMCow.client.player.tileX*tile_dim_x) +tMCow.client.player.offsetX - viewportOrigin.X;
        var ay = (tMCow.client.player.tileY*tile_dim_y) +tMCow.client.player.offsetY - viewportOrigin.Y;

        switch(tMCow.client.player.attackDirection){
            case 0: ay -= tile_dim_y; break;
            case 1: ay -= tile_dim_y/1.2; ax += tile_dim_x/1.2; break;
            case 2: ax += tile_dim_x; break;
            case 3: ax += tile_dim_x/1.2; ay += tile_dim_y/1.2; break;
            case 4: ay += tile_dim_y; break;
            case 5: ay += tile_dim_y/1.2; ax -= tile_dim_x/1.2; break;
            case 6: ax -= tile_dim_x; break;
            case 7: ay -= tile_dim_y/1.2; ax -= tile_dim_x/1.2; break;
        }

        cm.renderImage(attackDirectionImages[tMCow.client.player.attackDirection],ax,ay);
    }
}

lastAttackDirection = -1;

function length2D(x1,y1,x2,y2)
{
	var opp = y2-y1;
	var adj = x2-x1;
	var hypsqr = (opp*opp) + (adj*adj);
	var hyp = Math.sqrt(hypsqr);
		
	return hyp;
}

function attack(){
    attacking = 1;
    coolingDown =1;
    tMCow.client.player.attackDirection = lastPlayerMovement;
    lastAttackDirection = tMCow.client.player.attackDirection;

    setTimeout(attackTimeoutFunction,attackDuration);
    setTimeout(cooldownTimeoutFunction,attackCooldown);

    //Did this attack hit anything?

    var absX = (tMCow.client.player.tileX*32) + tMCow.client.player.offsetX + 16;
    var absY = (tMCow.client.player.tileY*32) + tMCow.client.player.offsetY + 16;

    for(name in tMCow.client.rats){
        if(tMCow.client.rats[name] != null
            && tMCow.client.rats[name].length>0){
            var z = tMCow.client.rats[name][0];

            var zabsX = (z.tileX*32) + z.offsetX + 16;
            var zabsY = (z.tileY*32) + z.offsetY + 16;

            var diffx = Math.abs(zabsX - absX);
            var diffy = Math.abs(zabsY - absY);

            if(z.mapLevel == tMCow.client.player.mapLevel && distPythag(absX,absY,zabsX,zabsY) < 32+16){

                //monster in the right sector?

                var direction_ok = 0;

                if(distPythag(absX,absY,zabsX,zabsY) > 16){

                    if(tMCow.client.player.attackDirection == 0){
                        if(zabsY < absY && diffx < 16){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 1){
                        if(zabsY < absY && zabsX > absX){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 2){
                        if(zabsX > absX && diffy < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 3){
                        if(zabsY > absY && zabsX > absX){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 4){
                        if(zabsY > absY && diffx < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 5){
                        if(zabsX < absX && zabsY> absY){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 6){
                        if(zabsX < absX && diffy < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 7){
                        if(zabsX < absX && zabsY < absX){
                            direction_ok = 1;
                        }
                    }
                }else{
                    direction_ok =1;
                }

                if(direction_ok ==1){
                    var dam = getAttackDamage(tMCow.client.player,z);
                    z.currentHP -= dam;

                    document.getElementById('eventbox').innerHTML += "<br/>You hit " + name + " " + getAttackName(dam);
                    document.getElementById('eventbox').scrollTop =document.getElementById('eventbox').scrollHeight;

                    tMCow.client.player.exp += Math.floor(z.exp * (dam / 100));
                    tMCow.client.iHitOne(z.name,"rat",dam);

                    var attexp = 20;
                    var defexp = 15;

                    var level= 0;

                    while(level<20){

                        if(tMCow.client.player.exp > attexp){
                            tMCow.client.player.attackLevel = 2 + level;
                        }
                        if(tMCow.client.player.exp > defexp){
                            tMCow.client.player.defendLevel = 2 + level;
                        }

                        attexp *= 2.6;
                        defexp *= 2.9;

                        level++;
                    }
                }
            }
        }
    }

    //kobolds
    for(name in tMCow.client.kobolds){
        if(tMCow.client.kobolds[name] != null
            && tMCow.client.kobolds[name].length>0){
            var z = tMCow.client.kobolds[name][0];

            var zabsX = (z.tileX*32) + z.offsetX + 16;
            var zabsY = (z.tileY*32) + z.offsetY + 16;

            var diffx = Math.abs(zabsX - absX);
            var diffy = Math.abs(zabsY - absY);

            if(z.mapLevel == tMCow.client.player.mapLevel && distPythag(absX,absY,zabsX,zabsY) < 32+16){

                //monster in the right sector?

                var direction_ok = 0;

                if(distPythag(absX,absY,zabsX,zabsY) > 16){

                    if(tMCow.client.player.attackDirection == 0){
                        if(zabsY < absY && diffx < 16){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 1){
                        if(zabsY < absY && zabsX > absX){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 2){
                        if(zabsX > absX && diffy < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 3){
                        if(zabsY > absY && zabsX > absX){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 4){
                        if(zabsY > absY && diffx < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 5){
                        if(zabsX < absX && zabsY> absY){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 6){
                        if(zabsX < absX && diffy < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 7){
                        if(zabsX < absX && zabsY < absX){
                            direction_ok = 1;
                        }
                    }
                }else{
                    direction_ok =1;
                }

                if(direction_ok ==1){
                    var dam = getAttackDamage(tMCow.client.player,z);
                    z.currentHP -= dam;

                    document.getElementById('eventbox').innerHTML += "<br/>You hit " + name + " " + getAttackName(dam);
                    document.getElementById('eventbox').scrollTop =document.getElementById('eventbox').scrollHeight;

                    tMCow.client.player.exp += Math.floor(z.exp * (dam / 100));
                    tMCow.client.iHitOne(z.name,"kobold",dam);
                }
            }
        }
    }

    //orcs
    for(name in tMCow.client.orcs){
        if(tMCow.client.orcs[name] != null
            && tMCow.client.orcs[name].length>0){
            var z = tMCow.client.orcs[name][0];

            var zabsX = (z.tileX*32) + z.offsetX + 16;
            var zabsY = (z.tileY*32) + z.offsetY + 16;

            var diffx = Math.abs(zabsX - absX);
            var diffy = Math.abs(zabsY - absY);

            if(z.mapLevel == tMCow.client.player.mapLevel && distPythag(absX,absY,zabsX,zabsY) < 32+16){

                //monster in the right sector?

                var direction_ok = 0;

                if(distPythag(absX,absY,zabsX,zabsY) > 16){

                    if(tMCow.client.player.attackDirection == 0){
                        if(zabsY < absY && diffx < 16){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 1){
                        if(zabsY < absY && zabsX > absX){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 2){
                        if(zabsX > absX && diffy < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 3){
                        if(zabsY > absY && zabsX > absX){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 4){
                        if(zabsY > absY && diffx < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 5){
                        if(zabsX < absX && zabsY> absY){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 6){
                        if(zabsX < absX && diffy < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 7){
                        if(zabsX < absX && zabsY < absX){
                            direction_ok = 1;
                        }
                    }
                }else{
                    direction_ok =1;
                }

                if(direction_ok ==1){
                    var dam = getAttackDamage(tMCow.client.player,z);
                    z.currentHP -= dam;

                    document.getElementById('eventbox').innerHTML += "<br/>You hit " + name + " " + getAttackName(dam);
                    document.getElementById('eventbox').scrollTop =document.getElementById('eventbox').scrollHeight;

                    tMCow.client.player.exp += Math.floor(z.exp * (dam / 100));
                    tMCow.client.iHitOne(z.name,"orc",dam);
                }
            }
        }
    }

    //skeletons
    for(name in tMCow.client.skeletons){
        if(tMCow.client.skeletons[name] != null
            && tMCow.client.skeletons[name].length>0){
            var z = tMCow.client.skeletons[name][0];

            var zabsX = (z.tileX*32) + z.offsetX + 16;
            var zabsY = (z.tileY*32) + z.offsetY + 16;

            var diffx = Math.abs(zabsX - absX);
            var diffy = Math.abs(zabsY - absY);

            if(z.mapLevel == tMCow.client.player.mapLevel && distPythag(absX,absY,zabsX,zabsY) < 32+16){

                //monster in the right sector?

                var direction_ok = 0;

                if(distPythag(absX,absY,zabsX,zabsY) > 16){

                    if(tMCow.client.player.attackDirection == 0){
                        if(zabsY < absY && diffx < 16){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 1){
                        if(zabsY < absY && zabsX > absX){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 2){
                        if(zabsX > absX && diffy < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 3){
                        if(zabsY > absY && zabsX > absX){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 4){
                        if(zabsY > absY && diffx < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 5){
                        if(zabsX < absX && zabsY> absY){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 6){
                        if(zabsX < absX && diffy < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 7){
                        if(zabsX < absX && zabsY < absX){
                            direction_ok = 1;
                        }
                    }
                }else{
                    direction_ok =1;
                }

                if(direction_ok ==1){
                    var dam = getAttackDamage(tMCow.client.player,z);
                    z.currentHP -= dam;

                    document.getElementById('eventbox').innerHTML += "<br/>You hit " + name + " " + getAttackName(dam);
                    document.getElementById('eventbox').scrollTop =document.getElementById('eventbox').scrollHeight;

                    tMCow.client.player.exp += Math.floor(z.exp * (dam / 100));
                    tMCow.client.iHitOne(z.name,"skeleton",dam);
                }
            }
        }
    }

    //balrogs
    for(name in tMCow.client.balrogs){
        if(tMCow.client.balrogs[name] != null
            && tMCow.client.balrogs[name].length>0){
            var z = tMCow.client.balrogs[name][0];

            var zabsX = (z.tileX*32) + z.offsetX + 16;
            var zabsY = (z.tileY*32) + z.offsetY + 16;

            var diffx = Math.abs(zabsX - absX);
            var diffy = Math.abs(zabsY - absY);

            if(z.mapLevel == tMCow.client.player.mapLevel && distPythag(absX,absY,zabsX,zabsY) < 32+16){

                //monster in the right sector?

                var direction_ok = 0;

                if(distPythag(absX,absY,zabsX,zabsY) > 16){

                    if(tMCow.client.player.attackDirection == 0){
                        if(zabsY < absY && diffx < 16){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 1){
                        if(zabsY < absY && zabsX > absX){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 2){
                        if(zabsX > absX && diffy < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 3){
                        if(zabsY > absY && zabsX > absX){
                            direction_ok = 1;
                        }
                    }else if(tMCow.client.player.attackDirection == 4){
                        if(zabsY > absY && diffx < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 5){
                        if(zabsX < absX && zabsY> absY){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 6){
                        if(zabsX < absX && diffy < 16){
                            direction_ok =1;
                        }
                    }else if(tMCow.client.player.attackDirection == 7){
                        if(zabsX < absX && zabsY < absX){
                            direction_ok = 1;
                        }
                    }
                }else{
                    direction_ok =1;
                }

                if(direction_ok ==1){
                    var dam = getAttackDamage(tMCow.client.player,z);
                    z.currentHP -= dam;

                    document.getElementById('eventbox').innerHTML += "<br/>You hit " + name + " " + getAttackName(dam);
                    document.getElementById('eventbox').scrollTop =document.getElementById('eventbox').scrollHeight;

                    tMCow.client.player.exp += Math.floor(z.exp * (dam / 100));
                    tMCow.client.iHitOne(z.name,"balrog",dam);
                }
            }
        }
    }
}

function attackTimeoutFunction(){
    attacking = 0;
    tMCow.client.player.attackDirection = -1;
}

function cooldownTimeoutFunction(){
    coolingDown = 0;
}

function updateStats(){

    var playerAge = 18 + year-tMCow.client.player.birthYear;
    if(season < tMCow.client.player.birthSeason){
        playerAge -=1;
    }

    document.getElementById('divName').innerHTML = tMCow.client.player.name;
    document.getElementById('divAge').innerHTML =  playerAge;
    document.getElementById('divHP').innerHTML = "" + tMCow.client.player.currentHP + " / " + tMCow.client.player.maxHP;
    document.getElementById('divGold').innerHTML = tMCow.client.player.gold;
    document.getElementById('divEXP').innerHTML = tMCow.client.player.exp;
    document.getElementById('divAttack').innerHTML = tMCow.client.player.attackLevel;
    document.getElementById('divDefend').innerHTML = tMCow.client.player.defendLevel;
}

function goUpStairs(){
    tMCow.client.player.mapLevel --;
    tMCow.client.currentMap = tMCow.client.worldMapArray[tMCow.client.player.mapLevel];

    //hardcoded stuff
    if(tMCow.client.player.mapLevel == 0){
        tMCow.client.player.tileX = 6;
        tMCow.client.player.tileY = 19;
        tMCow.client.player.offsetX =0;
        tMCow.client.player.offsetY =0;
    }
    if(tMCow.client.player.mapLevel == 1){
        tMCow.client.player.tileX = 22;
        tMCow.client.player.tileY = 3;
        tMCow.client.player.offsetX =0;
        tMCow.client.player.offsetY =0;
    }
    if(tMCow.client.player.mapLevel == 2){
        tMCow.client.player.tileX = 12;
        tMCow.client.player.tileY = 17;
        tMCow.client.player.offsetX =0;
        tMCow.client.player.offsetY =0;
    }
    if(tMCow.client.player.mapLevel == 3){
        tMCow.client.player.tileX = 12;
        tMCow.client.player.tileY = 14;
        tMCow.client.player.offsetX =0;
        tMCow.client.player.offsetY =0;
    }
}

function goDownStairs(){
    tMCow.client.player.mapLevel ++;
    tMCow.client.currentMap = tMCow.client.worldMapArray[tMCow.client.player.mapLevel];

    if(tMCow.client.player.mapLevel == 1){
        tMCow.client.player.tileX = 7;
        tMCow.client.player.tileY = 20;
        tMCow.client.player.offsetX =0;
        tMCow.client.player.offsetY =0;
    }
    if(tMCow.client.player.mapLevel == 2){
        tMCow.client.player.tileX = 22;
        tMCow.client.player.tileY = 3;
        tMCow.client.player.offsetX =0;
        tMCow.client.player.offsetY =0;
    }
    if(tMCow.client.player.mapLevel == 3){
        tMCow.client.player.tileX = 12;
        tMCow.client.player.tileY = 19;
        tMCow.client.player.offsetX =0;
        tMCow.client.player.offsetY =0;
    }
    if(tMCow.client.player.mapLevel == 4){
        tMCow.client.player.tileX = 12;
        tMCow.client.player.tileY = 14;
        tMCow.client.player.offsetX =0;
        tMCow.client.player.offsetY =0;
    }
}

function getAttackDamage(attacker, defender){
    skillFactor = attacker.attackLevel / defender.defendLevel;
    randomFactor = Math.random() * 10;
    return Math.floor(skillFactor * randomFactor);
}

function getAttackName(dam){
    if(dam > 90){
        return "for great justice!";
    }else if (dam >80){
        return "with an AWESOME blow.";
    }else if (dam >70){
        return "FTW!";
    }else if (dam >60){
        return "like a BOSS.";
    }else if (dam >50){
        return "with tremendous force.";
    }else if (dam >35){
        return "doing critical damage.";
    }else if (dam >25){
        return "very hard indeed.";
    }else if (dam >18){
        return "rather hard.";
    }else if (dam >12){
        return "quite hard.";
    }else if (dam >10){
        return "but not very hard.";
    }else if (dam >8){
        return "quite weakly.";
    }else if (dam >4){
        return "very weakly.";
    }else if (dam >2){
        return "pathetically.";
    }else if (dam >1){
        return "feebly.";
    }else if (dam <= 1){
        return "ineffectually.";
    }
    return "somehow defying the laws of logic!!";
}













