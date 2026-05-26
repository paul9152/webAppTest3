/**
 * 散歩の足跡 - LBS Logger Prototype
 * Geolocation API Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const getBtn = document.getElementById('get-location-btn');
    const statusContainer = document.getElementById('status-container');
    const statusText = document.getElementById('status-text');
    const resultContainer = document.getElementById('result-container');
    const latVal = document.getElementById('latitude-val');
    const lngVal = document.getElementById('longitude-val');
    const accVal = document.getElementById('accuracy-val');
    const errorContainer = document.getElementById('error-container');
    const errorMsg = document.getElementById('error-message');
    const mapContainer = document.getElementById('map-container');

    // Leaflet map instance holder
    let map = null;

    // Click event handler
    getBtn.addEventListener('click', () => {
        // UI状態のリセット
        resetUIState();
        
        // Geolocationサポートチェック
        if (!navigator.geolocation) {
            showError('お使いのブラウザは位置情報の取得に対応していません。');
            return;
        }

        // ローディング表示
        showStatus('位置情報を取得しています。しばらくお待ちください...');

        // Geolocation オプション
        const options = {
            enableHighAccuracy: true, // 高精度GPS等の使用を試みる
            timeout: 10000,           // 10秒でタイムアウト
            maximumAge: 0             // キャッシュされた位置情報は使用しない
        };

        // 位置情報の取得開始
        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            options
        );
    });

    /**
     * 位置情報取得成功時のコールバック
     * @param {GeolocationPosition} position 
     */
    function handleSuccess(position) {
        hideStatus();

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        // 小数点第6桁まで表示（約11cmの精度）
        latVal.textContent = latitude.toFixed(6);
        lngVal.textContent = longitude.toFixed(6);
        
        // 精度（メートル表記）
        if (accuracy) {
            accVal.textContent = `${Math.round(accuracy)} メートル`;
        } else {
            accVal.textContent = '不明';
        }

        // 結果エリアの表示
        resultContainer.classList.remove('hidden');

        // 地図表示コンテナを表示して地図を描画
        mapContainer.classList.remove('hidden');
        try {
            if (map !== null) {
                map.remove();
                map = null;
            }
            // ズームレベル 16 (建物がわかる程度)
            map = L.map('map').setView([latitude, longitude], 16);

            // OpenStreetMap 標準タイルレイヤーの追加
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // 現在地にマーカー（青いピン）を追加
            L.marker([latitude, longitude]).addTo(map);

            // 非表示状態から表示した際のサイズ不整合バグを防止
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                }
            }, 200);
        } catch (e) {
            console.error("Map initialization failed: ", e);
        }
    }

    /**
     * 位置情報取得失敗（エラー）時のコールバック
     * @param {GeolocationPositionError} error 
     */
    function handleError(error) {
        hideStatus();
        let message = '';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                // ユーザーが利用を拒否した場合
                message = '位置情報の利用が許可されていません。お手数ですが、ブラウザや端末の設定で位置情報を「オン」にしてください。';
                break;
            case error.POSITION_UNAVAILABLE:
                // 電波不良などで取得できなかった場合
                message = '位置情報を取得できませんでした。電波の良い場所に移動するか、端末のGPS設定が有効になっているかご確認ください。';
                break;
            case error.TIMEOUT:
                // タイムアウト
                message = '位置情報の取得処理がタイムアウトしました。電波環境をお確かめの上、再度お試しください。';
                break;
            default:
                // その他のエラー
                message = '位置情報の取得中に予期せぬエラーが発生しました。しばらく時間を置いてから再度お試しください。';
                break;
        }

        showError(message);
    }

    /**
     * ステータス（ローディング）の表示
     * @param {string} text 
     */
    function showStatus(text) {
        statusText.textContent = text;
        statusContainer.classList.remove('hidden');
        getBtn.disabled = true;
    }

    /**
     * ステータス（ローディング）の非表示
     */
    function hideStatus() {
        statusContainer.classList.add('hidden');
        getBtn.disabled = false;
    }

    /**
     * エラーの表示
     * @param {string} message 
     */
    function showError(message) {
        errorMsg.textContent = message;
        errorContainer.classList.remove('hidden');
    }

    /**
     * UI表示状態のクリア
     */
    function resetUIState() {
        statusContainer.classList.add('hidden');
        resultContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        mapContainer.classList.add('hidden');
        latVal.textContent = '--';
        lngVal.textContent = '--';
        accVal.textContent = '--';
        errorMsg.textContent = '';
        
        // 地図のクリア
        if (map !== null) {
            map.remove();
            map = null;
        }
    }
});
