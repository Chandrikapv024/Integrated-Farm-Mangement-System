/**
 * @desc    Get live or simulated weather telemetry & agricultural advisory
 * @route   GET /api/weather
 * @access  Private
 */
const getWeather = async (req, res, next) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : 12.9716;
    const lng = req.query.lng ? parseFloat(req.query.lng) : 77.5946;

    const apiKey = process.env.WEATHER_API_KEY;
    const apiUrl = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';

    let weatherData = null;

    if (apiKey && apiKey.trim() !== '') {
      try {
        const currentWeatherUrl = `${apiUrl}/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
        const forecastUrl = `${apiUrl}/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;

        console.log(`[Weather API] Requesting live telemetry from OpenWeatherMap for Lat: ${lat}, Lng: ${lng}...`);
        const [weatherRes, forecastRes] = await Promise.all([
          fetch(currentWeatherUrl),
          fetch(forecastUrl)
        ]);

        if (weatherRes.ok && forecastRes.ok) {
          console.log('[Weather API] Successfully retrieved live OpenWeatherMap data!');
          const current = await weatherRes.json();
          const forecastJson = await forecastRes.json();

          // Process 5-day / 3-hour OpenWeather forecast into daily summaries
          const dailyMap = {};
          forecastJson.list.forEach((item) => {
            const dateStr = item.dt_txt.split(' ')[0]; // YYYY-MM-DD
            if (!dailyMap[dateStr]) {
              dailyMap[dateStr] = {
                temps: [],
                conditions: [],
                pop: []
              };
            }
            dailyMap[dateStr].temps.push(item.main.temp);
            dailyMap[dateStr].conditions.push(item.weather[0]?.main || 'Clear');
            dailyMap[dateStr].pop.push(item.pop || 0);
          });

          const forecastDays = Object.keys(dailyMap).slice(0, 7).map((dateKey, index) => {
            const dayData = dailyMap[dateKey];
            const dateObj = new Date(dateKey);
            const dayName = index === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const tempMax = Math.round(Math.max(...dayData.temps));
            const tempMin = Math.round(Math.min(...dayData.temps));
            const avgPop = Math.round((dayData.pop.reduce((a, b) => a + b, 0) / dayData.pop.length) * 100);

            const mainCond = dayData.conditions[0];
            let icon = 'sun';
            if (mainCond.includes('Rain')) icon = 'cloud-rain';
            else if (mainCond.includes('Thunderstorm')) icon = 'cloud-lightning';
            else if (mainCond.includes('Drizzle')) icon = 'cloud-drizzle';
            else if (mainCond.includes('Clouds')) icon = 'cloud-sun';

            return {
              day: dayName,
              date: formattedDate,
              tempMax,
              tempMin,
              condition: mainCond,
              rainProb: avgPop,
              icon
            };
          });

          weatherData = {
            temperature: Math.round(current.main.temp * 10) / 10,
            humidity: current.main.humidity,
            windSpeed: Math.round((current.wind.speed * 3.6) * 10) / 10, // m/s to km/h
            rainfall: current.rain ? (current.rain['1h'] || current.rain['3h'] || 0) : 0,
            condition: current.weather[0]?.main || 'Partly Cloudy',
            location: `${current.name || 'Farm Station'} (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            forecast: forecastDays,
            alert: current.main.humidity > 80 || (current.rain && current.rain['1h'] > 10) ? {
              severity: 'High',
              message: 'High moisture and precipitation risk detected in local station telemetry.',
              action: 'Delay overhead irrigation and postpone fertilizer top-dressing to prevent leaching.'
            } : undefined
          };
        } else {
          console.warn(`[Weather API Warning] OpenWeatherMap returned status ${weatherRes.status}. (If key was generated recently, OpenWeatherMap requires ~10-30 mins for key activation). Using structured fallback.`);
        }
      } catch (err) {
        console.warn('[Weather API Warning] OpenWeatherMap request failed, using microclimate telemetry fallback:', err.message);
      }
    }

    // Fallback telemetry if API key is missing or request failed
    if (!weatherData) {
      weatherData = {
        temperature: 27.5,
        humidity: 68,
        windSpeed: 14.2,
        rainfall: 12.8,
        condition: 'Partly Cloudy',
        location: `Green Valley Farm Station (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        forecast: [
          { day: 'Today', date: 'Sep 21', tempMax: 29, tempMin: 21, condition: 'Partly Cloudy', rainProb: 20, icon: 'cloud-sun' },
          { day: 'Tue', date: 'Sep 22', tempMax: 26, tempMin: 20, condition: 'Heavy Rain', rainProb: 85, icon: 'cloud-rain' },
          { day: 'Wed', date: 'Sep 23', tempMax: 24, tempMin: 19, condition: 'Thunderstorm', rainProb: 90, icon: 'cloud-lightning' },
          { day: 'Thu', date: 'Sep 24', tempMax: 27, tempMin: 20, condition: 'Light Rain', rainProb: 40, icon: 'cloud-drizzle' },
          { day: 'Fri', date: 'Sep 25', tempMax: 30, tempMin: 22, condition: 'Sunny', rainProb: 10, icon: 'sun' },
          { day: 'Sat', date: 'Sep 26', tempMax: 31, tempMin: 23, condition: 'Sunny', rainProb: 5, icon: 'sun' },
          { day: 'Sun', date: 'Sep 27', tempMax: 28, tempMin: 21, condition: 'Partly Cloudy', rainProb: 15, icon: 'cloud-sun' }
        ],
        alert: {
          severity: 'High',
          message: 'Heavy rainfall event (>45mm) predicted within 24–36 hours.',
          action: 'Delay scheduled overhead irrigation across Field A & Field B to prevent soil waterlogging and nutrient leaching.'
        }
      };
    }

    res.status(200).json(weatherData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeather
};
