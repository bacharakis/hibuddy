var crypto  = require('crypto');
var express = require('express');
var app = express();
var rooms = {};
var counter = 0;

app.use(express.bodyParser());
app.use('/static', express.static(__dirname + '/public'));

app.get("/", function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
});

app.post("/rooms", function(req, res) {
    var room = crypto.randomBytes(16).toString('hex');
    rooms[room] = [];
    res.redirect('/rooms/' + room);
});

app.get('/rooms/:room', function(req, res) {
    res.sendfile(__dirname + '/public/room.html');
});

app.get("/rooms/:room/signalling", function(req, res) {
    var room = req.param('room');
    var users = rooms[room];
    console.log('new friend');

    res.writeHead(200, {
        "Content-Type":  "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection":    "keep-alive"
    });

    req.on("close", function() {
        var i = rooms[room].indexOf(res);
        rooms[room].splice(i, 1);
    });

    var event = JSON.stringify({type: 'uid', uid: counter++});
    res.write("event: uid\n");
    res.write("data: " + event + "\n\n");

    users.map(function(c) {
        c.write("event: newfriend\n");
        c.write("data: {}\n\n");
    });
    users.push(res);
});

app.post("/rooms/:room/signalling", function(req, res) {
    var room  = req.param('room');
    var users = rooms[room];
    var type  = req.body.type;
    var event = JSON.stringify(req.body);
    console.log(req.body);

    users.map(function(c) {
        c.write("event: " + type + "\n");
        c.write("data: " + event + "\n\n");
    });

    res.send(200);
});

app.listen(6424);
console.log('Listening on port 6424');

