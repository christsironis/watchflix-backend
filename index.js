import "dotenv/config";
import express, { urlencoded } from "express";
import cors from "cors";
const app = express();
let router = express.Router();
import { WSM_FetchSearchData, ReadJson, WriteJson, WSM_FetchAllData } from "./util.js";

let searchData = [];
let movies = [];
let series = [];
ReadJson("searchData.json").then( data=> searchData = data );
ReadJson("newMovies.json").then( data=> movies = data );
ReadJson("newSeries.json").then( data=> series = data );

//required in order to receive json data
app.use(express.json());
app.use(express.urlencoded({ extended: true })) 
app.use(cors({ origin: "*" }));
app.use("/api", router);

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

let port = process.env.PORT || "3000";

app.listen(port, () => {
	console.log("Listening to port " + port);
});
// WSM_FetchAllData();
// WSM_FetchSearchData();
