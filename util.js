import { text } from 'express';
import fs from 'fs/promises';
import fetch from 'node-fetch';

export async function WSM_FetchSearchData(){
    try{
        const response = await (await fetch('https://watchsomuch.to/Includes/BasicData.aspx')).text();
        const regex = new RegExp(/(?<=},\W\s+data:).+(?=,\W+.+standAlone:)/);
        const raw = response.match(regex)[0];
        WriteJson("searchData.json",raw);
    } catch (error) {
        console.log(error);
    }
}
export async function WSM_FetchAllData(){
    try{
        let movies = [];
        let series = [];
        const response = await (await fetch('https://watchsomuch.to/Includes/MovieData.aspx?t=0')).text();
        const regex = new RegExp(/(?<=MovieData\.TempData=).+(?=;)/);
        let raw = response.match(regex)[0];
        raw = raw.replace(/,[\n\s]*,/g, (m)=> ",0," );

        let data = await JSON.parse(raw);
        data = data.sort(function (a, b) {
                // return a[25] > b[25] ? 1 : -1;
                if (a[27] == b[27]) return a[25] > b[25] ? 1 : -1;
                return a[27]==0 ? 1 : -1;
        });

        for( const item of data ){
            const regex1 = new RegExp(/\b[248]\b|\b14\b/);
            const regex2 = new RegExp(/s\d+|\d+/i);
            ( regex1.test(item[28]) || regex2.test(item[4]) ) ? series.push(item) : movies.push(item);
        };
            
        movies = JSON.stringify(movies);
        series = JSON.stringify(series);
        WriteJson("newMovies.json",movies);
        WriteJson("newSeries.json",series);
    } catch (error) {
        console.log(error);
    }
}
export async function WSM_FetchMoviesInfo(data){
    try{
        const movieData = {};
        data.forEach((elem) => {
            const id = elem[0].toString().replace(/\d+/g, (m)=>{
                return "000000000".substr(m.length) + m;
            });
            movieData[elem[0]] = {
                id: id,
                img: `https://media.watchsomuchproxy.com/PosterL/${id}_Full.jpg`,
                torrentsLink: `https://watchsomuch.to/Movies/ajMovieTorrents.aspx?mid=${elem[0]}`
            }
        });
        const data = JSON.stringify(movieData);
        WriteJson("BasicInfoForAll.json",data);
    } catch (error) {
        console.log(error);
    }
}

export function WriteJson(file, data){
    try{
        fs.writeFile(`${file}`, data, function (err) {
            if (err) throw err;
            console.log('Replaced!');
        });
    }catch(err){
        console.log(err);
    }
}
export async function ReadJson(file){
    try{
        const raw = await fs.readFile(`${file}`, { encoding: 'utf8' });
        const data = await JSON.parse(raw);
        // console.log(data)
        return data;
    }catch(err){
        console.log(err);
    }
}