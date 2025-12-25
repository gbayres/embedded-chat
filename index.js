(function() {
  const script = document.currentScript;
  const API_URL = script.getAttribute('data-api-url');
  const API_TOKEN = script.getAttribute('data-api-token');
  
  const uniqueId = 'chat-widget-' + Date.now();
  const STORAGE_KEY = 'chat-widget-history';
  
  const styles = `
    #${uniqueId}-btn{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:#BD0F0F;color:#fff;border:none;font-size:24px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:99999}
    #${uniqueId}-box{position:fixed;bottom:90px;right:20px;width:350px;height:500px;background:#0D0D0D;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.2);display:none;flex-direction:column;z-index:99999}
    #${uniqueId}-header{background:#BD0F0F;color:#fff;padding:15px;border-radius:12px 12px 0 0;font-weight:bold}
    #${uniqueId}-messages{flex:1;overflow-y:auto;padding:15px;display:flex;flex-direction:column;gap:10px}
    .${uniqueId}-msg{padding:10px;border-radius:8px;max-width:80%}
    .${uniqueId}-user{background:#444;color:#fff;align-self:flex-start}
    .${uniqueId}-bot{background:#BD0F0F;color:#fff;align-self:flex-end}
    .${uniqueId}-loading{background:#BD0F0F;color:#fff;align-self:flex-end;padding:10px;border-radius:8px;max-width:80%}
    .${uniqueId}-loading::after{content:'...';animation:${uniqueId}-dots 1.5s steps(4,end) infinite}
    @keyframes ${uniqueId}-dots{0%,20%{content:''}40%{content:'.'}60%{content:'..'}80%,100%{content:'...'}}
    #${uniqueId}-input-box{display:flex;padding:10px;border-top:1px solid #444}
    #${uniqueId}-input{flex:1!important;padding:10px!important;border:1px solid #ddd!important;border-radius:8px!important;outline:none!important;background:#fff!important;color:#000!important;font-size:14px!important;line-height:normal!important;box-sizing:border-box!important;margin:0!important;pointer-events:auto!important}
    #${uniqueId}-send{background:#BD0F0F!important;color:#fff!important;border:none!important;padding:10px 20px!important;margin-left:8px!important;border-radius:8px!important;cursor:pointer!important;pointer-events:auto!important}
    #${uniqueId}-send:disabled{opacity:0.5;cursor:not-allowed!important}
  `;
  
  const container = document.createElement('div');
  container.innerHTML = `
    <style>${styles}</style>
    <button id="${uniqueId}-btn">💬</button>
    <div id="${uniqueId}-box">
      <div id="${uniqueId}-header">Chat</div>
      <div id="${uniqueId}-messages"></div>
      <div id="${uniqueId}-input-box">
        <input type="text" id="${uniqueId}-input" placeholder="Digite sua mensagem..." autocomplete="off" />
        <button type="button" id="${uniqueId}-send">Enviar</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);
  
  const btn = document.getElementById(`${uniqueId}-btn`);
  const box = document.getElementById(`${uniqueId}-box`);
  const input = document.getElementById(`${uniqueId}-input`);
  const send = document.getElementById(`${uniqueId}-send`);
  const messages = document.getElementById(`${uniqueId}-messages`);
  
  let chatHistory = [];
  
  // Load chat history from memory
  const loadHistory = () => {
    try {
      chatHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      chatHistory.forEach(msg => addMessage(msg.text, msg.isUser, false));
    } catch (err) {
      console.error('Error loading chat history:', err);
      chatHistory = [];
    }
  };
  
  // Save message to memory
  const saveToHistory = (text, isUser) => {
    try {
      chatHistory.push({ text, isUser, timestamp: Date.now() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (err) {
      console.error('Error saving to history:', err);
    }
  };
  
  btn.onclick = () => {
    box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
  };
  
  // Close on click outside
  document.addEventListener('click', (e) => {
    if (box.style.display === 'flex' && 
        !box.contains(e.target) && 
        !btn.contains(e.target)) {
      box.style.display = 'none';
    }
  });
  
  const addMessage = (text, isUser, save = true) => {
    const div = document.createElement('div');
    div.className = `${uniqueId}-msg ${isUser ? uniqueId + '-user' : uniqueId + '-bot'}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    
    if (save) {
      saveToHistory(text, isUser);
    }
  };
  
  const showLoading = () => {
    const div = document.createElement('div');
    div.className = `${uniqueId}-loading`;
    div.id = `${uniqueId}-loading-indicator`;
    div.textContent = 'Digitando';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  };
  
  const hideLoading = () => {
    const loading = document.getElementById(`${uniqueId}-loading-indicator`);
    if (loading) loading.remove();
  };
  
  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text) return;
    
    addMessage(text, true);
    input.value = '';
    send.disabled = true;
    input.disabled = true;
    
    showLoading();
    
    try {
      // Format previous messages for context
      const previousMessages = chatHistory.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));
      
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'x-api-token': API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: text,
          history: previousMessages
        })
      });
      
      const data = await res.json();
      hideLoading();
      addMessage(data.reply || data.error, false);
    } catch (err) {
      hideLoading();
      addMessage('Erro ao enviar mensagem', false);
    } finally {
      send.disabled = false;
      input.disabled = false;
      input.focus();
    }
  };
  
  send.onclick = sendMessage;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Load previous chat history on initialization
  loadHistory();
})();