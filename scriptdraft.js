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
            this.entityTypes = [...this.enemyTypes, ...this.alliesTypes];

            

        }
        update(dt) {
            // update entire game

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

            this.x-= this.vx*dt;
            if (this.x <- this.width) this.markForDeletion = true;

            this.frame.elapsed += dt;
            
            // every <this.frame.speed> ms change frame
            if (this.frame.elapsed > this.frame.speed){                
                this.frame.current++;                
                this.frame.current = this.frame.current % this.spritesheet.amount[this.frame.currentState];
                this.frame.elapsed = 0;
            } 

            

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
        draw() {
            
            // animation method
            this.game.ctx.drawImage(this.image, 
                this.frame.current*this.frame.width, 
                this.frame.currentState*this.frame.height,
                this.frame.width, this.frame.height,
                this.x, this.y, this.width, this.height);        
        }
    }


    class Nightmare extends Npc {
        constructor(game) {            
            // run constructor from parent class
            // in child class 'super' must be called before 'this'
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
        }        
    }
    
    class Demon extends Npc {
        constructor(game) {            
            // run constructor from parent class
            // in child class 'super' must be called before 'this'
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
        }        
    } 

    class Bird extends Npc {
        constructor(game) {            
            // run constructor from parent class
            // in child class 'super' must be called before 'this'
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
            
            
            //console.log(this)
        }        
    } 

    /* TODO 
    Demon - common enemy - 1 point
    Nightmare - rare enemy - 5 points
    Bird - dont touch, minus 3 points */

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