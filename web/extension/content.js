(() => {
  const ENDPOINT = 'https://yiz-guangzhou-web.vercel.app';
  // const ENDPOINT = 'http://localhost:3000'; // For local dev
  const DISABLED_HOSTS = ['yiz-guangzhou-web.vercel.app', 'localhost', '127.0.0.1'];
  if (DISABLED_HOSTS.some(h => location.hostname.includes(h))) return;

  const btnStyle = `
    position:absolute; top:8px; right:8px; z-index:9999;
    background:rgba(0,0,0,.75); color:#fff; border:none;
    width:32px; height:32px; border-radius:999px;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,.2); cursor:pointer; 
    opacity:0; transition: opacity 0.2s ease, transform 0.2s ease;
    transform: scale(0.9);
  `;
  
  const heartSvg = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-6.716-4.35-9.428-7.062C.386 11.75.5 8.386 2.636 6.25 4.772 4.114 8 4 10 6l2 2 2-2c2-2 5.228-1.886 7.364.25 2.136 2.136 2.25 5.5.064 7.688C18.716 16.65 12 21 12 21z"/>
    </svg>
  `;

  // Use a popup window instead of iframe to ensure cookie/session sharing works correctly
  function openCollectPopup(srcUrl) {
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const url = `${ENDPOINT}/collect?imageUrl=${encodeURIComponent(srcUrl)}`;
    
    window.open(
      url, 
      'pincollect_popup', 
      `width=${width},height=${height},top=${top},left=${left},resizable,scrollbars,status=1`
    );
  }

  const isValidImage = (img) => {
    const src = img.currentSrc || img.src || '';
    if (!src || src.startsWith('data:')) return false;
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    if (w < 200 || h < 200) return false;
    if (w * h < 40000) return false; // Lowered threshold slightly
    return true;
  };

  function attach(img) {
    if (img.dataset.pincollectAttached) return;
    
    // Retry logic for images that haven't loaded size yet
    if (!isValidImage(img)) {
      img.addEventListener('load', () => {
        if (img.dataset.pincollectAttached) return;
        if (isValidImage(img)) attach(img);
      }, { once: true });
      return;
    }

    img.dataset.pincollectAttached = '1';
    
    // Try to find a suitable wrapper or create one if safe
    const wrapper = img.parentElement;
    
    // We don't want to mess up the layout too much. 
    // Just setting relative position on existing parent is usually safest, 
    // but check if it's a replaced element or something weird.
    try {
      const computed = window.getComputedStyle(wrapper);
      if (computed.position === 'static') {
        wrapper.style.position = 'relative';
      }
    } catch(e) {}

    const btn = document.createElement('button');
    btn.setAttribute('style', btnStyle);
    btn.innerHTML = heartSvg;
    btn.title = "采集到 YIZ";
    
    // Hover effects
    btn.addEventListener('mouseenter', () => {
      btn.style.opacity = '1';
      btn.style.transform = 'scale(1.1)';
      btn.style.background = '#e60023'; // Pinterest-like red on hover
    });
    btn.addEventListener('mouseleave', () => {
      // Don't hide immediately if hovering the button itself, 
      // but the wrapper logic handles the main hide.
      // Here we just reset color/scale
      btn.style.transform = 'scale(0.9)';
      btn.style.background = 'rgba(0,0,0,.75)';
    });

    // Wrapper hover logic
    wrapper.addEventListener('mouseenter', () => {
      btn.style.opacity = '1';
      btn.style.transform = 'scale(1)';
    });
    wrapper.addEventListener('mouseleave', () => {
      btn.style.opacity = '0';
      btn.style.transform = 'scale(0.9)';
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const src = img.src || img.currentSrc;
      if (!src) return alert('未发现图片地址');
      openCollectPopup(src);
    });

    wrapper.appendChild(btn);
  }

  const imgs = document.querySelectorAll('img');
  imgs.forEach(attach);

  const mo = new MutationObserver((muts) => {
    muts.forEach(m => {
      m.addedNodes.forEach(n => {
        if (n.nodeName === 'IMG') attach(n);
        else if (n.querySelectorAll) n.querySelectorAll('img').forEach(attach);
      });
    });
  });
  
  mo.observe(document.body, { childList: true, subtree: true });
})();
