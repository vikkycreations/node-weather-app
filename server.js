const express = require("express");
const app = express();
const https = require("https");
const { query } = require("express");
const axios = require("axios").default;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views"); 

/* This is used for development purpose only. */
const agent = new https.Agent({
  rejectUnauthorized: false,
  requestCert: true,
});

const icons = {
  cloudy: "https://image.flaticon.com/icons/svg/365/365227.svg",
  rain: "https://image.flaticon.com/icons/svg/365/365224.svg",
  "clear-day": "https://image.flaticon.com/icons/svg/365/365237.svg",
  "partly-cloudy-day": "https://image.flaticon.com/icons/svg/365/365229.svg",
  "clear-night":"https://image.flaticon.com/icons/svg/365/365223.svg",
  default: "https://image.flaticon.com/icons/svg/3168/3168993.svg"
}


const getCoordinates = (place, types) => {
  const api_mapbox = `https://api.mapbox.com/geocoding/v5/mapbox.places/${place}.json?types=${types}&access_token=pk.eyJ1Ijoic3luZXJneTI0MTEiLCJhIjoiY2p4NXc0cm53MDZoODQwbHFuNzdzMzV5NCJ9.DKIDo6bcG51yLXf2DmlYcQ`;
  return axios.get(api_mapbox, {
    httpsAgent: agent
  })
    .then(data => data.data)
    .catch(e => e);
}


const getWeather = ([long, lat]) => {
  const api_darkSky = `https://api.darksky.net/forecast/473fe696d21e65026547b2d50b56014c/${lat},${long}`;
  return axios.get(api_darkSky, {
    httpsAgent: agent
  })
    .then(data => data.data)
    .catch(e => e);
}


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
})


app.get("/weather", async (req, res) => {
  if (req.query) {
    const { place, types } = req.query;
    const { features } = await getCoordinates(place, types);
    if (features.length){
      const {
        text: place_name,
        place_name: location,
        geometry: {
          coordinates
        }
      } = features[0]

      const data = await getWeather(coordinates);

      const weather_data = {
        today: {
          date: new Date(data.currently.time * 1000).toDateString(),
          summary: data.currently.summary,
          temperature: data.currently.temperature,
          icon: icons[data.currently.icon] ? icons[data.currently.icon] : icons.default,
          title: data.currently.icon,
        },
        daily: data.daily.data.map(({ time, summary, icon, temperatureMin, temperatureMax}) => {
          return {
            date: new Date(time * 1000).toDateString(),
            summary,
            icon: icons[icon] ? icons[icon] : icons.default,
            title: icon,
            temperatureMin,
            temperatureMax
          }
        })
      }

      res.render('index', {
        place: place_name,
        location,
        long: coordinates[0],
        lat: coordinates[1],
        weather: weather_data,
      })
    }
    else {
      res.send("Cannot found the place. Try again..!")
    }
  }
})


app.listen(9090, () => {
  console.log("Server running at port 9090");
})