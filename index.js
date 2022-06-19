import express, { urlencoded } from "express";
import cors from "cors";
import {router, socket} from "./routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { WSM_FetchSearchData, ReadJson, WriteJson, WSM_FetchAllData } from "./util.js";

export const app = express();
const httpServer = createServer(app);

export let rooms = {"25":{users:{},timestamp:0.0,date: 0,timepassed: 0,ispaused:true}};
export let colors = [];
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
		const color = getRandomColor();
		socket.join(room);
		rooms[room].users[user] = { id: socket.id, color: color };
		callback( rooms[room] );
		socket.to(room).emit("addPlayer_room",{ user: user, id: socket.id, color: color});
	});
	socket.on("pause", ({ time, user, room }) =>{
		rooms[room].timestamp = Date.now() - rooms[room].date;
		rooms[room].ispaused = true;
		socket.to(room).emit("pause", {time: rooms[room].timestamp, user: user});
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
		delete rooms[room]?.users[user];
		console.log("users in room: "+room,rooms[room]?.users)
		// if( rooms[room] && Object.keys(rooms[room]?.users).length === 0 ) delete rooms[room];
		// console.log(rooms)
	});
	socket.on("disconnect", () => {
		console.log("user disconnected");
		const data = JSON.parse(decodeURIComponent(socket?.handshake?.headers?.cookie)?.split("=")[1] ?? null);
		delete rooms[data?.room]?.users[data?.username];
		// if( rooms[data?.room] && Object.keys(rooms[data?.room]?.users).length === 0 ) delete rooms[data?.room];
	});
});


setTimeout(()=>{
	WSM_FetchAllData();
	WSM_FetchSearchData();
},3600000);


function getRandomColor() {
	var percent = [10,20,30,40,50,60,70,80,90];
	let color = "";
	color += Math.floor(Math.random() * 361)+"deg";
	color += " " + percent[Math.floor(Math.random() * 9)]+ "%";
	color += " " + percent[Math.floor(Math.random() * 9)]+ "%";

	if(colors.length){
		if( colors.includes(color)){
			color = getRandomColor();
		}
	}
	return color;
}