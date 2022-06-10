import 'dotenv/config';
import express, { urlencoded } from "express";
import cors from "cors";
import {router, socket} from "./routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { WSM_FetchSearchData, ReadJson, WriteJson, WSM_FetchAllData } from "./util.js";

export const app = express();
const httpServer = createServer(app);

export let rooms = {};
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
	console.log(socket.conn.transport.name);
	socket.on("ping", (callback) => {
		console.log("ping")	
		callback();
	  });
	socket.on("initialize_room", ({room,user},callback) => {
		if(!Object.keys(rooms).includes(room)) return;
		if(!Object.keys(rooms[room]?.users).length){ return; }
		rooms[room].users[user].id = socket.id;
		console.log(rooms[room])	
		callback(rooms[room].users);
		socket.join(room);
		socket.to(room).emit("addPlayer_room",{name:user,id: socket.id, color: rooms[room].users[user].color});
	});

	socket.on("startGame",(room)=>{
		if(!rooms?.[room]){ return; }
		if(rooms?.[room]?.activeRound){ return; }
		rooms[room].winners={};
		rooms[room].activeRound=true;
		io.in(room).emit("startTimer");
		setTimeout(()=>{
			rooms[room].activeRound=false;
			if(!Object.keys(rooms[room].winners).length){ 
				io.in(room).emit("results",{1:{username:"Do you really know how to play?"}});
				return;
			}
			io.in(room).emit("results",rooms[room].winners);
		},(rooms[room].countdown + rooms[room].delay)*1000);
	});

	socket.on("pressed",({room,username})=>{
		let index = Object.keys(rooms[room].winners).length + 1;
		if(Object.keys(rooms[room].winners).length){
			for(const x in rooms[room].winners){
				if(rooms[room].winners[x].username==username){ return; }
			}
		}
		rooms[room].winners[index]={username:username, color: rooms[room].users[username].color};
	});

	socket.on("disconnect", () => {
		let data={};
		for(let room in rooms){
			for (const [user, {id}] of Object.entries(rooms[room].users)) {
				if(id == socket.id){
					delete rooms[room].users[user];
					data.room = room;
					data.user = user;
					data.id = socket.id;
				}
			}
		}
		socket.leave(data.room);
		io.in(data.room).emit("eraseUser",data);
		console.log("user disconnected");
	});
});


setTimeout(()=>{
	WSM_FetchAllData();
	WSM_FetchSearchData();
},3600000);
