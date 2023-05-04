document.addEventListener('load', processGame);

function processGame() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillRect(0,0,500,500)

    class Game {
        constructor(ctx, width, height) {
            this.ctx = ctx;
            this.width = width;
            this.height = height;

            this.enemies = [];
            this.enemyinterval = 400;
            this.enemyTimer = 0;


        }
        update(dt) {
            // update entire game

            this.enemies = this.enemies.filter(object=>!object.markForDeletion);
            if (this.enemyTimer > this.enemyinterval) {
                this.#addNewEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += dt;
            }
            
            this.enemies.forEach(obj=>obj.update());
        }
        draw() {
            this.enemies.forEach(obj=>obj.draw());

        }
        // private method
        // call only within class
        #addNewEnemy() {
            this.enemies.push(new Nightmare(this));

        }
    }

    class Enemy {
        constructor(game){
            this.x = this.game.width;
            this.y = Math.random() * this.game.height;
            this.width = 100;
            this.height = 100;
            this.image = undefined;
            this.markForDeletion = false;

        }
        update() {
            // update each individual object

            this.x--;
            if (this.x<-this.width) this.markForDeletion = true;

        }
        draw() {
            if (this.image != undefined) {
                this.game.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
        }
    }


    class Nightmare extends Enemy {
        constructor(game) {
            // run constructor from parent class
            super(game);            
            // in child class super must be called before this
            
            // any elements in the dom with id automatically added in js
            this.image = nightmare;
            console.log(this.image);
        }
    }    


    const game = new Game(ctx, canvas.width, canvas.height);
    let lastTime = 1;

    function animate(timestamp){
        ctx.clearRect(0,0,canvas.width, canvas.height);
        let dt = timestamp - lastTime;
        lastTime = timestamp;

        game.update(dt);
        game.draw();

        requestAnimationFrame(animate);

    }

    animate(0);
}