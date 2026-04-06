(async()=>{
  const url = 'https://www.kibrisciceksepetim.com/index.php?route=product/product&product_id=785';
  const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  const ogMatch = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html);
  console.log('og:', ogMatch ? ogMatch[1] : '');
  const urls = [...new Set((html.match(/https?:\/\/[^\s"'<>]+/g) || []))]
    .filter((u) => u.includes('/image/'))
    .filter((u) => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u));
  console.log('count:', urls.length);
  console.log('first5:', urls.slice(0, 5));
})();
