(() => {
  const ENDPOINT = 'https://yiz-guangzhou-web.vercel.app';
  const DISABLED_HOSTS = ['yiz-guangzhou-web.vercel.app', 'localhost', '127.0.0.1'];
  if (DISABLED_HOSTS.some(h => location.hostname.includes(h))) return;
  const btnStyle = `
    position:absolute; top:8px; right:8px; z-index:9999;
    background:rgba(0,0,0,.75); color:#fff; border:none;
    width:28px; height:28px; border-radius:999px;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,.2); cursor:pointer; opacity:.9;
  `;
  const heartSvg = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-6.716-4.35-9.428-7.062C.386 11.75.5 8.386 2.636 6.25 4.772 4.114 8 4 10 6l2 2 2-2c2-2 5.228-1.886 7.364.25 2.136 2.136 2.25 5.5.064 7.688C18.716 16.65 12 21 12 21z"/>
    </svg>
  `;
  const isValidImage = (img) => {
    const src = img.currentSrc || img.src || '';
    if (!src || src.startsWith('data:')) return false;
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    if (w < 200 || h < 200) return false;
    if (w * h < 60000) return false;
    return true;
  };
  function attach(img) {
    if (img.dataset.pincollectAttached) return;
    if (!isValidImage(img)) {
      img.addEventListener('load', () => {
        if (img.dataset.pincollectAttached) return;
        if (isValidImage(img)) attach(img);
      }, { once: true });
      return;
    }
    img.dataset.pincollectAttached = '1';
    const wrapper = img.parentElement || img;
    const btn = document.createElement('button');
    btn.setAttribute('style', btnStyle);
    btn.innerHTML = heartSvg;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const src = img.src || img.currentSrc;
      if (!src) return alert('未发现图片地址');
      const url = `${ENDPOINT}/collect?imageUrl=${encodeURIComponent(src)}&auto=1`;
      window.open(url, '_blank');
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
