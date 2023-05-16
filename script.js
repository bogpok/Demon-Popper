/** @type {HTMLCanvasElement} */
window.addEventListener('load', processGame);
function processGame() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const collisionCanv = document.getElementById('collCanv');
    const collisionCtx = collisionCanv.getContext('2d', { willReadFrequently: true });
    // collisionCanv.width = 540;
    // collisionCanv.height = 700;
    collisionCanv.width = canvas.width;
    collisionCanv.height = canvas.height;

    const assetsUrl = './assets/';
    const demonSrc = assetsUrl+'demon-idle.png';
    const fireSrc = assetsUrl+'breath.png';
    const cemeteryUrl = assetsUrl+'bg/';
    const clinkSNDSrc = assetsUrl + 'Match_striking.wav'

    // compensate positions between mouse and canvas
    let canvasPosition = canvas.getBoundingClientRect();

    // === game properties ===
    let gameSpeed = 1;
    let gameFrame = 0;

    let score = 0;
    let gameOver = false;



    function getRGBString (RGBarray) {
        return `rgb(${RGBarray[0]}, ${RGBarray[1]}, ${RGBarray[2]})`;
    }

    class Game {
        constructor(ctx, width, height) {
            // Overall settings
            this.ctx = ctx;
            this.width = width;
            this.height = height;

            // entities in a game
            this.entities = [];
            this.entityInterval = 400;
            this.entityTimer = 0;

            this.enemyTypes = ['nightmare', 'demon'];
            this.alliesTypes = ['bird']; 
            // ... spread operator
            /*
            This syntax allows to call same methods for different classes simultaneously   
            Pros:
                - less code with same functionality
            Cons:
                - methods should be identical
            */
            this.entityTypes = [...this.enemyTypes, ...this.alliesTypes, ];    

        }
        update(dt) {
            // === update entire game ===
            
            // only contain items where object.deleteMarker = false
            this.entities = this.entities.filter(object=>!object.deleteMarker);
            
            // === periodic creations ===
            if (this.entityTimer > this.entityInterval) {
                this.#addNewEntity();
                this.entityTimer = 0;
            } else {
                this.entityTimer += dt;
            }
            
            this.entities.forEach(obj=>obj.update(dt));

            explosions.forEach(object => object.update());
            explosions = explosions.filter(object => !object.deleteMarker);         
            
            
            
        }
        draw() {
            // === draw BG first ===

            for (let i = 0; i < bgLayers.length; i++){
                bgLayers[i].advanceImage();
            }

            // === draw entities ===
            this.entities.forEach(obj=>obj.draw());

            explosions.forEach(object => object.draw());

            // === draw score ===
            drawScore();

        }
        // private methods (call only within class)
        #addNewEntity() {
            const randEntity = this.entityTypes[
                Math.floor(Math.random()*this.entityTypes.length)
            ];

            switch (randEntity) {
                case 'nightmare':
                    this.entities.push(new Nightmare(this));
                    break;
                case 'demon':
                    this.entities.push(new Demon(this));
                    break;
                case 'bird':
                    this.entities.push(new Bird(this));
                    break;
            }
            
            // entities with lower y will be in front
            this.entities.sort((a,b)=> a.y - b.y);

            /* demons.sort((a, b)=>{
                return a.scale - b.scale;
            }) */
        }
    }

    class bgLayer {    
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
        
        return new bgLayer(
            bg.url, 
            widthOrig = bg.width, 
            heightOrig = bg.height, 
            width = bg.width * bg.scale,
            height = bg.height * bg.scale, 
            k = bg.k
        )
    }
    );


    class Entity {

        // abstract

        /*
        Types:
            - scrolling images (like backgrounds)
            - moving objects, like enemies
            - controllable objects, like hero
        */

        constructor(game, spritesheet = undefined){
            // Game object
            this.game = game;

            // Image object from document
            this.image = undefined;

            // Common values
            this.setDefaults();

            /* Spritesheet image properties
            Spritesheet must represent several frames horizontally for each state
            
            width: original width
            height: original height
            amount: for each state [number of frames]
                amount.length - states - number of rows
            */
            
            if (spritesheet == undefined) {
                this.spritesheet = {
                    width: 0,
                    height: 0,
                    amount: [1],
                    
                };
            } else {
                this.spritesheet = spritesheet;
            };
            

            this.setFrameProps();

            // Positioning
            this.x = this.game.width;
            this.y = Math.random() * (this.game.height - this.height);
            

        }
        update(dt) {
            // update each individual object           

            this.frame.elapsed += dt;
            
            // every <this.frame.speed> ms change frame
            if (this.frame.elapsed > this.frame.speed){                
                this.frame.current++;                
                this.frame.current = this.frame.current % this.spritesheet.amount[this.frame.currentState];
                this.frame.elapsed = 0;
            } 
        }
        move(dt) {
            this.x-= this.vx*dt;
            // !!!
            if (this.x <- this.width) this.deleteMarker = true;
        }        
        draw() {
            if (this.image != undefined) {
                this.game.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
        }
        setDefaults() {
            // Filtering
            this.deleteMarker = false;
        }
        setFrameProps(scale = 1, speed = {min:80, max:120}) {
            // after initializing spritesheet ONLY
            this.frame = {
                width: this.spritesheet.width / Math.max(...this.spritesheet.amount),
                height: this.spritesheet.height / this.spritesheet.amount.length,
                current: 0,
                currentState: 0,
                speed: Math.random()*(speed.max-speed.min) + speed.min,
                elapsed: 0,
            };

            this.scale = scale;
            this.width = this.frame.width*this.scale;
            this.height = this.frame.height*this.scale;
        }
        
    }

    class Npc extends Entity {
        // - moving objects, like enemies
        constructor(game, spritesheet){
            super(game, spritesheet);

            // === MOVEMENT SETTINGS ===

            // for sin movement
            this.angular = {
                ang: 0,
                speed: Math.random() * 0.001 + 0.001,
                r: Math.random() * 20
            }; 
            // for random movement
            this.newX = Math.random() * (canvas.width - this.width);
            this.newY = Math.random() * (canvas.height - this.height);
            this.changePosRate = Math.floor(Math.random() * 40 + 20);


        }
        draw() {
            
            // animation method
            this.game.ctx.drawImage(this.image, 
                this.frame.current*this.frame.width, 
                this.frame.currentState*this.frame.height,
                this.frame.width, this.frame.height,
                this.x, this.y, this.width, this.height);        
        }
        update(dt) {
            super.update(dt);
            this.move(dt, 'linear1');

        }
        move(dt, pattern='') {
            // === MOVING PATTERNS ===
            /** pattern: string */
    
            let dx = 0;
            let dy = 0;            
    
            switch(pattern) {
                case "hang":
                    // hang around
                    this.x += Math.random() * 5 - 2.5;
                    this.y += Math.random() * 5 - 2.5;
                    break;
                case "linear1":
                    // linear 1 axis
                    // moves by the x axis and no changes by y
                    this.x-=this.vx*dt;
                    break;
                case "linearSin":
                    // linear 1 axis
                    // moves by the x axis and as sin by y                
                    this.x-=this.vx*dt;   
                    this.y-=Math.sin(this.angular.ang)*this.angular.r;
                    this.angular.ang += this.angular.speed*dt;                
                    break;
                case "xSin":
                    // sin by x, no changes by y
                    // floating like
                    this.x = this.angular.r * Math.sin(this.angular.ang * Math.PI/180) + canvas.width/2 - this.width/2;
                    this.angular.ang += this.angular.speed*dt;
                    break;
                case "circular":
                    // circular
                    this.x = this.angular.r * Math.sin(this.angular.ang * Math.PI/180) + canvas.width/2 - this.width/2;
                    this.y = this.angular.r * Math.cos(this.angular.ang * Math.PI/180) + canvas.height/2 - this.height/2;
                    this.angular.ang += this.angular.speed*dt;
                    break;
                case "fillElliptic":
                    // fill canvas elliptic
                    this.x0 = canvas.width/2 - this.width/2;
                    this.y0 = canvas.height/2 - this.height/2;
                    this.x = this.x0 * Math.sin(this.angular.ang * Math.PI/180) + this.x0;
                    this.y = this.y0 * Math.cos(this.angular.ang * Math.PI/180) + this.y0;
                    this.angular.ang += this.angular.speed*dt;
                    break;
                case "fillOutPhase":
                    // fill canvas Spiral
                    this.x0 = canvas.width/2 - this.width/2;
                    this.y0 = canvas.height/2 - this.height/2;
                    // phase coefficients - change pattern
                    this.angular.sinK = 1/2;
                    this.angular.cosK = 1.5;
    
                    this.x = this.x0 * Math.sin(this.angular.ang * Math.PI/180 * this.angular.sinK) + this.x0;
                    this.y = this.y0 * Math.cos(this.angular.ang * Math.PI/180 * this.angular.cosK) + this.y0;
                    this.angular.ang += this.angular.speed*dt;
                    break;
    
                case "randPos":
                    // random position
                    if (dt % this.changePosRate == 0) {
                        this.newX = Math.random() * (canvas.width - this.width);
                        this.newY = Math.random() * (canvas.height - this.height);
                    }
                    dx = this.x - this.newX;
                    dy = this.y - this.newY;
                    this.x -= dx/this.changePosRate;
                    this.y -= dy/this.changePosRate;
                    break;
    
                case "onmouse":
                    // follow the mouse
    
                    const onMouseMove = (e) => {                    
                        this.newX = e.clientX - this.canvasPos.x - this.width/2;
                        this.newY = e.clientY - this.canvasPos.y - this.height/2;                    
                    }
                    dx = (this.x - this.newX);
                    dy = (this.y - this.newY);
                    this.x -= dx/this.changePosRate;
                    this.y -= dy/this.changePosRate;
                    /*
                    dx = (this.x - this.newX);
                    dy = (this.y - this.newY);
                    this.x -= dx/this.changePosRate;
                    this.y -= dy/this.changePosRate;
                    */
    
                    //document.addEventListener('mousemove', onMouseMove, false);
                    break;
    
                default:
                    this.x-=this.vx*dt;
                    this.y-=this.vx*dt;
            }            
            //if (this.x + this.width < 0) this.x = canvas.width;
        }
    }


    class Nightmare extends Npc {
        constructor(game) {         
            
            super(
                game,
                {
                    width: 576,
                    height: 96,
                    amount: [4],                    
                }
                );
                        
            // any elements in the dom with id automatically added in js
            this.image = nightmare;

            // rescale
            this.setFrameProps(2);

            this.vx = Math.random() * 0.1 + .2;  
            this.y = this.game.height - this.height - 20;            
        }        
        draw() {
            this.game.ctx.save() // snapshot of all canvas settings
            // transparency
            this.game.ctx.globalAlpha = Math.random() * 0.1 + 0.8;
            super.draw();
            this.game.ctx.restore(); // return all snapshot settings
        }   
    }
    
    class Bird extends Npc {
        // Simple flying object which the player should not hit
        constructor(game) {            
            super(
                game,
                {
                    width: 1312,
                    height: 480,
                    amount: [2,8,3],                    
                }
                );
                        
            // any elements in the dom with id automatically added in js
            this.image = bird;

            // rescale
            this.setFrameProps(0.5);

            this.frame.height += 1;            
            this.frame.currentState = 1;

            this.vx = Math.random() * 0.1 + .2;               
        }        
    } 


    class Demon extends Npc {
        constructor(game) {
            // Flying object, hit for 1 point
            super(
                game,
                {
                    width: 960,
                    height: 144,
                    amount: [6],                    
                }
                );
            this.image = demon;

            // rescale
            this.setFrameProps(Math.random() * 1 + 1);
            
            this.vx = Math.random() * 0.1 + .2;      
            this.y = Math.random()*this.game.height * 0.6;  

            this.hitbox = {
                carr: [Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255)],                
            };            
            this.hitbox.cstring = getRGBString(this.hitbox.carr);
            
        }

        update(dt) {
            super.update(dt)
            /*
            // === HANDLE X ===
            this.x -= this.directionX;

            reset = '';
            if (reset === 'carousel') {
                if (this.x < -canvas.width) {
                    this.x = canvas.width;
            } else {
                // delete items passed the screen
                if (this.x < -this.width) this.deleteMarker = true;
            } 

            // === HANDLE Y ===
            this.y -= this.directionY;
            // bounce
            if (this.y <= 0 || this.y >= canvas.height - this.height) {
                this.directionY *= -1;            
            };  */

            // GAME OVER
            if (this.x < - this.width) gameOver = true;
        }
        draw() {
            this.game.ctx.save() // snapshot of all canvas settings
            this.game.ctx.globalAlpha = Math.random() * 0.05 + 0.95;
            super.draw();
            this.game.ctx.restore(); // return all snapshot settings

            collisionCtx.fillStyle = this.hitbox.cstring;
            collisionCtx.fillRect(this.x, this.y, this.width, this.height);

        }   

        
    }


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
            this.sound.volume = Math.random()*0.08 + 0.03;

            this.deleteMarker = false;

        }
        update(){
            this.timer++;
            this.timer % 5 == 0 ? this.frame++ : 'else';
            if (this.frame > this.frameN) this.deleteMarker = true;
        }
        draw(){
            this.sound.play();
            ctx.drawImage(this.image, this.frame*this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        }
    }

    let explosions = [];

    function drawScore() {
        ctx.font = '30px impact';

        let x = - 150;
        // draw text 2 times to create shadow effect
        ctx.fillStyle = 'black';
        ctx.fillText(
            'Score: ' + score,
            canvas.width + x, 
            30)
        ctx.fillStyle = 'white';
        ctx.fillText(
            'Score: ' + score,
            canvas.width + (x+5), 
            33)
    }
    

    function onTap (x, y) {
        let posX = x - canvasPosition.left;
        let posY = y - canvasPosition.top;
        
        // collisions detection by color
        const detectPixelColor = collisionCtx.getImageData(posX, posY, 1, 1)    
        const pixel_color = detectPixelColor.data;    
        
        game.entities.forEach(obj => {
            // if it has hitbox property
            if (obj.hitbox) {
                if (obj.hitbox.cstring === getRGBString(pixel_color)){
                    obj.deleteMarker = true;     
                    score++;
                }   
            }                 
        });

        explosions.push(new Explosion(posX, posY));         
    }

    function drawGameOver() {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,0,canvas.width, canvas.height);

        const text = 'Game Over\nScore: ' + score;
        ctx.fillStyle = 'crimson';
        ctx.textAlign = 'center';    
        ctx.fillText(text, canvas.width/2, canvas.height/2);

        ctx.fillStyle = 'white';
        ctx.fillText(text, canvas.width/2 + 5, canvas.height/2 + 5);
    }

    //#region Listeners
    canvas.addEventListener('click', e => onTap (e.x, e.y));
    canvas.addEventListener('touchstart', e => onTap (e.x, e.y));
    //#endregion

    //#region animate props
    let lastTime = 0;
    const game = new Game(ctx, canvas.width, canvas.height);
    //#endregion

    function animate(timestamp) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        collisionCtx.clearRect(0, 0, canvas.width, canvas.height);

        // === Calculate time ===
        let dt = timestamp - lastTime;
        lastTime = timestamp; 
        
        game.update(dt);
        game.draw();

        gameFrame++;
        
        if (!gameOver) requestAnimationFrame(animate);
        else drawGameOver();
    }

    // passes first timestamp value 0, otherwise it is undefined
    animate(0);

}


// === User stories ===

/* TODO 

# extend hit regions for all NPCs
# hit scores

    Demon - common enemy - 1 point
    Nightmare - rare enemy - 5 points
    Bird - dont touch, minus 3 points 

# !!! Check if entities are deleted from array


# Npc.move()
    all patterns should be verified


    
# Refactor bgs and EXPLOSIONS

# still need gameFrame?
    
*/