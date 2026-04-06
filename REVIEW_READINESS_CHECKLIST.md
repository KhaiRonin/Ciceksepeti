# Review Readiness Checklist

Bu dosya, projeyi dış incelemeye hazırlarken ekip içi kontrol listesi olarak kullanılır.

## 1) Ürün ve UX Tutarlılığı
- [ ] Admin ekranlarında metin dili tek tonda (resmi ama anlaşılır).
- [ ] Boş durum, yükleniyor ve hata mesajları bağlama uygun.
- [ ] Form doğrulama mesajları aksiyonu tarif ediyor ("neyi düzeltmeliyim?").

## 2) Backend Güvenlik ve Doğrulama
- [ ] Write isteklerinde sadece beklenen Content-Type kabul ediliyor.
- [ ] Dosya upload endpointleri mime type ve boyut limiti kontrol ediyor.
- [ ] Yetki gerektiren endpointlerde guard/role kontrolü doğrulandı.

## 3) Test Kapsamı (Kritik Akışlar)
- [ ] Auth: login/refresh/logout senaryoları.
- [ ] Category image upload: yetkili, yetkisiz, yanlış mime, boyut aşımı.
- [ ] Admin reports: tarih filtresi ve boş veri senaryosu.

## 4) Operasyonel Hazırlık
- [ ] `npm run build` frontend ve backend için başarılı.
- [ ] Gerekli environment değişkenleri dokümante.
- [ ] Docker ile yerel ayağa kaldırma adımları güncel.

## 5) İnceleme Sırasında Sunulacak Kısa Not
- Ürün kararları: neden bu endpoint/akış seçildi?
- Teknik kararlar: güvenlik ve doğrulama kuralları.
- Bilinen sınırlamalar: şu an kapsam dışı kalan maddeler.
