import express, { urlencoded } from "express";
import cors from "cors";
import {router} from "./routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { WSM_FetchSearchData, ReadJson, WriteJson, WSM_FetchAllData } from "./util.js";

export const app = express();
const httpServer = createServer(app);

export let rooms = {"25":{timestamp:0,date: 0,ispaused:true, colors: [],magnet:"magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss%3A%2F%2Ftracker.fastcast.nz&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F", imdbID: "1190634", type: "movie", season: null, episode: null, subs:{'nn':{'nnn':{name:'Oldboy.aaaaa',url:'http://localhost:3001/api/download/25/Oldboy.2003.720p.BluRay.x264.YTS.MX-English.vtt',isoLang:'en', language: 'en'}}}}};
export let users = {"25":{}, socketIDs: {}};
export let searchData = [];
export let movies = [];
export let series = [];
ReadJson("searchData.json").then( data=> searchData = data );
ReadJson("newMovies.json").then( data=> movies = data );
ReadJson("newSeries.json").then( data=> series = data );

//required in order to receive json data
app.use(express.json());
app.use(urlencoded({ extended: true })) 
app.use(cors({ origin: "*" ,withCredentials: true}));
app.use("/api", router);

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
	// console.log(socket.handshake);
	console.log(socket.id);
	socket.on("timedifferencev1",( dateEmited ) => {
		const dateNow = Date.now();
		const emitionDelay = dateNow - new Date(dateEmited).getTime();
		console.log("V1 dateNow= "+ dateNow," dateEmited= "+new Date(dateEmited).getTime()," delay= "+emitionDelay)
	  });
	socket.on("timedifferencev2",( dateEmited ) => {
		const dateNow = Date.now();
		const emitionDelay = dateNow - dateEmited;
		console.log("V2 dateNow= "+ dateNow," dateEmited= "+dateEmited," delay= "+emitionDelay)
	  });
	socket.on("ping",( room, callback) => {
		if( !rooms[room] ) return;
		const dateNow = Date.now();
		if(!rooms[room]?.ispaused) {
			rooms[room].timestamp = dateNow - rooms[room]?.date;
		}
		callback(rooms[room]?.timestamp, dateNow);
	  });
	socket.on("initialize_room", ({room,user},callback) => {
		if( !rooms?.[room] ) return;
		const color = getRandomColor(room);
		socket.join(room);
		users[room][user] = { id: socket.id, color: color };
		users.socketIDs[socket.id] = { user: user, room: room };
		rooms[room].colors.push( color );
		socket.to(room).emit("addPlayer_room",{ user: user, id: socket.id, color: color});
		callback( { users: users[room], subs: rooms[room].subs } );
	});
	socket.on("pause", ({ videoTime, user, room, dateEmited }) =>{
		socket.to(room).emit("pause", {videoTime: videoTime, user: user /* , dateEmited: Date.now() */ });
		rooms[room].timestamp = videoTime;
		rooms[room].ispaused = true;
		console.log("user paused "," serverTimestamp= ", rooms[room].timestamp ," videoTime= ",videoTime," emitionDelay= ", Date.now() - dateEmited )
	});
	socket.on("play", ({ videoTime, user, room, dateEmited }) =>{
		io.to(room).emit("play", {videoTime: videoTime, user: user /* , dateEmited: Date.now() */ });
		const dateNow = Date.now();
		rooms[room].date = dateNow -  videoTime;		
		rooms[room].timestamp = videoTime;
		rooms[room].ispaused = false;
		console.log("user played "," serverTimestamp= ", rooms[room].timestamp ," videoTime= ",videoTime," emitionDelay= ", dateNow - dateEmited)
	});
	// Subs
	socket.on("addSub",({room,name,url,language,isoLang}) =>{
		rooms[room].subs[isoLang] = { ...rooms[room].subs[isoLang], [name]: {name,url,language,isoLang} };
		socket.to(room).emit("addSub",{name,url,language,isoLang});
		// console.log(rooms[room].subs)
	});
	socket.on("removeSub",({room,name,isoLang}) =>{
		// console.log(rooms[room].subs);
		// console.log(name,isoLang);
		delete rooms[room].subs?.[isoLang]?.[name];
		if( rooms[room].subs[isoLang] && Object.keys(rooms[room].subs[isoLang]).length === 0 ) delete rooms[room].subs[isoLang];
	});
	// Messages
	socket.on("newMessage",({room,user,text}) =>{
		socket.to(room).emit("newMessage",{user: user, text: text});
		// console.log(rooms[room].subs)
	});
	socket.on("leave_room", ({ room, user}) => {
		// console.log(socket?.handshake);
		console.log(`user= ${user} with id = ${socket.id} left the room = ${room}`,users[room]);
		socket.leave(room);
		delete users[ users.socketIDs?.[socket.id]?.room ]?.[ users.socketIDs?.[socket.id]?.user ];
		// if( rooms[data?.room] && Object.keys(users[data?.room]).length === 0 ) { delete rooms[data?.room]; delete users[data?.room];}
	});
	socket.on("disconnect", () => {
		// console.log(socket?.handshake);
		// console.log(users.socketIDs?.[socket.id]?.user+" user disconnected");
		delete users[ users.socketIDs?.[socket.id]?.room ]?.[ users.socketIDs?.[socket.id]?.user ];
		// for(const room in users){
		// 	for (const [user, {id}] of Object.entries(users[room])) {
		// 		if(id == socket.id){
		// 			delete users[room][user];
		// 		}
		// 	}
		// }
		// if( rooms[data?.room] && Object.keys(users[data?.room]).length === 0 ) { delete rooms[data?.room]; delete users[data?.room];}
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