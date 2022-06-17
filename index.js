import express, { urlencoded } from "express";
import cors from "cors";
import {router, socket} from "./routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { WSM_FetchSearchData, ReadJson, WriteJson, WSM_FetchAllData } from "./util.js";

export const app = express();
const httpServer = createServer(app);

export let rooms = {};
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
	socket.on("ping", (callback) => {
		callback();
	  });
	socket.on("initialize_room", ({room,user},callback) => {
		if( !rooms?.[room] ) return;
		const color = getRandomColor();
		socket.join(room);
		rooms[room].users[user] = { id: socket.id, color: color };
		callback( rooms[room] );
		socket.to(room).emit("addPlayer_room",{ user: user, id: socket.id, color: color});
		// console.log(rooms[room],rooms)	
	});

	socket.on("leave_room", ({ room, user}) => {
		console.log(`user= ${user} with id = ${socket.id} left the room = ${room}`);
		socket.leave(room);
		delete rooms[room]?.users[user];
		console.log("users in room: "+room,rooms[room]?.users)
		if( !Object.keys(rooms).length ) delete rooms[room];
		// console.log(rooms)
	});
	socket.on("disconnect", () => {
		console.log("user disconnected");
		const data = JSON.parse(decodeURIComponent(socket?.handshake?.headers?.cookie)?.split("=")[1] ?? null);
		delete rooms[data.room]?.users[data?.username];
		if( !Object.keys(rooms)?.length ) delete rooms[data?.room];
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
	for (var i = 0; i < 2; i++) {
	  color += " " + percent[Math.floor(Math.random() * 10)]+ "%";
	}
	if(colors.length){
		if( colors.includes(color)){
			color = getRandomColor();
		}
	}
	return color;
}