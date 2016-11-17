// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 3000;
var myOptions = require("./liste.json");
var fs   = require('fs');

server.listen(port, function () {
	console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
	var addedUser = false;

	// when the client emits 'new message', this listens and executes
	socket.on('new message', function (data) {
		// we tell the client to execute 'new message'
		socket.broadcast.emit('new message', {
			username: socket.username,
			message: data
		});
	});

	// Wenn der Client eine neue Vokabel anlegt
	socket.on('neue vokabel', function (data) {
		console.log(data);
		myOptions.push(data);
		var a = JSON.stringify(myOptions, null, 4);
		console.log("Going to write myOptions to liste.json");
		fs.writeFile('./liste.json', a, function (err) {
			if (err) return console.log(err);

		});
		console.log("liste.json beschrieben");
	});

	// when the client emits 'add user', this listens and executes
	socket.on('add user', function (username) {
		if (addedUser) return;

		// we store the username in the socket session for this client
		socket.username = username;
		++numUsers;
		addedUser = true;
		socket.emit('login', {
			numUsers: numUsers
		});
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('user joined', {
			username: socket.username,
			numUsers: numUsers
		});
	});



	socket.on('beigetreten', function (data) {
		console.log("HI");
		socket.emit('hierdasarray', {
			array: myOptions
		});

	});






	// when the client emits 'typing', we broadcast it to others
	socket.on('typing', function () {
		socket.broadcast.emit('typing', {
			username: socket.username
		});
	});

	// when the client emits 'stop typing', we broadcast it to others
	socket.on('stop typing', function () {
		socket.broadcast.emit('stop typing', {
			username: socket.username
		});
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function () {
		if (addedUser) {
			--numUsers;
			// echo globally that this client has left
			socket.broadcast.emit('user left', {
				username: socket.username,
				numUsers: numUsers
			});
		}
	});
});
console.log('Der Server läuft nun unter http://127.0.0.1:' + port + '/');