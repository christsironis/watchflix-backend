import express from "express";
import { searchData, movies, series, app , rooms} from "./index.js";
import cookieParser from "cookie-parser";

export const router = express.Router();
export const socket = express.Router();
router.use(cookieParser());

socket.post("/createRoom", async function (req, res) {;
	// console.log(req.body)
	if( !req.body.title || !req.body.magnet || !req.body.username){ 
		res.status(400).send(`You didn't fill all of the filleds`);
        return;
    }
	res.send( `${CreateRoomId(req.body)}` );
	return;
});
socket.post("/joinRoom", async function (req, res) {;
	const room = req.body?.room;
	const user = req.body?.username;
	if( !room || !user){ 
		res.status(400).send(`You didn't fill all of the filleds`);
        return;
    }
    if(!rooms.hasOwnProperty(room)){
        res.status(400).send("Room doesn't exists, try to create a room first");
		return;
	}
	if(rooms[room]?.users.hasOwnProperty(user)){
		res.status(400).send("Username already exists");
		return;
	}
	res.send(room);
});
socket.post("/roomExists", async function (req, res) {;
	const room = req.body.room;
	const user = req.body?.username;
	if( !room){ 
		res.status(400).send(`You didn't fill all of the filleds`);
        return;
    }
    if(!rooms.hasOwnProperty(room)){
        res.status(400).send("Room doesn't exists, try to create a room first");
		return;
	}
	if(rooms[room]?.users.hasOwnProperty(user)){
		res.status(400).send("Username already exists");
		return;
    }
	res.status(200).end();
});

router.get("/searchdata", async function (req, res) {
	res.json(searchData);
});
router.get("/newMovies", async function (req, res) {
	const page = parseInt(req.query.page);
	const limit = parseInt(req.query.limit);
	const start = (page - 1) * limit;
	const end = page * limit;
	res.json(movies.slice(start,end));
});
router.get("/newSeries", async function (req, res) {
	const page = parseInt(req.query.page);
	const limit = parseInt(req.query.limit);
	const start = (page - 1) * limit;
	const end = page * limit;
	res.json(series.slice(start,end));
});
router.get("/:type/:id",async function (req, res) {
	const type = req.params.type;
	const id = parseInt(req.params.id);
	let film;
	if( type === "movie" ){
		film = movies.find(item => item[0] === id );
	} else if( type === "serie" ){
		film = series.find(item => item[0] === id );
	}else{
		return;
	}
	res.json(film);
});

function CreateRoomId(data) {
    let room = Math.floor(Math.random() * 90000) + 10000;
    while (rooms.hasOwnProperty(room)) {
        room = Math.floor(Math.random() * 90000) + 10000;
    }
    rooms[room] = {users:{}, magnet: data.magnet, title: data.title, hash: data.hash, timestamp: 0, timeInterval: null, subs: null }
    return room;
}