
export namespace SocketIo {

	export const init = http => {
		
	const socketio = require('socket.io')(http);


	socketio.on('connection', socket => {

		socket.on('request-clientid', room => {

			// Create a room with the same name as the requester
			socket.join(room);

			// Use socket.io's id to identify the user subsequently (exclude the first 2 chars)
			socketio.sockets.in(room).emit('clientid', socket.id.slice(2));
		});

		socket.on('request-firstname-emailaddress', clientid => {

			// Create a room with the same name as the requester
			socket.join(clientid);

			// Send back the corresponding firstname and emailaddress
			let rooms = socketio.sockets.adapter.rooms;
			for (let room in rooms) {
				if (room.slice(2) !== clientid && _.keys(rooms[room].sockets)[0].slice(2) === clientid) {
					socketio.sockets.in(clientid).emit('firstname-emailaddress', room);
					break;
				}
			}
		});

		socket.on('disconnect', () =>
			console.log('user disconnected'));
	});
	}
}
