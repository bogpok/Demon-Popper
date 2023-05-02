/** @type {HTMLCanvasElement} */

const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 540;
canvas.height = 960;

const collisionCanv = document.getElementById('collCanv');
const collisionCtx = collisionCanv.getContext('2d', { willReadFrequently: true });

collisionCanv.width = 540;
collisionCanv.height = 960;

const assetsUrl = './assets/';
const demonSrc = assetsUrl+'demon-idle.png';
const fireSrc = assetsUrl+'breath.png';
const cemeteryUrl = assetsUrl+'bg/';
const clinkSNDSrc = assetsUrl + 'Match_striking.wav'

// compensate positions between mouse and canvas
let canvasPosition = canvas.getBoundingClientRect();

let gameSpeed = 1;
let gameFrame = 0;

let score = 0;



class Layer {
    
    constructor(imgSrc, widthOrig, heightOrig, width = 0, height = 0, k = 1) {
        
        this.img = new Image();
        this.img.src = imgSrc;
        this.widthOrig = widthOrig;
        this.heightOrig = heightOrig;
        this.width = width;
        this.height = height;     


        this.k = k
        this.speed = gameSpeed*this.k;

        this.x1 = 0;
        this.y = 0;

        this.frameWidth = canvas.width;
        this.frames_n =  Math.ceil(this.frameWidth/this.width)*2

    }

    setPropHeight () {
        // depends on width
        this.height = Math.floor(this.width/this.widthOrig*this.heightOrig);
    }

    advanceImage = () => {         
        
        for (let i = 0; i < this.frames_n; i++) {
            ctx.drawImage(this.img, this.x1 + i*this.width, canvas.height - this.height, this.width, this.height);
        }
             
        this.move();
    }

    move(){
        let criteria = 0;
        this.width > this.frameWidth ? criteria = this.width : criteria = this.frameWidth;
        
        this.speed = gameSpeed * this.k;
        if (this.x1 <= -criteria) {
            this.x1 = 0;
        }       
        this.x1 -= this.speed;         

        //this.x1 = -gameFrame * this.speed % criteria
    }
    
}

const backgrounds = [
    {
        url: cemeteryUrl+'background.png',
        width: 384,
        height: 224,
        scale: canvas.height/224,
        k: 0.01
    },
    
    {
        url: cemeteryUrl+'mountains.png',
        width: 192,
        height: 179,
        scale: canvas.width/192/2,
        k: 0.5
    },
    {
        url: cemeteryUrl+'graveyard.png',
        width: 384,
        height: 123,
        scale: canvas.width/384,
        k: 0.6
    }
    
]

const bgLayers = backgrounds.map((bg) => {
    
    return new Layer(
        bg.url, 
        widthOrig = bg.width, 
        heightOrig = bg.height, 
        width = bg.width * bg.scale,
        height = bg.height * bg.scale, 
        k = bg.k
    )
}
);


function getRGBString (array) {
    return `rgb(${array[0]}, ${array[1]}, ${array[2]})`;
}


class Demon {
    constructor() {
        this.img = new Image();
        this.img.src = demonSrc;

        this.widthOrig = 960;
        this.heightOrig = 144;

        this.framesN = 6;
        this.frameWidth = this.widthOrig/this.framesN;
        this.frameHeight = this.heightOrig;
        this.frame = 0;
        this.frameSpeed = 10;


        this.scale = 5*(Math.random()*1.5+0.75)*this.frameHeight / canvas.height;
        this.width = this.frameWidth*this.scale;
        this.height = this.frameHeight*this.scale;

        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);

        this.directionX = Math.random() * 3 + 1;
        this.directionY = Math.random() * 6 - 4;

        this.markedForDeletion = false;

        // if we want animation speed to be relative to timestamp
        this.flap = {            
            interval: 100,         
            timeSince: 0,
        }
        this.color = {};
        this.color.a = [Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255)];
        this.color.string = getRGBString(this.color.a);
        
    }

    update() {
        // === HANDLE X ===
        this.x -= this.directionX;

        // Ususal x reset (carousel)
        /* if (this.x < -canvas.width) {
            this.x = canvas.width
        } */

        // delete items passed the screen
        if (this.x < -this.width) this.markedForDeletion = true;

        // === HANDLE Y ===
        this.y -= this.directionY;

        // bounce
        if (this.y <= 0 || this.y >= canvas.height - this.height) {
            
            this.directionY *= -1;            
        }; 
    }

    draw(dt, method = 'time') {       
        let rel = false;

        switch (method){
            case 'time':
                // time and image frame relation  
                // <every ... ms>  
                this.flap.timeSince += dt;
                rel = this.flap.timeSince > this.flap.interval
                
                //rel = Math.round(timestamp) % this.flap.interval === 0;
                break;
            default:
                // game frame and image frame relation
                rel = gameFrame % this.frameSpeed === 0;
        }

        
        if (rel) {
            this.frame++;
            this.frame = this.frame % this.framesN;

            this.flap.timeSince = 0
        }

        collisionCtx.fillStyle = this.color.string;
        collisionCtx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(this.img, this.frame*this.frameWidth, 0, this.frameWidth, this.frameHeight, this.x, this.y, this.width, this.height)

    }

    // delete items passed screen border
}

let demons = [];
const demonsN = 0; //starter
for (let i=0; i < demonsN; i++) {
    demons.push(new Demon);
}


let timeToNextEnemy = 0;
let enemyinterval = 500; // ms
let lastTime = 0;


class Explosion {
    constructor(x, y) { 
        this.frameN = 5;       
        this.spriteWidth = 800/this.frameN;
        this.spriteHeight = 96;

        this.scale = 0.5;
        this.width = this.spriteWidth*this.scale;
        this.height = this.spriteHeight*this.scale;

        this.x = x - this.width/2;
        this.y = y - this.height/2;

        this.image = new Image;
        this.image.src = fireSrc;
        this.frame = 0;

        this.timer = 0;

        this.sound = new Audio();
        this.sound.src = clinkSNDSrc;
        this.sound.volume = Math.random()*0.04 + 0.01;

    }
    update(){
        this.timer++;
        this.timer % 5 == 0 ? this.frame++ : 'else';
        
    }
    draw(){
        this.sound.play();
        ctx.drawImage(this.image, this.frame*this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

const explosions = [];

function drawScore() {
    ctx.font = '20px impact';
    // draw text 2 times to create shadow effect
    ctx.fillStyle = 'black';
    ctx.fillText(
        'Score: ' + score,
        canvas.width - 100, 
        30)
    ctx.fillStyle = 'white';
    ctx.fillText(
        'Score: ' + score,
        canvas.width - 96, 
        33)
}

function onTap (x, y) {
    let posX = x - canvasPosition.left;
    let posY = y - canvasPosition.top;
    
    // collisions detection by color
    const detectPixelColor = collisionCtx.getImageData(posX, posY, 1, 1)    
    const pixel_color = detectPixelColor.data;    
    demons.forEach(obj => {
        if (obj.color.string === getRGBString(pixel_color)){
            obj.markedForDeletion = true;            
            score++;
        }        
    });
    
    explosions.push(new Explosion(posX, posY));
    
}


window.addEventListener('click', e => onTap (e.x, e.y));
window.addEventListener('touchstart', e => onTap (e.x, e.y));

function animate(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    collisionCtx.clearRect(0, 0, canvas.width, canvas.height);

    // === draw BG first ===

    for (let i = 0; i < bgLayers.length; i++){
        bgLayers[i].advanceImage();
    }

    // === draw score ===
    drawScore();

    // === draw enemies ===
    // === periodic creations ===
    let dt = timestamp - lastTime;
    lastTime = timestamp;
    timeToNextEnemy = timeToNextEnemy + dt;
    
    if (timeToNextEnemy > enemyinterval) {
        demons.push(new Demon());
        timeToNextEnemy = 0;        
        demons.sort((a, b)=>{
            return a.scale - b.scale;
        })
    }
    
    for (let i = 0; i < demons.length; i++){
        demons[i].update();
        demons[i].draw(dt);

    }    

    // only contain items where object.markedForDeletion = false
    demons = demons.filter(object => !object.markedForDeletion);


    // [] array literal
    // ... spread operator
    /*
    This syntax allows to call same methods for different classes simultaneously

    [...demons].forEach(object => object.update());
    [...demons].forEach(object => object.draw());
    */


    for (let i = 0; i < explosions.length; i++){
        explosions[i].update();
        explosions[i].draw();
        if (explosions[i].frame > explosions[i].frameN) {
            explosions.splice(i, 1);
            i--;
        }
    }    
    
    // explosions = explosions.filter(e => e.frame <= e.frameN);

    gameFrame++;
    requestAnimationFrame(animate);
}

// passes first timestamp value, otherwise it is undefined
animate(0);


