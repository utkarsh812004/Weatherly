// ====== CONFIG ======
const apiKey = "580a7cdd869fd9d1ab016369f629ce21"; // user's key (as provided)
const weatherBase = "https://api.openweathermap.org/data/2.5/weather";
const forecastBase = "https://api.openweathermap.org/data/2.5/forecast";
const oneCallBase = "https://api.openweathermap.org/data/2.5/onecall";

// ====== DOM REFS ======
const disasterAlerts = document.getElementById('disasterAlerts');
const disasterAlertMsg = document.getElementById('disasterAlertMsg');
const emergencyGuide = document.getElementById('emergencyGuide');
const aqiAlerts = document.getElementById('aqiAlerts');
const aqiValue = document.getElementById('aqiValue');
const aqiAdvice = document.getElementById('aqiAdvice');
const pollenAlert = document.getElementById('pollenAlert');
const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const weatherInfo = document.getElementById('weatherInfo');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');
const farmingSection = document.getElementById('farmingAdvisory');
const rainCard = document.getElementById('rainPredictionCard');
const rainDays = document.getElementById('rainDays');

// ====== EVENTS ======
searchBtn.addEventListener('click', ()=> fetchWeather());
cityInput.addEventListener('keydown', (e)=> { if(e.key === 'Enter') fetchWeather(); });
closeModal.addEventListener('click', ()=> hideModal());
modal.addEventListener('click', (e)=> { if(e.target === modal) hideModal(); });

// ====== HELPERS: Advisory logic ======
function getAdvisory(temp) {
  if (temp < 0) return "❄️ Bhai, bahut thand hai, crops freeze ho sakti hain. Animals ko bhi thand se bachao.";
  else if (temp < 20) return "🌥️ Thandi mausam hai, crop growth slow hoti hai. Khaad ka use moderate rakho.";
  else if (temp < 25) return "🌱 Mausam ideal hai. Crops ke liye growth acchi hai. Nami normal hai.";
  else if (temp < 30) return "💧 Garmi badh rahi hai, crops ko paani zyada chahiye. Nami pe dhyan do.";
  else if (temp < 35) return "🔥 Kaafi garmi hai, crops stress me aa sakte hain. Irrigation zyada karna padega.";
  else if (temp < 40) return "☀️ Bahut zyada garmi, kuch crops mar bhi sakti hain. Animals ko shade aur paani do.";
  else return "🚨 Danger level! Crops aur animals dono risk me hain. Farming activities limit karo.";
}

function getFarmingDetails(temp) {
  let details = { fertilizer: "", irrigation: "", animal: "", crop: "" };

  if (temp < 0) {
    details.fertilizer = "Khaad use bahut limited rakho.";
    details.irrigation = "Soil thandi hai, paani kam do.";
    details.animal = "Animals ko warm shelter do.";
    details.crop = "Sirf winter crops ugayein.";
  } else if (temp < 20) {
    details.fertilizer = "Khaad ka use moderate rakho.";
    details.irrigation = "Paani ki zarurat kam hai.";
    details.animal = "Animals ko cold wind se bacha ke rakho.";
    details.crop = "Wheat aur mustard jaise crops sahi hain.";
  } else if (temp < 25) {
    details.fertilizer = "Balanced fertilizer use karo.";
    details.irrigation = "Normal watering sahi hai.";
    details.animal = "Animals ke liye mausam comfortable hai.";
    details.crop = "Wheat, pulses, vegetables best hain.";
  } else if (temp < 30) {
    details.fertilizer = "Light dose of nitrogen-based khaad.";
    details.irrigation = "Morning/evening irrigation karo.";
    details.animal = "Animals ko shade aur hydration do.";
    details.crop = "Paddy, maize grow karne ke liye best.";
  } else if (temp < 35) {
    details.fertilizer = "Khaad limited rakho.";
    details.irrigation = "Daily irrigation zaruri hai.";
    details.animal = "Animals ko fresh paani aur shade do.";
    details.crop = "Sugarcane, cotton ko extra water chahiye.";
  } else if (temp < 40) {
    details.fertilizer = "Khaad avoid karo, crops stress me hain.";
    details.irrigation = "Zyada bar-bar paani do.";
    details.animal = "Animals ko cool shade do.";
    details.crop = "Heat resistant crops ugayein.";
  } else {
    details.fertilizer = "Khaad aur irrigation avoid karo.";
    details.irrigation = "Extreme heat me farming risky hai.";
    details.animal = "Animals ko extreme protection chahiye.";
    details.crop = "Farming activities limit karo.";
  }

  return details;
}

// ====== Rain prediction using forecast list ======
function getRainPrediction(forecastList) {
  if(!Array.isArray(forecastList) || forecastList.length === 0) return "No forecast data available.";
  // Look next 24 hours => roughly first 8 entries (3-hour slots)
  const slots = forecastList.slice(0, 8);
  for (const slot of slots) {
    if (slot && (slot.rain && (slot.rain['1h'] || slot.rain['3h']) )) {
      const rainAmt = slot.rain['1h'] || slot.rain['3h'];
      const time = new Date(slot.dt*1000).toLocaleString([], { hour: '2-digit', minute:'2-digit', day:'numeric', month:'short' });
      return `🌧️ Rain expected around ${time}, intensity ~${rainAmt} mm. Plan irrigation accordingly.`;
    }
    // Some forecasts indicate weather with "weather" tags like "Rain"
    if (slot && Array.isArray(slot.weather) && slot.weather.some(w=>/rain/i.test(w.main || w.description || ''))) {
      const time = new Date(slot.dt*1000).toLocaleString([], { hour: '2-digit', minute:'2-digit', day:'numeric', month:'short' });
      return `🌧️ Rain likely around ${time} (forecast shows rain).`;
    }
  }
  return "No rain expected in next 24 hours 🌞";
}

// ====== UI RENDER HELPERS ======
function buildMetricCard(type, value, label) {
  return `<div class="metric-card" data-type="${type}"><div class="big">${value}</div><small>${label}</small></div>`;
}

function renderWeather(data, forecastData) {
  const icon = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  const temp = Math.round(data.main.temp);
  const feels = Math.round(data.main.feels_like);
  const humidity = data.main.humidity;
  const pressure = data.main.pressure;
  const wind = data.wind.speed;
  const desc = data.weather[0].description;
  const location = `${data.name}, ${data.sys.country}`;

  const rainMsg = getRainPrediction(forecastData ? forecastData.list : []);

  weatherInfo.innerHTML = `
    <div class="row">
      <div class="main-left">
        <div class="icon-wrap"><img src="${iconUrl}" class="weather-icon" alt="icon" /></div>
        <div class="metrics">
          <h2>${location}</h2>
          <div class="muted">${data.weather[0].main} • ${desc}</div>
          <div class="metrics-grid">
            ${buildMetricCard('temp', temp+'°C', 'Temperature (click)')}
            ${buildMetricCard('humidity', humidity+'%', 'Humidity (click)')}
            ${buildMetricCard('pressure', pressure+' hPa', 'Pressure (click)')}
            ${buildMetricCard('wind', wind+' m/s', 'Wind Speed (click)')}
          </div>
        </div>
      </div>
    </div>

    <div class="stats">
      <div class="stat-row"><div>Humidity</div><div class="progress"><i id="g-hum" style="width:0%"></i></div><div><strong>${humidity}%</strong></div></div>
      <div class="stat-row"><div>Pressure</div><div class="progress"><i id="g-pres" style="width:0%"></i></div><div><strong>${pressure} hPa</strong></div></div>
    </div>

    <div class="details">
      <div>Feels like: ${feels}°C</div>
      <div>Wind: ${wind} m/s</div>
      <div>Local time: ${data.dt ? new Date(data.dt*1000).toLocaleString() : '—'}</div>
    </div>

    <div class="hint" style="margin-top:10px">
      <strong>Advisory:</strong> ${getAdvisory(temp)}<br>
      <strong>Rain Prediction:</strong> ${rainMsg}
    </div>

    <div style="margin-top:12px; text-align:center;">
      <button id="farmingBtn">🌾 Farming Advisory</button>
    </div>
  `;

  // animate progress bars
  requestAnimationFrame(()=>{
    const humEl = document.getElementById('g-hum');
    const presEl = document.getElementById('g-pres');
    if(humEl) humEl.style.width = Math.min(100, Math.max(0, humidity)) + '%';
    if(presEl) presEl.style.width = Math.min(100, Math.max(0, (pressure-900))) + '%';
  });

  // attach click handlers for metric cards
  document.querySelectorAll('.metric-card').forEach(card => {
    card.addEventListener('click', ()=> openDetail(card.dataset.type, {temp, feels, humidity, pressure, wind, desc, location}));
  });

  // farming button
  const farmingBtn = document.getElementById('farmingBtn');
  farmingBtn.addEventListener('click', ()=>{
    // fill advisory section
    document.getElementById("advisoryNote").innerText = getAdvisory(temp);
    const details = getFarmingDetails(temp);
    document.getElementById("fertilizerTip").innerText = "💊 Fertilizer: " + details.fertilizer;
    document.getElementById("irrigationTip").innerText = "💧 Irrigation: " + details.irrigation;
    document.getElementById("animalTip").innerText = "🐄 Animals: " + details.animal;
    document.getElementById("cropTip").innerText = "🌱 Crops: " + details.crop;
    farmingSection.style.display = "block";
    // scroll into view on small screens
    farmingSection.scrollIntoView({behavior:'smooth', block:'center'});
  });
}

// ====== Fetching weather + forecast ======
async function fetchWeather() {
  // Disaster Prediction & Alerts
function showDisasterAlerts(cityName) {
  // Mock: Show flood warning for demonstration
  let hour = new Date().getHours();
  if(hour >= 6 && hour <= 18) {
    disasterAlerts.style.display = 'block';
    disasterAlertMsg.innerHTML = `Flood warning in ${cityName} in next 12 hours.`;
    emergencyGuide.innerHTML = `Nearest shelter: <a href='https://www.google.com/maps/search/shelter+near+${encodeURIComponent(cityName)}' target='_blank'>Find Shelter</a><br>Helpline: <a href='tel:108'>108</a> | <a href='tel:112'>112</a>`;
  } else {
    disasterAlerts.style.display = 'none';
    disasterAlertMsg.innerHTML = '';
    emergencyGuide.innerHTML = '';
  }
}
    const city = cityInput.value.trim();
    if(!city){
      weatherInfo.innerHTML = '<div class="hint">Please enter a city like <strong>Dehradun,IN</strong></div>';
      rainCard.style.display = 'none';
      return;
    }
    weatherInfo.style.display = 'block';
    weatherInfo.innerHTML = '<div class="hint">Loading…</div>';
    rainCard.style.display = 'none';
    try {
      const url = `${weatherBase}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
      const furl = `${forecastBase}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
      const [res, fres] = await Promise.all([fetch(url), fetch(furl)]);
      if(!res.ok) {
        const err = await res.json().catch(()=>null);
        throw new Error(err?.message || 'City not found / invalid API key');
      }
      if(!fres.ok) {
        const ferr = await fres.json().catch(()=>null);
        // continue but warn
        console.warn('Forecast API:', ferr);
      }
      const data = await res.json();
      const fdata = await fres.json().catch(()=>null);
      renderWeather(data, fdata);
      // Fetch AQI and pollen
      fetchAQIandPollen(data.coord.lat, data.coord.lon, data.name);
      // Disaster alerts (mock logic, can be replaced with real API)
      showDisasterAlerts(data.name);
      // 5-day rain prediction using forecast API
      if(fdata && fdata.list && Array.isArray(fdata.list)) {
        const dailyRain = {};
        fdata.list.forEach(item => {
          const date = new Date(item.dt*1000);
          const day = date.toLocaleDateString('en-US', { weekday: 'long' });
          // pop = probability of precipitation (0-1), rain = mm
          const pop = item.pop !== undefined ? item.pop : (item.rain ? 0.7 : 0);
          if(!dailyRain[day]) dailyRain[day] = [];
          dailyRain[day].push(pop);
        });
        // Average pop per day
        const rainArr = Object.entries(dailyRain).map(([day, pops]) => {
          const avgPop = Math.round((pops.reduce((a,b)=>a+b,0)/pops.length)*100);
          return { day, rainChance: avgPop };
        });
        renderRainPrediction(rainArr);
      } else {
        rainCard.style.display = 'none';
      }
    } catch (err) {
      console.error(err);
      weatherInfo.innerHTML = `<div class="hint" style="color:#b91c1c">${err.message}</div>`;
      rainCard.style.display = 'none';
    }
}
// Air Quality & Health Alerts
async function fetchAQIandPollen(lat, lon, cityName) {
  // OpenWeatherMap Air Pollution API
  try {
    const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const res = await fetch(aqiUrl);
    if(!res.ok) throw new Error('AQI data not found');
    const aqiData = await res.json();
    let aqi = aqiData.list && aqiData.list[0] ? aqiData.list[0].main.aqi : null;
    let aqiText = '';
    let advice = '';
    if(aqi === 1) { aqiText = 'Good'; advice = 'Air quality sahi hai. Normal activities kar sakte hain.'; }
    else if(aqi === 2) { aqiText = 'Fair'; advice = 'Thoda pollution hai. Sensitive log mask pehnein.'; }
    else if(aqi === 3) { aqiText = 'Moderate'; advice = 'Moderate pollution. Bachcho, elderly ko mask pehnaayein.'; }
    else if(aqi === 4) { aqiText = 'Poor'; advice = 'Pollution zyada hai. Ghar me raho, mask pehnein.'; }
    else if(aqi === 5) { aqiText = 'Very Poor'; advice = 'Bahut zyada pollution! Bahar na niklein, mask zaroor pehnein.'; }
    else { aqiText = 'N/A'; advice = 'AQI data unavailable.'; }
    aqiAlerts.style.display = 'block';
    aqiValue.innerHTML = `AQI (${cityName}): <b>${aqiText}</b>`;
    aqiAdvice.innerText = advice;
    // Pollen (mock, as OpenWeatherMap does not provide pollen)
    // You can integrate a real pollen API if available
    let pollenLevel = Math.random(); // Simulate pollen level
    if(pollenLevel > 0.7) {
      pollenAlert.innerHTML = '🌾 Pollen level high! Allergy-prone log extra care karein.';
    } else if(pollenLevel > 0.4) {
      pollenAlert.innerHTML = '🌾 Pollen level moderate.';
    } else {
      pollenAlert.innerHTML = '';
    }
  } catch (err) {
    aqiAlerts.style.display = 'block';
    aqiValue.innerHTML = 'AQI data unavailable.';
    aqiAdvice.innerText = '';
    pollenAlert.innerText = '';
  }
}

// ...existing code...
// Render rain prediction card for 7 days
function renderRainPrediction(rainArr) {
  if(!Array.isArray(rainArr) || rainArr.length === 0) {
    rainCard.style.display = 'none';
    return;
  }
  rainDays.innerHTML = '';
    rainArr.forEach(({day, rainChance}, idx) => {
      rainDays.innerHTML += `<div style="background:#e3f2fd;padding:12px 18px;border-radius:10px;box-shadow:0 2px 8px #90caf9;min-width:110px;text-align:center;position:relative;">
        <div style="font-size:1.2em;font-weight:bold;color:#1976d2;">${day}</div>
        <div style="font-size:2em;">${rainChance}%</div>
        <div style="font-size:1em;color:#555;">Rain chance</div>
        <button class="farm-btn" id="farmAdviceBtn${idx}" style="margin-top:8px;padding:6px 14px;background:#43a047;color:#fff;border:none;border-radius:6px;cursor:pointer;transition:background 0.3s;">Farming Advice</button>
      </div>`;
    });
    // Add modal for advice if not exists
    if(!document.getElementById('dayAdviceModal')) {
      const dayAdviceModal = document.createElement('div');
      dayAdviceModal.id = 'dayAdviceModal';
      dayAdviceModal.style.display = 'none';
      dayAdviceModal.innerHTML = `
        <div class="day-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(30,42,60,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;">
          <div class="day-card" style="background:#fff;border-radius:32px;box-shadow:0 8px 32px #2228;min-width:340px;max-width:90vw;padding:36px 32px;position:relative;text-align:center;animation:dayCardIn 0.7s;overflow-y:auto;max-height:80vh;">
            <div class="day-logo" style="font-size:3em;animation:dayLogoSpin 1.2s linear infinite alternate;">🌧️</div>
            <div id="dayAdviceContent"></div>
            <button id="dayAdviceCloseBtn" style="position:absolute;top:18px;right:18px;background:#222;color:#fff;border:none;border-radius:50%;width:36px;height:36px;font-size:1.5em;cursor:pointer;box-shadow:0 2px 8px #2224;">×</button>
          </div>
        </div>
        <style>
          @keyframes dayLogoSpin { 0%{transform:rotate(-20deg);} 100%{transform:rotate(20deg);} }
          @keyframes dayCardIn { 0%{opacity:0;transform:scale(0.7);} 70%{opacity:1;transform:scale(1.05);} 100%{opacity:1;transform:scale(1);} }
        </style>
      `;
      document.body.appendChild(dayAdviceModal);
    }
    // Button click event for all days
    rainArr.forEach(({day, rainChance}, idx) => {
      const btn = document.getElementById(`farmAdviceBtn${idx}`);
      if(btn) {
        btn.onclick = function() {
          const dayAdviceModal = document.getElementById('dayAdviceModal');
          const dayAdviceContent = dayAdviceModal.querySelector('#dayAdviceContent');
          let advice = '';
          if(rainChance >= 70) {
            advice = `<b>Barish ka mauka jyaada hai!</b><br>Fasal ko paani se bachayein, extra drainage ka intezam karein. Khaad kam de, zyada paani se nutrients wash ho sakte hain. Sabziyon ko upar chhat ya polythene se cover karein. Katayi avoid karein, fasal bheeg sakti hai. Animals ko shelter me rakhein.`;
          } else if(rainChance >= 40) {
            advice = `<b>Moderate barish ka chance hai.</b><br>Fasal ki jameen ko dheere-dheere paani de. Khaad normal matra me de sakte hain. Katayi kar sakte hain, lekin weather check kar lein. Sabziyon ko halka cover de sakte hain.`;
          } else {
            advice = `<b>Barish ka chance kam hai.</b><br>Fasal ko normal paani de. Khaad normal matra me de. Katayi ke liye mausam sahi hai. Sabziyon ko khula rakh sakte hain.`;
          }
          dayAdviceContent.innerHTML = `<div style="font-size:1.3em;color:#1976d2;margin-bottom:12px;">${day} Rain: <b>${rainChance}%</b></div><p style="font-size:1.1em;color:#222;margin-bottom:18px;">${advice}</p>`;
          dayAdviceModal.style.display = 'block';
          dayAdviceModal.querySelector('#dayAdviceCloseBtn').onclick = function() {
            dayAdviceModal.style.display = 'none';
          };
        };
      }
    });
  // End forEach and modal logic
  rainCard.style.display = 'block';
}

  // Farming advice logic based on rain chance
  window.showFarmingAdvice = function(adviceId, rainChance) {
    // Hide all other advice cards first
    document.querySelectorAll('.farm-advice').forEach(el => {
      if (el.id !== adviceId) {
        el.classList.remove('show');
        el.style.display = 'none';
      }
    });
    // Fix stacking: bring current card to top
    document.querySelectorAll('.farm-advice').forEach(el => {
      el.style.zIndex = '999';
    });
    const adviceEl = document.getElementById(adviceId);
    if(!adviceEl) return;
    let advice = '';
    if(rainChance >= 70) {
      advice = `<b>Barish ka mauka jyaada hai!</b><br>
        <ul>
          <li>Fasal ko paani se bachayein, extra drainage ka intezam karein.</li>
          <li>Khaad kam de, zyada paani se nutrients wash ho sakte hain.</li>
          <li>Sabziyon ko upar chhat ya polythene se cover karein.</li>
          <li>Katayi avoid karein, fasal bheeg sakti hai.</li>
          <li>Animals ko shelter me rakhein.</li>
        </ul>`;
    } else if(rainChance >= 40) {
      advice = `<b>Moderate barish ka chance hai.</b><br>
        <ul>
          <li>Fasal ki jameen ko dheere-dheere paani de.</li>
          <li>Khaad normal matra me de sakte hain.</li>
          <li>Katayi kar sakte hain, lekin weather check kar lein.</li>
          <li>Sabziyon ko halka cover de sakte hain.</li>
        </ul>`;
    } else {
      advice = `<b>Barish ka chance kam hai.</b><br>
        <ul>
          <li>Fasal ko normal paani de.</li>
          <li>Khaad normal matra me de.</li>
          <li>Katayi ke liye mausam sahi hai.</li>
          <li>Sabziyon ko khula rakh sakte hain.</li>
        </ul>`;
    }
    adviceEl.innerHTML = `<button class='close-farm' title='Close'>&times;</button>` + advice;
    adviceEl.style.display = 'block';
    adviceEl.style.zIndex = '1001'; // bring to front
    setTimeout(()=>{ adviceEl.classList.add('show'); }, 50);
    // Hide on close button click
    adviceEl.querySelector('.close-farm').onclick = function(e) {
      e.stopPropagation();
      adviceEl.classList.remove('show');
      setTimeout(()=>{ adviceEl.style.display = 'none'; adviceEl.style.zIndex = '999'; }, 400);
    };
    // Hide on outside click (background)
    document.addEventListener('mousedown', function handler(ev) {
      if (adviceEl.style.display === 'block' && !adviceEl.contains(ev.target) && !ev.target.classList.contains('farm-btn')) {
        adviceEl.classList.remove('show');
        setTimeout(()=>{ adviceEl.style.display = 'none'; adviceEl.style.zIndex = '999'; }, 400);
        document.removeEventListener('mousedown', handler);
      }
    });
}

// ====== Modal handling and detail view ======
function openDetail(type, data) {
  // compute some advices
  const temp = data.temp;
  const rain = data.rain || 0;
  const tempAdvice = temp <= 30 ? "Temperature is good for general activities." : "High temperature! Stay hydrated and avoid direct sun.";
  const humidityAdvice = data.humidity > 70 ? "High humidity may cause fungal issues; ensure ventilation." : "Humidity is within normal range.";
  const pressureAdvice = data.pressure < 1000 ? "Low pressure, rain likely soon." : "Pressure normal.";
  const windAdvice = data.wind > 10 ? "Strong wind: secure loose items and shelter animals." : "Wind is calm.";

  modalContent.innerHTML = `
    <div class="modal-nav">
      <button data-tab="general" class="active-tab">Weather</button>
      <button data-tab="farmer">Farmer</button>
      <button data-tab="animal">Animal</button>
      <button data-tab="crop">Crop</button>
    </div>

    <div class="modal-bg">
      <video autoplay muted loop playsinline>
        <source src="" type="video/mp4">
      </video>
    </div>

    <h1 class="large-value">${type === 'temp' ? data.temp+"°C" : 
                              type === 'humidity' ? data.humidity+"%" :
                              type === 'pressure' ? data.pressure+" hPa" : 
                              data.wind+" m/s" }</h1>

    <div id="tabContent" class="full-desc-card">${tempAdvice}<br><small class="modal-sub">${humidityAdvice}<br>${pressureAdvice}<br>${windAdvice}</small></div>
  `;

  // tab switching
  modalContent.querySelectorAll('.modal-nav button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      modalContent.querySelectorAll('.modal-nav button').forEach(b=>b.classList.remove('active-tab'));
      btn.classList.add('active-tab');
      const tab = btn.dataset.tab;
      const tabContent = document.getElementById('tabContent');
      if(tab === 'general') {
        tabContent.innerHTML = `${tempAdvice}<br><small class="modal-sub">${humidityAdvice}<br>${pressureAdvice}<br>${windAdvice}</small>`;
      } else if(tab === 'farmer') {
        const fdetails = getFarmingDetails(temp);
        tabContent.innerHTML = `<strong>Farming Advice:</strong><br>
          Temperature: ${temp>30?'Too hot — increase watering & shade':'Normal — usual irrigation'}<br>
          Fertilizer: ${fdetails.fertilizer}<br>
          Irrigation: ${fdetails.irrigation}<br>
          Rain: ${rain ? 'Rain expected — adjust irrigation' : 'No immediate rain'}`;
      } else if(tab === 'animal') {
        const fdetails = getFarmingDetails(temp);
        tabContent.innerHTML = `<strong>Animal Care:</strong><br>
          Temperature: ${temp>30?'Keep animals in shade & hydrate':'Normal — regular care'}<br>
          Ventilation: ${data.humidity>70?'Improve ventilation':'OK'}<br>
          Wind: ${data.wind>10?'Shelter animals from strong wind':''}<br>
          Extra: ${fdetails.animal}`;
      } else if(tab === 'crop') {
        const fdetails = getFarmingDetails(temp);
        tabContent.innerHTML = `<strong>Crop Tips:</strong><br>
          ${fdetails.crop}<br>
          Fertilizer note: ${fdetails.fertilizer}<br>
          Rain note: ${rain ? 'Rain incoming — protect seedlings' : 'No rain expected soon'}`;
      }
      // simple fade
      tabContent.style.opacity = 0;
      setTimeout(()=> tabContent.style.opacity = 1, 50);
    });
  });

  modal.classList.remove('hidden');
  modal.classList.add('fullscreen');
  modal.setAttribute('aria-hidden','false');

  // animate card visible (ensure opacity)
  const card = modalContent.querySelector('.full-desc-card');
  if(card) setTimeout(()=> card.style.opacity = 1, 300);
}

function hideModal(){
  modal.classList.add('hidden');
  modal.classList.remove('fullscreen');
  modal.setAttribute('aria-hidden','true');
  modalContent.innerHTML = '';
}
(function init(){
})();
// Chatbot Logic
const chatbotToggle = document.getElementById("chatbot-toggle");
const chatbotCard = document.getElementById("chatbot-card");
const chatbotClose = document.getElementById("chatbot-close");
const chatbotMessages = document.getElementById("chatbot-messages");
const chatbotText = document.getElementById("chatbot-text");
const chatbotSend = document.getElementById("chatbot-send");

chatbotToggle.addEventListener("click", () => {
  chatbotCard.classList.toggle("hidden");
});

chatbotClose.addEventListener("click", () => {
  chatbotCard.classList.add("hidden");
});

chatbotSend.addEventListener("click", sendMessage);
chatbotText.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function addMessage(content, sender = "bot") {
  const div = document.createElement("div");
  div.className = sender === "bot" ? "bot-msg" : "user-msg";
  div.textContent = content;
  chatbotMessages.appendChild(div);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

async function sendMessage() {
  const message = chatbotText.value.trim();
  if (!message) return;

  addMessage(message, "user");
  chatbotText.value = "";

  try {
  const backendUrl = `http://${window.location.hostname}:3000/chat`;
  const res = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    addMessage(data.reply || "⚠️ Sorry, no response right now.");
  } catch (err) {
    addMessage("❌ Error: Unable to reach server.");
  }
}

