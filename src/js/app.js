/*
 * Key of the API
 */
const appid = `0f6616aa0f2759bb060a75b5cabbd0ac`;

/*
 * Capture the browser coordinates and send the longitude and latitude to the getCurrentWeather 
 * and getWeatherForecast functions to get the current weather and the weather forecast for the next 5 days.
 */
navigator.geolocation.getCurrentPosition(position => {
  let currentWeather = getCurrentWeather(position.coords.latitude, position.coords.longitude);
  let weatherForecast = getWeatherForecast(position.coords.latitude, position.coords.longitude);

  Promise.all([currentWeather, weatherForecast]).then(weather => {
    const currentConditions = document.querySelector(`.current-conditions`);
    const forecastHTML = document.querySelector(`.forecast`);
    currentConditions.innerHTML = weather[0];
    weather[1].forEach(forecast => {
      forecastHTML.innerHTML += forecast;
    });
  });

});

/*
 * This function receives the latitude and longitude of the browser and queries them at api.openweathermap.org
 * and returns the current temperature.
 */
function getCurrentWeather(latitude, longitude) {
  return fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${appid}&units=metric`)
    .then(response => response.json())
    .then(json => {
      return drawCurrentWeather(json.main.temp, json.weather[0].description, json.weather[0].icon);
    });
}

/*
 * This function receives the temperature, the weather description and the weather icon and returns 
 * the HTML code with the current temperature.
 */
function drawCurrentWeather(temperature, weatherDescription, weatherIcon) {
  return `<h2>Current Conditions</h2>
     <img src="http://openweathermap.org/img/wn/${weatherIcon}@2x.png"/>
     <div class="current">
      <div class="temp">${Math.round(temperature)}℃</div>
      <div class="condition">${weatherDescription}</div>
    </div>`;
}

/*
 * This function receives the latitude and longitude of the browser and queries them at api.openweathermap.org
 * and returns the forecast for the next 5 days.
 */
function getWeatherForecast(latitude, longitude) {
  return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${appid}&units=metric`)
    .then(response => response.json())
    .then(json => {
      return getNextForecasts(json.list.slice(0));
    });
}

/*
 * This function obtains the forecast for the next 5 days and filters (omits) the forecast 
 * that does not correspond to the next 5 days.
 */
function getNextForecasts(forecasts) {
  const date = new Date();
  const forecastsPerDayHTML = [];
  const forecastsPerDay = forecasts.reduce((forecastAccumulator, forecast) => {
    forecastAccumulator[new Date(forecast.dt_txt).getDate()] = (forecastAccumulator[new Date(forecast.dt_txt).getDate()] || 0) + 1;
    return forecastAccumulator;
  }, {});

  const arrayForecastsPerDay = Object.keys(forecastsPerDay).map(key => {
    return [Number(key), forecastsPerDay[key]];
  });

  let index = 0;
  if (arrayForecastsPerDay[0][0] === date.getDate()) {
    forecasts.splice(0, arrayForecastsPerDay[0][1]);
    index++
  }

  let nameOfTheDay = 0;
  for (let i = 0; i < 5; i++) {
    forecastsPerDayHTML.push(getHighestAndLowestTemp(forecasts.splice(0, arrayForecastsPerDay[index++][1]), getNextDays(date.getDay())[nameOfTheDay++]));
  }
  return forecastsPerDayHTML;
}

/*
 * This function obtains the name of the next 5 days.
 */
function getNextDays(day) {
  let nextDay = day;
  const daysOfWeek = [`Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`];
  const numberOfDaysOfTheWeek = 6; // From 0 to 6 (7 element)
  const nextFiveDays = [];
  const numberOfDaysToReturn = 5;
  for (let i = 1; i <= numberOfDaysToReturn; i++) {
    if (nextDay > numberOfDaysOfTheWeek) nextDay = 0;
    nextFiveDays.push(daysOfWeek[nextDay++]);
  }
  return nextFiveDays;
}

/*
 * This function obtains the highest temperature and the lowest temperature forecasted per day.
 */
function getHighestAndLowestTemp(forecasts, nameOfTheDay) {
  let tempMax = forecasts[0].main.temp_max;
  let tempMin = forecasts[0].main.temp_min;
  let weatherDescription = forecasts[0].weather[0].description;
  let weatherIcon = forecasts[0].weather[0].icon;
  forecasts.forEach(forecast => {
    if (forecast.dt_txt.substring(11, 19) === `12:00:00`) {
      weatherDescription = forecast.weather[0].description;
      weatherIcon = forecast.weather[0].icon;
    }

    if (forecast.main.temp_max > tempMax) tempMax = forecast.main.temp_max;
    if (forecast.main.temp_min < tempMin) tempMin = forecast.main.temp_min;
  });
  return drawWeatherForecast(tempMax, tempMin, weatherDescription, weatherIcon, nameOfTheDay);
}

/*
 * This function receives the highest temperature, the lowest temperature, the weather description 
 * and the name of the day and returns the HTML code with forecasts for the next 5 days.
 */
function drawWeatherForecast(highTemperature, lowTemperature, weatherDescription, weatherIcon, nameOfTheDay) {
  return `
    <div class="day">
    <h3>${nameOfTheDay}</h3>
    <img src="http://openweathermap.org/img/wn/${weatherIcon}@2x.png" />
    <div class="description">${weatherDescription}</div>
    <div class="temp">
      <span class="high">${Math.round(highTemperature)}℃</span>/<span class="low">${Math.round(lowTemperature)}℃</span>
    </div>
    </div> 
  `;
}