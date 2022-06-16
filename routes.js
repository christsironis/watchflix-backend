import express from "express";
import { searchData, movies, series, app , rooms} from "./index.js";
import cookieParser from "cookie-parser";

export const router = express.Router();
export const socket = express.Router();
router.use(cookieParser());

socket.post("/createRoom", async function (req, res) {;
	console.log(req.body)
	if( !req.body.title || !req.body.magnet || !req.body.username){ 
		res.status(200).send(`You didn't fill all of the filleds`);
        return;
    }
	const room = CreateRoomId(req.body);
	res.cookie('watchflix', JSON.stringify({...req.body, room: room}), { domain: "localhost:3000", maxAge: 60000 * 60 * 24 });
	res.redirect(process.env.CLIENT+"/room/"+room);
	return;
});
socket.post("/joinRoom", async function (req, res) {;
	if( !req.cookies.room || !req.cookies.username){ 
		res.status(200).send(`You didn't fill all of the filleds`);
        return;
    }
	let room = req.cookies.room;
    if(rooms.hasOwnProperty(room)){
		res.redirect(process.env.CLIENT+"/room/"+room);
    }else{
        res.send("Room doesn't exists, try to create a room first");
    }
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

function CreateRoomId(rooms) {
    let room = Math.floor(Math.random() * 90000) + 10000;
    while (rooms.hasOwnProperty(room)) {
        room = Math.floor(Math.random() * 90000) + 10000;
    }
    rooms[room] = {users:{}, magnet: null, title: null, hash: null, subs: null }
    return room;
}