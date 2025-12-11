const menuBtn = document.getElementById('menuBtn');
const dropdown = document.getElementById('menuList');
const links = dropdown.querySelectorAll('a');
const sections = document.querySelectorAll('.content > section');

function closeDropdown(){
  dropdown.style.display = 'none';
  menuBtn.setAttribute('aria-expanded','false');
}
function openDropdown(){
  dropdown.style.display = 'flex';
  dropdown.style.flexDirection = 'column';
  menuBtn.setAttribute('aria-expanded','true');
}

menuBtn.addEventListener('click', (e)=>{
  e.stopPropagation();
  if(dropdown.style.display === 'flex') closeDropdown(); else openDropdown();
});

links.forEach(a=>{
  a.addEventListener('click', (e)=>{
    e.preventDefault();
    const target = a.dataset.target;
    sections.forEach(s => s.id === target ? s.classList.add('active') : s.classList.remove('active'));
    closeDropdown();
    const t = document.getElementById(target);
    if(t) t.scrollIntoView({behavior:'smooth', block:'start'});

    if(target === 'home') {
      document.body.classList.add('home-view');
    } else {
      document.body.classList.remove('home-view');
    }
  });
});

document.addEventListener('click', (e)=>{
  if(!dropdown.contains(e.target) && !menuBtn.contains(e.target)) closeDropdown();
});

(function initHomeView() {
  const homeSection = document.getElementById('home');
  if(homeSection && homeSection.classList.contains('active')) {
    document.body.classList.add('home-view');
  } else {
    document.body.classList.remove('home-view');
  }
})();

sections.forEach(s => s.id === 'home' ? s.classList.add('active') : s.classList.remove('active'));

(function renderLatihanThumbnails(){
  const latihanList = document.querySelector('#latihan .latihan-list');
  if(!latihanList) return;

  const rawItems = Array.from(latihanList.querySelectorAll('li'));
  if(rawItems.length === 0) return;

  const previewOverlay = document.getElementById('previewOverlay');
  const previewImage = document.getElementById('previewImage');
  const pdfWrap = document.getElementById('pdfWrap');
  const previewTitle = document.getElementById('previewTitle');
  const closePreview = document.getElementById('closePreview');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const showAllBtn = document.getElementById('showAllPages');
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');

  let currentPdf = null;
  let currentPage = 1;
  let currentScale = 1.0;
  let isShowingAll = false;

  function openImagePreview(src, title){
    previewTitle.textContent = title || 'Gambar';
    previewImage.src = src;
    previewImage.style.display = 'block';
    pdfWrap.style.display = 'none';
    previewOverlay.style.display = 'flex';
    previewOverlay.setAttribute('aria-hidden','false');
  }

  function openPdfPreview(href, title){
    previewTitle.textContent = title || 'PDF Preview';
    previewImage.style.display = 'none';
    pdfWrap.style.display = 'flex';
    pdfWrap.innerHTML = '<div style="width:100%;color:var(--muted);padding:14px;">Memuat PDF…</div>';
    previewOverlay.style.display = 'flex';
    previewOverlay.setAttribute('aria-hidden','false');

    currentScale = 1.0;
    currentPage = 1;
    isShowingAll = false;

    pdfjsLib.getDocument(href).promise.then(pdfDoc => {
      currentPdf = pdfDoc;
      renderPdfPage(currentPage);
      updateNavButtons();
    }).catch(err => {
      pdfWrap.innerHTML = '<div style="width:100%;color:var(--muted);padding:14px;">Preview tidak tersedia</div>';
    });
  }

  function updateNavButtons(){
    if(!currentPdf){
      prevPageBtn.style.display='none';
      nextPageBtn.style.display='none';
      showAllBtn.style.display='none';
      return;
    }
    prevPageBtn.style.display = currentPdf.numPages>1 ? 'inline-flex' : 'none';
    nextPageBtn.style.display = currentPdf.numPages>1 ? 'inline-flex' : 'none';
    showAllBtn.style.display = currentPdf.numPages>1 ? 'inline-flex' : 'none';
  }

  function renderPdfPage(pageNumber){
    if(!currentPdf) return;
    isShowingAll = false;
    pdfWrap.innerHTML = '';
    currentPdf.getPage(pageNumber).then(page => {
      const viewport = page.getViewport({ scale: currentScale });
      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-single-canvas';
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');

      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.appendChild(canvas);

      pdfWrap.appendChild(container);

      page.render({ canvasContext: ctx, viewport }).promise.then(()=>{
        fitCanvasToContainer(canvas);
      });
    });
  }

  function fitCanvasToContainer(canvas){
    const maxWidth = Math.min(
      document.querySelector('.preview-panel').clientWidth - 40,
      window.innerWidth - 80
    );
    if(canvas.width > maxWidth){
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
    } else {
      canvas.style.width = canvas.width + 'px';
      canvas.style.height = canvas.height + 'px';
    }
  }

  async function renderAllPages(){
    if(!currentPdf) return;
    isShowingAll = true;
    pdfWrap.innerHTML = '';
    const total = currentPdf.numPages;
    for(let p=1;p<=total;p++){
      try{
        const page = await currentPdf.getPage(p);
        const viewport = page.getViewport({ scale: currentScale * 0.9 });

        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-single-canvas';
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.appendChild(canvas);
        pdfWrap.appendChild(container);

        await page.render({ canvasContext: ctx, viewport }).promise;

        fitCanvasToContainer(canvas);
      }catch{}
    }
  }

  function closePreviewPanel(){
    previewOverlay.style.display = 'none';
    previewOverlay.setAttribute('aria-hidden','true');
    previewImage.src = '';
    pdfWrap.innerHTML = '';
    currentPdf = null;
    currentPage = 1;
    currentScale = 1.0;
    isShowingAll = false;
  }

  if(closePreview) {
    closePreview.addEventListener('click', closePreviewPanel);
  }
  previewOverlay.addEventListener('click', (e)=>{
    if(e.target === previewOverlay) closePreviewPanel();
  });

  prevPageBtn.addEventListener('click', ()=>{
    if(!currentPdf) return;
    if(currentPage>1){ currentPage--; renderPdfPage(currentPage); updateNavButtons(); }
  });
  nextPageBtn.addEventListener('click', ()=>{
    if(!currentPdf) return;
    if(currentPage<currentPdf.numPages){ currentPage++; renderPdfPage(currentPage); updateNavButtons(); }
  });
  showAllBtn.addEventListener('click', ()=>{ if(currentPdf) renderAllPages(); });
  zoomInBtn.addEventListener('click', ()=>{
    currentScale = Math.min(4, currentScale + 0.25);
    if(currentPdf){ isShowingAll ? renderAllPages() : renderPdfPage(currentPage); }
  });
  zoomOutBtn.addEventListener('click', ()=>{
    currentScale = Math.max(0.25, currentScale - 0.25);
    if(currentPdf){ isShowingAll ? renderAllPages() : renderPdfPage(currentPage); }
  });

  rawItems.forEach(li => {
    const a = li.querySelector('a');
    if(!a) return;

    const href = a.getAttribute('href') || '';
    const filename = href.split('/').pop() || href;
    const ext = filename.split('.').pop().toLowerCase();

    const item = document.createElement('div');
    item.className = 'latihan-item';

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.textContent = 'Memuat...';

    item.appendChild(thumb);

    const meta = document.createElement('div');
    meta.className = 'item-meta';

    const titleLink = document.createElement('a');
    titleLink.className = 'title';
    titleLink.href = href;
    titleLink.target = '_blank';
    titleLink.rel = 'noopener';
    titleLink.textContent = a.textContent.trim() || filename;

    meta.appendChild(titleLink);

    const metaRow = document.createElement('div');
    metaRow.className = 'meta-row';

    // ============ DOWNLOAD CUSTOM PER ITEM (pakai data-download kalau ada) ============
    const downloadBtn = document.createElement('a');
    downloadBtn.className = 'btn-small';

    // jika author menambahkan data-download (custom path), pakai itu
    const customDownload = a.getAttribute('data-download') || a.getAttribute('data-download-href') || '';
    let finalHref = '';

    if(customDownload && customDownload.trim() !== '') {
      finalHref = customDownload.trim();
    } else {
      // fallback: ambil nomor pertemuan dari nama file asli dan pakai codingan/pertemuanN.html
      const num = filename.match(/\d+/);
      const pertemuan = num ? num[0] : '1';
      finalHref = `codingan/pertemuan${pertemuan}.html`;
    }

    downloadBtn.href = finalHref;
    // atur nama file download berdasarkan basename finalHref
    const resolvedName = (finalHref.split('/').pop() || (`pertemuan` + (filename.match(/\d+/)? filename.match(/\d+/)[0] : '1')));
    downloadBtn.setAttribute('download', resolvedName);
    downloadBtn.textContent = 'Download';

    // simpan metadata kecil
    downloadBtn.dataset.original = href;
    downloadBtn.dataset.resolved = finalHref;

    metaRow.appendChild(downloadBtn);
    // ================================================================================

    // tampilkan NAMA FILE YANG AKAN DI-DOWNLOAD (bukan selalu nama file preview)
    const nameSpan = document.createElement('span');
    nameSpan.className = 'muted';
    nameSpan.style.fontSize = '13px';

    // jika ada customDownload gunakan basename customDownload, kalau tidak gunakan resolvedName
    const displayName = (customDownload && customDownload.trim() !== '') ? (customDownload.trim().split('/').pop()) : resolvedName;
    nameSpan.textContent = displayName;

    metaRow.appendChild(nameSpan);

    meta.appendChild(metaRow);
    item.appendChild(meta);

    li.replaceWith(item);

    if(['jpg','jpeg','png','webp','gif'].includes(ext)) {
      const img = document.createElement('img');
      img.src = href;
      img.alt = titleLink.textContent;
      img.onload = () => {
        thumb.textContent = '';
        thumb.appendChild(img);
        thumb.addEventListener('click', ()=> openImagePreview(href, titleLink.textContent));
      };
      img.onerror = ()=> thumb.textContent = 'Gagal memuat gambar';

    } else if(ext === 'pdf') {

      const loadingTask = pdfjsLib.getDocument(href);
      loadingTask.promise.then(pdf => pdf.getPage(1))
      .then(page => {
        const scale = 1600 / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        return page.render({ canvasContext: ctx, viewport }).promise.then(()=>canvas);
      })
      .then(canvas => {
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        thumb.textContent = '';
        thumb.appendChild(img);
        thumb.addEventListener('click', ()=> openPdfPreview(href, titleLink.textContent));
      })
      .catch(()=>{
        thumb.textContent = 'Preview tidak tersedia';
        thumb.addEventListener('click', ()=> openPdfPreview(href, titleLink.textContent));
      });

    } else {
      thumb.textContent = ext.toUpperCase();
    }
  });

})();

(function(){
  const container = document.querySelector('.card.content');
  if(!container) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReduced) return;

  let rect = null;
  function updateRect(){ rect = container.getBoundingClientRect(); }

  updateRect();
  window.addEventListener('resize', updateRect);

  function onMove(e){
    if(!rect) return;
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    const rx = dy * 3;
    const ry = -dx * 6;
    container.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
  }
  function onLeave(){
    container.style.transform = '';
  }
  container.addEventListener('mousemove', onMove);
  container.addEventListener('mouseleave', onLeave);
})();
