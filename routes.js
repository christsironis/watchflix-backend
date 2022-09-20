import express from "express";
import { searchData, movies, series, app , rooms, users} from "./index.js";
import fileUpload from 'express-fileupload';
import cookieParser from "cookie-parser";
import fs from "fs";
import * as url from 'url';

export const router = express.Router();
export const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
router.use(cookieParser());
router.use(fileUpload());

router.get('/download/:room/:file', function(req, res) {
	// if( !req.params.room || !req.params.file ) return;

	let reqRoom = req.params.room;
	let reqFile = req.params.file;
	// res.setHeader("content-type","text/txt; charset=utf-8");
	// res.setHeader("Content-Length", "43630");

	// var filestream = fs.createReadStream(`${__dirname}/subs/${reqRoom}/${reqFile}`);
	// filestream.pipe(res);
	// res.type('webvtt');
	res.download(`${__dirname}/subs/${reqRoom}/${reqFile}`,reqFile);
});
router.post('/upload', function(req, res) {
	let reqRoom = Object.keys(req.files);
	console.log(req)
	if (!req.files || reqRoom.length === 0) {
		return res.status(400).send('No files were uploaded.');
	}

	let subFolder = `${__dirname}/subs/${reqRoom[0]}`;

	if (!fs.existsSync(subFolder)){
		fs.mkdirSync(subFolder);
	}

	// The name of the input field 
	let file = req.files[ reqRoom[0] ];
  
	// Use the mv() method to place the file somewhere on your server
	file.mv( `${subFolder}/${file.name}`, function(err) {
		if (err)
		return res.status(500).send(err);
		fs.readFile(`${subFolder}/${file.name}`,{encoding:'utf8', flag:'r'}, function(err, data) {
			if (err) {
				return res.status(500).send('Problem reading srt.');
			}
			fs.writeFile(`${subFolder}/${file.name}`, 'WEBVTT FILE \n\n'+data, function (err) {
				if (err) {
					return res.status(500).send('Problem converting to webvtt.');
				}
				rooms[reqRoom].subs['NN'] = { ...rooms[reqRoom].subs['NN'], [file.name]: {name: file.name,url: `http://${req.headers.host}/api/download/${reqRoom[0]}/${file.name}`,language: 'NN',isoLang: 'NN'} };
				res.json(`${file.name} uploaded!`);
			  })
		  });
	});
});
router.post("/createRoom", async function (req, res) {;
	// console.log(req.body)
	if( !req.body.title || !req.body.magnet || !req.body.username){ 
		res.status(400).send(`You didn't fill all of the filleds`);
        return;
    }
	res.send( `${CreateRoomId(req.body)}` );
	return;
});
router.post("/joinRoom", async function (req, res) {;
	const room = req.body?.room;
	const user = req.body?.username;
	if( !room || !user){ 
		res.status(400).send(`You didn't fill all of the filleds`);
        return;
    }
    if( !rooms.hasOwnProperty(room) ){
        res.status(400).send("Room doesn't exists, try to create a room first");
		return;
	}
	if( users[room].hasOwnProperty(user) ){
		res.status(400).send("Username already exists");
		return;
	}
	res.send(room);
});
router.post("/roomExists", async function (req, res) {;
	const room = req.body.room;
	const user = req.body?.username;
	if( !room){ 
		res.status(400).send(`You didn't fill all of the filleds`);
        return;
    }
    if( !rooms.hasOwnProperty(room) ){
        res.status(400).send("Room doesn't exists, try to create a room first");
		return;
	}
	if( users[room].hasOwnProperty(user) ){
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
    rooms[room] = { magnet: data.magnet, title: data.title, timestamp: 0, date: 0 , imdbID: data.imdbID, type: data.type, season: data.season, episode: data.episode,ispaused: true, subs: {}, colors: [] }
    users[room] = {};
	return room;
}