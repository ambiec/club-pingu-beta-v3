let msgInput = document.getElementById('msg-input');
let chatFeed = document.getElementById('chat-feed');
let sendButton = document.getElementById('send-button');
let chatContainer = document.getElementById('chat-container');

let spr = [];
let sprObj = {};
let key;
let r, g, b;

let coords = [];
let x, y;
let targetX, targetY;

let clickID;
let msgData;
let msgId;

let spriteDupes = {};
let newKey;
let delSpr;

/////////////
// SOCKETS //
/////////////
let socket = io();

    socket.on('connect',() => {
        console.log('client connected');
    })

    // Receiving 'newConnect' event from SERVER
    socket.on('newConnect', (newClient)=> {

        r = random(255);
        g = random(255);
        b = random(255);

        /////////////////
        // YOUR SPRITE //
        /////////////////

        // Create sprite unique to newClient socket.id upon connection
        spr[newClient] = createSprite(
            width/2, height/2, 40, 40);
        spr[newClient].shapeColor = color(r,g,b); //DEBUG: clients may not see same color since sprObj since it's not yet stored emitted to all clients
        spr[newClient].rotateToDirection = true;
        spr[newClient].maxSpeed = 4;
        spr[newClient].friction = 0.1;

        // Stored as sprite data object sprObj - different from spr array
        key = newClient;
        sprObj[key] = {
            id: newClient,
            sprX: spr[newClient].position.x,
            sprY: spr[newClient].position.y,
            r: r,
            g: g,
            b: b
        }

        // [A] 'allSprites' event
        // Only emitted by newest client (avoid repeat data on server)
        if (socket.id == newClient) {
            socket.emit('allSprites', sprObj);
        }
    })

    /////////////////////
    // OTHERS' SPRITES //
    /////////////////////

    // [A] 'allSprites' event
    // Receiving all existing sprites data from SERVER
    socket.on('allSprites', (data) => {
        for (let client in data) {
            let clientId = data[client].id;
         if (clientId !== key && socket.id == key) {
                newKey = clientId; 

                //Create duplicate of other existing clients' sprites for newest client
                spr[newKey] = createSprite(
                    data[client].sprX, data[client].sprY, 40, 40);
                spr[newKey].shapeColor = color(data[client].r, data[client].g, data[client].b);
                spr[newKey].rotateToDirection = true;
                spr[newKey].maxSpeed = 4;
                spr[newKey].friction = 0.1;

                 // Stored as sprite data object spriteDupes
                spriteDupes[newKey] = {
                    id: newKey,
                    sprX: spr[newKey].position.x,
                    sprY: spr[newKey].position.y,
                    r: data[client].r,
                    g: data[client].g,
                    b: data[client].b
                }
            }
        }
    })


    // [B] 'mouse' event
    // Receiving from SERVER, update coordinates for spr.attractionpoint (in draw())
    socket.on('mouse', (data) => {
        targetX = data.x;
        targetY = data.y;
        clickID = data.id; //socket.id of clicker
        
        storeCoordinate(targetX, targetY, coords);

        // Loop through coordinate values
        for (let i = 0; i < coords.length; i+=2) {
            x = coords[i];
            y = coords[i+1];
        } 
        
        // Keep sprite out of chat box area
        if(y>inputRect.bottom + 30){
            spriteMove = true;
        }
    })

    // [C] 'msg' event
    // Receiving from SERVER, store as global vars
    socket.on('msg', (data) => {
        console.log("Message arrived!");

        //Receive message from server
        msgData = data.msg;
        msgId = data.id;
    })

    socket.on('delSprite',(data) => { //data = disconnected socket
        
        for (let i = 0; i < spr.length; i++) {
            console.log(spr[i]);
        }
        
        // WIP //

        //delete object but actual drawn sprites are in spr array   
        // for (let client in sprObj) {
        //     if(sprObj[client].id == data){
        //         delete sprObj[client];
        //         // console.log(sprObj[client]);
        //     }
        // }

        // for (let client in spriteDupes) {
        //     if(spriteDupes[client].id == data){
        //         delete spriteDupes[client];
        //         // console.log(spriteDupes[client]);
        //     }
        // }
        
        
    })

    //////////////
    // MESSAGES //
    //////////////

    // Event Listeners for submitting message input
    msgInput.addEventListener('keydown', function (e) { 
        if (e.key === 'Enter' || e.key === 13) {
            sendButton.click(); //DEBUG: Registers as click (messes up sprite movement if in transit)
        }
    });

    sendButton.addEventListener('click', () => {
        sendMessage();
    })

    // [C] 'msg' event
    // Create message object to send to SERVER
    function sendMessage() {
        let curMsg = msgInput.value;
        let msgObj = {
            "msg": curMsg,
            "id": socket.id
        };
        socket.emit('msg', msgObj);

        msgInput.value = ""; //Clear the message input field
    }

//#Source - HTML element coordinates: https://stackoverflow.com/questions/442404/retrieve-the-position-x-y-of-an-html-element
let inputRect = chatContainer.getBoundingClientRect();


/////////////////
// P5 | P5Play //
/////////////////

//#Source - sprites: https://creative-coding.decontextualize.com/making-games-with-p5-play/
function setup() {
    createCanvas(windowWidth, windowHeight);
    background(255);

    //p5.play sprite
    //Step 1. Draw sprite
    //Step 2. If mousePressed, set sprite x,y
}

function draw() {
    background(255);

    // [B] 'mouse' event (continued outside of sockets)
    // Update attractionpoint for your sprite + move
    for (let client in sprObj) { // Learned for in loops through ChatGPT
        if (sprObj[client].id == clickID) {
            if (spriteMove === true) {
                spr[client].attractionPoint(0.5, x, y);
            }

            let distance = dist(spr[client].position.x, spr[client].position.y, x, y);
            if (distance < 5) { // Stop sprite when it's close to the mouse
                spr[client].setSpeed(0);
                spriteMove = false;

            }
        }
    }

    // Update attractionpoint for others' sprites + move
    for (let client in spriteDupes) {
        if (spriteDupes[client].id == clickID) {
            if (spriteMove === true) {
                spr[client].attractionPoint(0.5, x, y);
            }

            let distance = dist(spr[client].position.x, spr[client].position.y, x, y);
            if (distance < 5) { // Stop sprite when it's close to the mouse
                spr[client].setSpeed(0);
                spriteMove = false;
            }
        }
    }
  
  drawSprites();
  printMessage();
}

// [B] 'mouse' event
// Click = sprite's target destination
// Store mouse data on click and send to SERVER
function mouseClicked() {
    let mousePos = {
        id: socket.id,
        x: mouseX,
        y: mouseY
    }
    socket.emit('mouse', mousePos); 
}

// Store clicked coords, referenced in draw()
// #Source: https://stackoverflow.com/questions/7030229/storing-coordinates-in-array-in-javascript
function storeCoordinate(x, y, array) {
    array.push(x);
    array.push(y);
}


// [C] 'msg' event (continued outside of sockets)
function printMessage() {
    textSize(16);
    textAlign(CENTER);

    // Match client that sent the message to existing sprite in sprObj & spriteDupes
    for(let client in sprObj) {
        if (sprObj[client].id == msgId) {
            text(msgData, spr[client].position.x, spr[client].position.y - 40); // Draw text above matching client
        }
    }

    for(let client in spriteDupes) {
        if (spriteDupes[client].id == msgId) {
            text(msgData, spr[client].position.x, spr[client].position.y - 40);
        }
    }
}




