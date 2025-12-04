// ==========================================================
// 🚨 步驟 1：替換為您的 Supabase 專案資訊！
// ==========================================================
const SUPABASE_URL = 'https://cktczyaasytqhfwlivtx.supabase.co'; // 範例：https://abcdefghijk.supabase.co
const SUPABASE_ANON_KEY = 'sb_publishable_yn9CHi7TaQk9ICvkNdq8TA_83UHRemf'; // 範例：eyJhbGciOiJIUzI1Ni...

// 初始化 Supabase 客戶端
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================================
// 步驟 2：DOM 元素參考 (確保您的 HTML 元素 ID 正確)
// ==========================================================
const loginForm = document.getElementById('login-form');
const scoresView = document.getElementById('scores-view');
const scoresTableBody = document.getElementById('scores-table').querySelector('tbody');
const errorMsg = document.getElementById('error-message');
const logoutButton = document.getElementById('logout-button');
const welcomeUser = document.getElementById('welcome-user');


// ==========================================================
// 步驟 3：主要邏輯函式
// ==========================================================

/**
 * 處理登入邏輯
 */
async function handleLogin(e) {
    e.preventDefault();
    errorMsg.textContent = '';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // 呼叫 Supabase 登入 API
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        // 登入失敗：顯示錯誤訊息
        console.error('登入錯誤:', error);
        errorMsg.textContent = '登入失敗，請檢查帳號密碼。';
    } else {
        // 登入成功：開始查詢資料
        console.log('User logged in:', data.user);
        
        // 這裡將登入者的 Email 當作歡迎訊息
        welcomeUser.textContent = data.user.email; 
        
        await fetchScores();
        
        // 切換介面：隱藏登入表單，顯示成績區
        loginForm.style.display = 'none';
        scoresView.style.display = 'block';
    }
}

/**
 * 查詢成績 (受 RLS 保護)
 */
async function fetchScores() {
    scoresTableBody.innerHTML = '<tr><td colspan="3">查詢中，請稍候...</td></tr>';
    
    // 呼叫 Supabase API 查詢 'scores' 資料表。
    // RLS (Row Level Security) 會自動執行我們設定的條件：
    // auth.uid()::text = student_id，只返回該登入者的成績。
    const { data: scores, error } = await supabase
        .from('scores')
        .select('exam_name, subject, score'); // 選擇需要的欄位

    if (error) {
        console.error('查詢失敗:', error);
        scoresTableBody.innerHTML = `<tr><td colspan="3" style="color:red;">查詢錯誤或您沒有成績資料: ${error.message}</td></tr>`;
    } else {
        // 查詢成功，將資料渲染到表格
        renderScores(scores);
    }
}

/**
 * 將成績資料渲染到 HTML 表格中
 */
function renderScores(scores) {
    scoresTableBody.innerHTML = ''; // 清空舊資料
    if (scores.length === 0) {
        scoresTableBody.innerHTML = '<tr><td colspan="3">查無您的成績記錄。</td></tr>';
        return;
    }

    scores.forEach(score => {
        const row = scoresTableBody.insertRow();
        row.insertCell().textContent = score.exam_name;
        row.insertCell().textContent = score.subject;
        row.insertCell().textContent = score.score;
    });
}

/**
 * 處理登出邏輯
 */
async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        // 登出成功後，切換回登入介面
        loginForm.style.display = 'block';
        scoresView.style.display = 'none';
        alert('您已安全登出。');
        // 清除表單資料
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        errorMsg.textContent = '';
    }
}

/**
 * 檢查使用者是否已經登入 (網頁載入時)
 */
async function checkUserSession() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // 如果瀏覽器中有有效的 Session，直接跳過登入步驟
        welcomeUser.textContent = user.email;
        await fetchScores();
        loginForm.style.display = 'none';
        scoresView.style.display = 'block';
    } else {
         // 如果沒有 Session，顯示登入表單
        loginForm.style.display = 'block';
        scoresView.style.display = 'none';
    }
}

// ==========================================================
// 步驟 4：事件監聽 (啟動程式)
// ==========================================================
loginForm.addEventListener('submit', handleLogin);
logoutButton.addEventListener('click', handleLogout);

// 網頁載入完成後，檢查是否有登入狀態
checkUserSession();