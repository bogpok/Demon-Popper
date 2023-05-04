window.addEventListener('load', processGame);

function processGame() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillRect(0,0,500,500)
    

    class Game {
        constructor(ctx, width, height) {
            // Overall settings
            this.ctx = ctx;
            this.width = width;
            this.height = height;

            // entities in a game
            this.enemies = [];
            this.enemyinterval = 400;
            this.enemyTimer = 0;


        }
        update(dt) {
            // update entire game

            this.enemies = this.enemies.filter(object=>!object.markForDeletion);
            if (this.enemyTimer > this.enemyinterval) {
                this.#addNewEntity();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += dt;
            }
            
            this.enemies.forEach(obj=>obj.update(dt));
        }
        draw() {
            this.enemies.forEach(obj=>obj.draw());

        }
        // private method
        // call only within class
        #addNewEntity() {
            this.enemies.push(new Nightmare(this));
            // entities with lower y will be in front
            this.sort((a,b)=> a.y - b.y);
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
            states: number of rows
            */
            console.log(this.spritesheet);
            if (spritesheet == undefined) {
                this.spritesheet = {
                    width: 0,
                    height: 0,
                    amount: [1],
                    states: 1,
                };
            } else {
                this.spritesheet = spritesheet;
            };
            console.log(this.spritesheet);

            this.setFrameProps();

            // Positioning
            this.x = this.game.width;
            this.y = Math.random() * (this.game.height - this.height);
            

        }
        update(dt) {
            // update each individual object

            this.x-= this.vx*dt;
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
        setFrameProps() {
            // after initializing spritesheet ONLY
            this.frame = {
                width: this.spritesheet.width / this.spritesheet.amount[0],
                height: this.spritesheet.height / this.spritesheet.states,
                current: 0,
                currentState: 0,
                speed: 10,
            };

            this.scale = 1;
            this.width = this.frame.width*this.scale;
            this.height = this.frame.height*this.scale;
        }
        
    }


    class Nightmare extends Entity {
        constructor(game) {            
            // run constructor from parent class
            // in child class 'super' must be called before 'this'
            super(
                game,
                {
                    width: 576,
                    height: 96,
                    amount: [1],
                    states: 1,
                }
                );
                        
            // any elements in the dom with id automatically added in js
            this.image = nightmare;

            this.vx = Math.random() * 0.1 + .2;
            
        }
        draw() {
            
            // animation method
            this.game.ctx.drawImage(this.image, 
                this.frame.current*this.frame.width, 
                this.frame.currentState*this.frame.height,
                this.frame.width, this.frame.height,
                this.x, this.y, this.width, this.height);        
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