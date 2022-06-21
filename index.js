import express, { urlencoded } from "express";
import cors from "cors";
import {router, socket} from "./routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { WSM_FetchSearchData, ReadJson, WriteJson, WSM_FetchAllData } from "./util.js";

export const app = express();
const httpServer = createServer(app);

export let rooms = {"25":{timestamp:0.0,date: 0,ispaused:true, colors: []}};
export let users = {"25":{}};
export let searchData = [];
export let movies = [];
export let series = [];
ReadJson("searchData.json").then( data=> searchData = data );
ReadJson("newMovies.json").then( data=> movies = data );
ReadJson("newSeries.json").then( data=> series = data );

//required in order to receive json data
app.use(express.json());
app.use(express.urlencoded({ extended: true })) 
app.use(cors({ origin: "*" }));
app.use("/api", router);
app.use("/socket", socket);

let port = process.env.PORT || "3000";

httpServer.listen(port, () => {
	console.log("Listening to port " + port);
});

const io = new Server(httpServer, {
	transports: ['websocket'],
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

io.on("connection", (socket) => {
	console.log(socket.id);
	socket.on("ping",( room, callback) => {
		const dateNow = Date.now();
		if(!rooms[room].ispaused) {
			rooms[room].timestamp = dateNow - rooms[room].date;
		}
		callback((rooms[room].timestamp/1000).toFixed(3));
	  });
	socket.on("initialize_room", ({room,user},callback) => {
		if( !rooms?.[room] ) return;
		const color = getRandomColor(room);
		socket.join(room);
		users[room][user] = { id: socket.id, color: color };
		rooms[room].colors.push( color );
		callback( { users: users[room], data: rooms[room] } );
		socket.to(room).emit("addPlayer_room",{ user: user, id: socket.id, color: color});
	});
	socket.on("pause", ({ time, user, room }) =>{
		rooms[room].timestamp = Date.now() - rooms[room].date;
		rooms[room].ispaused = true;
		socket.to(room).emit("pause", {time: (rooms[room].timestamp/1000).toFixed(3), user: user});
	});
	socket.on("play", ({ time, user, room }) =>{
		socket.to(room).emit("play", {time: time, user: user});
		rooms[room].date = Date.now() - time*1000;
		rooms[room].timestamp = time;
		rooms[room].ispaused = false;
	});
	socket.on("leave_room", ({ room, user}) => {
		console.log(`user= ${user} with id = ${socket.id} left the room = ${room}`);
		socket.leave(room);
		console.log(user +" user left room: "+room,users[room]);
		// delete users[room]?.user;
		// if( rooms[data?.room] && Object.keys(users[data?.room]).length === 0 ) { delete rooms[data?.room]; delete users[data?.room];}
		// console.log(rooms)
		for(const room in users){
			for (const [user, {id}] of Object.entries(users[room])) {
				if(id == socket.id){
					delete users[room][user];
					console.log(user)
				}
			}
		}
	});
	socket.on("disconnect", () => {
		const data = JSON.parse(decodeURIComponent(socket.handshake.headers?.cookie)?.split("=")[1] ?? null);
		console.log(data?.username+" user disconnected");
		// delete users[data?.room]?.[data?.username];
		// if( rooms[data?.room] && Object.keys(users[data?.room]).length === 0 ) { delete rooms[data?.room]; delete users[data?.room];}
		for(const room in users){
			for (const [user, {id}] of Object.entries(users[room])) {
				if(id == socket.id){
					delete users[room][user];
					console.log(user)
				}
			}
		}
	});
});


setTimeout(()=>{
	WSM_FetchAllData();
	WSM_FetchSearchData();
},3600000);


function getRandomColor(room) {
	var percent = [10,20,30,40,50,60,70,80,90];
	let color = "";
	color += Math.floor(Math.random() * 361)+"deg";
	color += " " + percent[Math.floor(Math.random() * 9)]+ "%";
	color += " " + percent[Math.floor(Math.random() * 9)]+ "%";

	if(rooms[room]?.colors.length){
		if( rooms[room]?.colors?.includes(color)){
			color = getRandomColor();
		}
	}
	return color;
}