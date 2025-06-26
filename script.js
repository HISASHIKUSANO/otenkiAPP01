// OpenWeatherMap APIキー (実際のキーに置き換えてください)
const API_KEY = '9fe432c27bc9246b7b9e1b9b91dd0fa6';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// デモモード設定（APIキーが無効な場合にデモデータを使用）
const DEMO_MODE = false;

// DOM要素の取得
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const errorMessageElement = document.getElementById('error-message');
const retryButton = document.getElementById('retry-btn');
const currentWeatherElement = document.getElementById('current-weather');
const forecastElement = document.getElementById('forecast');
const lastUpdatedElement = document.getElementById('last-updated');

// 現在の天気要素
const locationNameElement = document.getElementById('location-name');
const currentIconElement = document.getElementById('current-icon');
const currentTemperatureElement = document.getElementById('current-temperature');
const currentDescElement = document.getElementById('current-desc');
const feelsLikeElement = document.getElementById('feels-like');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('wind-speed');
const updateTimeElement = document.getElementById('update-time');

// 天気の日本語翻訳マップ
const weatherTranslations = {
    'clear sky': '晴れ',
    'few clouds': '晴れ時々曇り',
    'scattered clouds': '曇り',
    'broken clouds': '曇り',
    'overcast clouds': '曇り',
    'shower rain': 'にわか雨',
    'rain': '雨',
    'thunderstorm': '雷雨',
    'snow': '雪',
    'mist': '霧',
    'fog': '霧',
    'haze': 'かすみ',
    'dust': '砂埃',
    'sand': '砂嵐',
    'ash': '火山灰',
    'squall': '突風',
    'tornado': '竜巻'
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    retryButton.addEventListener('click', initializeApp);
});

// アプリの初期化
async function initializeApp() {
    try {
        showLoading();
        
        let latitude = 35.6762; // 東京のデフォルト座標
        let longitude = 139.6503;
        
        // デモモードでない場合のみ位置情報を取得
        if (!DEMO_MODE) {
            try {
                const position = await getUserLocation();
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch (locationError) {
                console.warn('位置情報取得失敗、デフォルト位置を使用:', locationError);
            }
        }
        
        // 天気データを取得
        const [currentWeather, forecast] = await Promise.all([
            getCurrentWeather(latitude, longitude),
            getForecast(latitude, longitude)
        ]);
        
        // データを表示
        displayCurrentWeather(currentWeather);
        displayForecast(forecast);
        updateLastUpdatedTime();
        
        showWeatherData();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showError(getErrorMessage(error));
    }
}

// ローディング表示
function showLoading() {
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    currentWeatherElement.classList.add('hidden');
    forecastElement.classList.add('hidden');
    lastUpdatedElement.classList.add('hidden');
}

// エラー表示
function showError(message) {
    loadingElement.classList.add('hidden');
    errorElement.classList.remove('hidden');
    currentWeatherElement.classList.add('hidden');
    forecastElement.classList.add('hidden');
    lastUpdatedElement.classList.add('hidden');
    errorMessageElement.textContent = message;
}

// 天気データ表示
function showWeatherData() {
    loadingElement.classList.add('hidden');
    errorElement.classList.add('hidden');
    currentWeatherElement.classList.remove('hidden');
    forecastElement.classList.remove('hidden');
    lastUpdatedElement.classList.remove('hidden');
}

// 位置情報取得
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('GEOLOCATION_NOT_SUPPORTED'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => {
                console.error('Geolocation error:', error);
                reject(new Error('GEOLOCATION_ERROR'));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5分間キャッシュ
            }
        );
    });
}

// 現在の天気データ取得
async function getCurrentWeather(lat, lon) {
    // デモモードの場合はサンプルデータを返す
    if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // ローディング演出
        return getDemoCurrentWeather();
    }
    
    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ja`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP_ERROR_${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Current weather API error:', error);
        throw new Error('API_ERROR');
    }
}

// 予報データ取得
async function getForecast(lat, lon) {
    // デモモードの場合はサンプルデータを返す
    if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 800)); // ローディング演出
        return getDemoForecast();
    }
    
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ja`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP_ERROR_${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Forecast API error:', error);
        throw new Error('API_ERROR');
    }
}

// 現在の天気表示
function displayCurrentWeather(data) {
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    
    locationNameElement.textContent = data.name || '現在地';
    currentIconElement.src = iconUrl;
    currentIconElement.alt = data.weather[0].description;
    currentTemperatureElement.textContent = Math.round(data.main.temp);
    currentDescElement.textContent = translateWeather(data.weather[0].description);
    feelsLikeElement.textContent = `${Math.round(data.main.feels_like)}°C`;
    humidityElement.textContent = `${data.main.humidity}%`;
    windSpeedElement.textContent = `${data.wind.speed} m/s`;
}

// 予報表示
function displayForecast(data) {
    // 今日、明日、明後日のデータを取得
    const today = new Date();
    const forecastDays = [];
    
    // 日付ごとにグループ化
    const dailyData = {};
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        if (!dailyData[dateKey]) {
            dailyData[dateKey] = {
                date: date,
                temps: [],
                weather: item.weather[0],
                items: []
            };
        }
        
        dailyData[dateKey].temps.push(item.main.temp);
        dailyData[dateKey].items.push(item);
    });
    
    // 今日から3日分のデータを取得
    const dates = Object.keys(dailyData).slice(0, 3);
    
    dates.forEach((dateKey, index) => {
        const dayData = dailyData[dateKey];
        const maxTemp = Math.round(Math.max(...dayData.temps));
        const minTemp = Math.round(Math.min(...dayData.temps));
        const iconUrl = `https://openweathermap.org/img/wn/${dayData.weather.icon}@2x.png`;
        
        // DOM要素の更新
        const iconElement = document.getElementById(`icon-${index}`);
        const highElement = document.getElementById(`high-${index}`);
        const lowElement = document.getElementById(`low-${index}`);
        const descElement = document.getElementById(`desc-${index}`);
        
        if (iconElement && highElement && lowElement && descElement) {
            iconElement.src = iconUrl;
            iconElement.alt = dayData.weather.description;
            highElement.textContent = `${maxTemp}°`;
            lowElement.textContent = `${minTemp}°`;
            descElement.textContent = translateWeather(dayData.weather.description);
        }
    });
}

// 天気の翻訳
function translateWeather(description) {
    const translated = weatherTranslations[description.toLowerCase()];
    if (translated) {
        return translated;
    }
    
    // 部分マッチング
    for (const [english, japanese] of Object.entries(weatherTranslations)) {
        if (description.toLowerCase().includes(english)) {
            return japanese;
        }
    }
    
    // 翻訳がない場合は元の文字列を返す
    return description;
}

// 最終更新時刻の更新
function updateLastUpdatedTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
    });
    updateTimeElement.textContent = timeString;
}

// エラーメッセージの取得
function getErrorMessage(error) {
    const errorMessages = {
        'GEOLOCATION_NOT_SUPPORTED': '位置情報がサポートされていません。ブラウザを更新してください。',
        'GEOLOCATION_ERROR': '位置情報の取得に失敗しました。設定を確認してください。',
        'API_ERROR': '天気データの取得に失敗しました。しばらく後にお試しください。',
        'HTTP_ERROR_401': 'APIキーが無効です。設定を確認してください。',
        'HTTP_ERROR_403': 'APIアクセスが制限されています。',
        'HTTP_ERROR_404': '場所が見つかりません。',
        'HTTP_ERROR_429': 'リクエスト制限に達しました。しばらく後にお試しください。',
        'HTTP_ERROR_500': 'サーバーエラーが発生しました。',
        'HTTP_ERROR_502': 'サーバーに接続できません。',
        'HTTP_ERROR_503': 'サービスが一時的に利用できません。'
    };
    
    const errorType = error.message;
    return errorMessages[errorType] || '予期しないエラーが発生しました。';
}

// API キーのチェック
function checkApiKey() {
    if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
        console.warn('⚠️ APIキーが設定されていません。OpenWeatherMapのAPIキーを取得してください。');
        console.info('1. https://openweathermap.org/api にアクセス');
        console.info('2. アカウントを作成してAPIキーを取得');
        console.info('3. script.jsのAPI_KEYを実際のキーに置き換え');
        return false;
    }
    return true;
}

// アプリ起動時にAPIキーをチェック
if (!checkApiKey()) {
    showError('APIキーが設定されていません。設定を確認してください。');
}

// デバッグ用関数
function debugInfo() {
    console.log('=== Debug Info ===');
    console.log('API Key set:', API_KEY !== 'YOUR_OPENWEATHERMAP_API_KEY');
    console.log('Geolocation supported:', !!navigator.geolocation);
    console.log('Current time:', new Date().toISOString());
}

// デモデータ関数
function getDemoCurrentWeather() {
    return {
        name: "東京",
        main: {
            temp: 24,
            feels_like: 26,
            humidity: 65
        },
        weather: [{
            main: "Clear",
            description: "晴れ",
            icon: "01d"
        }],
        wind: {
            speed: 3.5
        }
    };
}

function getDemoForecast() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);
    
    return {
        list: [
            // 今日のデータ
            {
                dt: Math.floor(today.getTime() / 1000),
                main: { temp: 24, temp_min: 18, temp_max: 26 },
                weather: [{ main: "Clear", description: "晴れ", icon: "01d" }]
            },
            {
                dt: Math.floor(today.getTime() / 1000) + 3600,
                main: { temp: 22, temp_min: 18, temp_max: 26 },
                weather: [{ main: "Clear", description: "晴れ", icon: "01d" }]
            },
            // 明日のデータ
            {
                dt: Math.floor(tomorrow.getTime() / 1000),
                main: { temp: 20, temp_min: 16, temp_max: 23 },
                weather: [{ main: "Clouds", description: "曇り", icon: "03d" }]
            },
            {
                dt: Math.floor(tomorrow.getTime() / 1000) + 3600,
                main: { temp: 18, temp_min: 16, temp_max: 23 },
                weather: [{ main: "Clouds", description: "曇り", icon: "03d" }]
            },
            // 明後日のデータ
            {
                dt: Math.floor(dayAfter.getTime() / 1000),
                main: { temp: 15, temp_min: 12, temp_max: 18 },
                weather: [{ main: "Rain", description: "雨", icon: "10d" }]
            },
            {
                dt: Math.floor(dayAfter.getTime() / 1000) + 3600,
                main: { temp: 14, temp_min: 12, temp_max: 18 },
                weather: [{ main: "Rain", description: "雨", icon: "10d" }]
            }
        ]
    };
}

// 開発者向けのデバッグ情報
if (console && console.log) {
    console.log('🌤️ お天気アプリが読み込まれました');
    if (DEMO_MODE) {
        console.log('🎭 デモモードで動作中');
        console.log('💡 実際のAPIを使用するには有効なAPIキーを取得してください');
    } else {
        console.log('📍 位置情報の使用許可が必要です');
        console.log('🔑 APIキーの設定を確認してください');
    }
}