// ======= Configuration =======
const OPENWEATHER_API_KEY = '86b000c76719dfc783fcbd235150d826';

// Background images
const bgMap = {
  Clear: 'https://images.unsplash.com/photo-1501973801540-537f08ccae7b?auto=format&fit=crop&w=1400&q=80',
  Clouds: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1400&q=80',
  Rain: 'https://images.unsplash.com/photo-1505483531331-3d3f2f7b1b45?auto=format&fit=crop&w=1400&q=80',
  Thunderstorm: 'https://images.unsplash.com/photo-1505678261036-a3fcc5e884ee?auto=format&fit=crop&w=1400&q=80',
  Snow: 'https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1400&q=80',
  Mist: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80',
  Drizzle: 'https://images.unsplash.com/photo-1527766833261-b09c3163a791?auto=format&fit=crop&w=1400&q=80',
  Smoke: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1400&q=80'
};

// Utility functions
function showToast(msg) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.style.display='block';
  setTimeout(()=>t.style.display='none',2800);
}
function kToC(k){return Math.round((k-273.15)*10)/10}
function fmtLocal(dt, tzOffset){
  const local=new Date((dt+tzOffset)*1000);
  return local.toLocaleString(undefined,{hour:'2-digit',minute:'2-digit',weekday:'short',day:'numeric',month:'short'});
}
function setBackground(condition){
  const url=bgMap[condition] || bgMap['Clouds'];
  document.getElementById('bgImage').style.backgroundImage=`url(${url})`;
}

// Render current weather
function renderCurrent(data){
  const weather=data.weather[0];
  let iconCode=weather.icon;
  if(data.rain && data.rain["1h"]>0){
    iconCode="10d"; weather.main="Rain"; weather.description="Light Rain";
  }
  document.getElementById('weatherIcon').innerHTML=
    `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${weather.description}">`;
  document.getElementById('tempVal').textContent=kToC(data.main.temp)+'°C';
  document.getElementById('desc').textContent=weather.description;
  document.getElementById('cityName').textContent=data.name+', '+(data.sys?.country||'');
  document.getElementById('hum').textContent=data.main.humidity+'%';
  document.getElementById('wind').textContent=(data.wind.speed||'--')+' m/s';
  document.getElementById('feels').textContent=kToC(data.main.feels_like)+'°C';
  document.getElementById('timeLocal').textContent=fmtLocal(data.dt,data.timezone);
  setBackground(weather.main);
}

// Forecast
let tempChart;
function renderForecast(forecastData){
  const labels=[],temps=[];
  forecastData.list.slice(0,24).forEach(item=>{
    const local=new Date((item.dt+forecastData.city.timezone)*1000);
    labels.push(local.toLocaleTimeString(undefined,{hour:'2-digit',hour12:false}));
    temps.push(kToC(item.main.temp));
  });
  const ctx=document.getElementById('tempChart').getContext('2d');
  if(tempChart) tempChart.destroy();
  tempChart=new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{label:'Temp (°C)',data:temps,tension:0.35,pointRadius:3,fill:true}]},
    options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:false}},responsive:true,maintainAspectRatio:false}
  });
  const fc=document.getElementById('forecast'); fc.innerHTML='';
  for(let i=0;i<forecastData.list.length;i+=8){
    const it=forecastData.list[i];
    const d=new Date(it.dt*1000);
    const card=document.createElement('div'); card.className='fcard';
    card.innerHTML=`<div style="font-weight:700">${d.toLocaleDateString(undefined,{weekday:'short'})}</div>
                    <div style="font-size:20px;font-weight:700">${kToC(it.main.temp)}°C</div>
                    <div class="small">${it.weather[0].main}</div>`;
    fc.appendChild(card);
  }
}

// Fetch by city
async function fetchByCity(city){
  if(!OPENWEATHER_API_KEY){showToast('Please set your OpenWeather API key');return}
  try{
    showToast('Fetching weather...');
    const curRes=await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}`);
    if(!curRes.ok) throw new Error('City not found');
    const cur=await curRes.json(); renderCurrent(cur);
    const fcRes=await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}`);
    const fcd=await fcRes.json(); renderForecast(fcd);
  }catch(err){console.error(err);showToast('Error: '+err.message)}
}

// Fetch by coordinates
async function fetchByCoords(lat,lon){
  try{
    showToast('Fetching weather...');
    const curRes=await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`);
    const cur=await curRes.json(); renderCurrent(cur);
    const fcRes=await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`);
    const fcd=await fcRes.json(); renderForecast(fcd);
  }catch(err){console.error(err);showToast('Error: '+err.message)}
}

// Event listeners
document.getElementById('searchBtn').addEventListener('click',()=>{
  const v=document.getElementById('cityInput').value.trim();
  if(v) fetchByCity(v);
});
document.getElementById('cityInput').addEventListener('keydown',(e)=>{
  if(e.key==='Enter'){const v=e.target.value.trim();if(v)fetchByCity(v);}
});
document.getElementById('locBtn').addEventListener('click',()=>{
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>fetchByCoords(pos.coords.latitude,pos.coords.longitude),
      ()=>showToast('Location access denied'));
  }else showToast('Geolocation not supported');
});

// Contact form
document.getElementById('contactForm').addEventListener('submit',(e)=>{
  e.preventDefault();
  const name=document.getElementById('name').value;
  const email=document.getElementById('email').value;
  const msg=document.getElementById('message').value;
  console.log('Contact submit',{name,email,msg});
  showToast('Message sent! We will contact you soon.');
  e.target.reset();
});

// Init default city
(function(){
  const defaultCity='New Delhi';
  document.getElementById('cityInput').value=defaultCity;
  fetchByCity(defaultCity);
})();
