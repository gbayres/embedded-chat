(function() {
  const script = document.currentScript;
  const API_URL = script.getAttribute('data-api-url');
  const API_TOKEN = script.getAttribute('data-api-token');
  
  const styles = `
    #chat-btn{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:#007bff;color:#fff;border:none;font-size:24px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:9999}
    #chat-box{position:fixed;bottom:90px;right:20px;width:350px;height:500px;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.2);display:none;flex-direction:column;z-index:9999}
    #chat-header{background:#007bff;color:#fff;padding:15px;border-radius:12px 12px 0 0;font-weight:bold}
    #chat-messages{flex:1;overflow-y:auto;padding:15px;display:flex;flex-direction:column;gap:10px}
    .msg{padding:10px;border-radius:8px;max-width:80%}
    .user{background:#007bff;color:#fff;align-self:flex-end}
    .bot{background:#f1f1f1;align-self:flex-start}
    #chat-input-box{display:flex;padding:10px;border-top:1px solid #ddd}
    #chat-input{flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;outline:none}
    #chat-send{background:#007bff;color:#fff;border:none;padding:10px 20px;margin-left:8px;border-radius:8px;cursor:pointer}
  `;
  
  const container = document.createElement('div');
  container.innerHTML = `
    <style>${styles}</style>
    <button id="chat-btn">💬</button>
    <div id="chat-box">
      <div id="chat-header">Chat</div>
      <div id="chat-messages"></div>
      <div id="chat-input-box">
        <input id="chat-input" placeholder="Digite sua mensagem..." />
        <button id="chat-send">Enviar</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);
  
  const btn = document.getElementById('chat-btn');
  const box = document.getElementById('chat-box');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');
  const messages = document.getElementById('chat-messages');
  
  btn.onclick = () => box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
  
  const addMessage = (text, isUser) => {
    const div = document.createElement('div');
    div.className = `msg ${isUser ? 'user' : 'bot'}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  };
  
  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text) return;
    
    addMessage(text, true);
    input.value = '';
    
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'x-api-token': API_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: text })
      });
      
      const data = await res.json();
      addMessage(data.reply || data.error, false);
    } catch (err) {
      addMessage('Erro ao enviar mensagem', false);
    }
  };
  
  send.onclick = sendMessage;
  input.onkeypress = (e) => e.key === 'Enter' && sendMessage();
})();
