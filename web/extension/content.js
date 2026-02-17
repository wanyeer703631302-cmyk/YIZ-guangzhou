(() => {
  const ENDPOINT = 'https://yiz-guangzhou-web.vercel.app';
  const btnStyle = `
    position:absolute; top:8px; right:8px; z-index:9999;
    background:#111; color:#fff; font-size:12px; padding:4px 8px; border-radius:12px;
    box-shadow:0 2px 6px rgba(0,0,0,.2); cursor:pointer; opacity:.85;
  `;
  function attach(img) {
    if (img.dataset.pincollectAttached) return;
    img.dataset.pincollectAttached = '1';
    const wrapper = img.parentElement || img;
    const btn = document.createElement('div');
    btn.textContent = '采集';
    btn.setAttribute('style', btnStyle);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const src = img.src || img.currentSrc;
      if (!src) return alert('未发现图片地址');
      fetch(`${ENDPOINT}/api/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageUrl: src })
      }).then(r=>r.json()).then(x=>{
        alert(x.success ? '采集成功' : '采集失败: ' + (x.message || '未知错误'));
      }).catch(err=>{
        alert('采集失败: ' + err.message);
      });
    });
    wrapper.style.position = 'relative';
    wrapper.appendChild(btn);
  }
  const imgs = document.querySelectorAll('img');
  imgs.forEach(attach);
  const mo = new MutationObserver((muts) => {
    muts.forEach(m => {
      m.addedNodes.forEach(n => {
        if (n.tagName === 'IMG') attach(n);
        else if (n.querySelectorAll) n.querySelectorAll('img').forEach(attach);
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
