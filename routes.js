import express from "express";
import { searchData, movies, series, app , rooms} from "./index.js";
// import cookieParser from "cookie-parser";
// import {rooms,getRandomColor} from "./app.js";

export const router = express.Router();
export const socket = express.Router();
// router.use(cookieParser());

socket.post("/getroom", async function (req, res) {
	console.log(req.body)
	const room = CreateRoomId(req.body);
	res.redirect(301,"http://localhost:3000/room/"+room);
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