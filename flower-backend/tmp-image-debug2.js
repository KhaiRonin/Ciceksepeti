(async()=>{
  const url = 'https://www.kibrisciceksepetim.com/index.php?route=product/product&product_id=785';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const og = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html)?.[1] || '';
  const urls = [...new Set((html.match(/https?:\/\/[^\s"<>]+/g) || []))]
    .filter((u) => u.includes('/image/'))
    .filter((u) => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u));
  console.log('og=', og);
  console.log('fallback=', urls.find((u)=>u.includes('/785/')) || urls[0] || '');
})();
