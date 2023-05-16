window.addEventListener('load', processGame);

function processGame() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;   
    

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
            this.entityTypes = [...this.enemyTypes, ...this.alliesTypes];           

        }
        update(dt) {
            

            this.entities = this.entities.filter(object=>!object.markForDeletion);
            if (this.entityTimer > this.entityInterval) {
                this.#addNewEntity();
                this.entityTimer = 0;
            } else {
                this.entityTimer += dt;
            }
            
            this.entities.forEach(obj=>obj.update(dt));
        }
        draw() {
            this.entities.forEach(obj=>obj.draw());

        }
        // private method
        // call only within class
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
        }
    }

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
            if (this.x <- this.width) this.markForDeletion = true;
        }

        
        draw() {
            if (this.image != undefined) {
                this.game.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
        }
        setDefaults() {
            // Filtering
            this.markForDeletion = false;
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
            this.move(dt, 'linearSin');

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
                        
            // any elements in the dom with id automatically added in js
            this.image = demon;

            // rescale
            this.setFrameProps(Math.random() * 1 + 1);

            this.vx = Math.random() * 0.1 + .2;      
            this.y = Math.random()*this.game.height * 0.6;  
                
        }
        draw() {
            this.game.ctx.save() // snapshot of all canvas settings
            this.game.ctx.globalAlpha = Math.random() * 0.05 + 0.95;
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

    const game = new Game(ctx, canvas.width, canvas.height);
    
    let lastTime = 1;

    function animate(timestamp){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let dt = timestamp - lastTime;
        lastTime = timestamp;

        game.update(dt);
        game.draw();

        requestAnimationFrame(animate);

    }

    animate(0);
}