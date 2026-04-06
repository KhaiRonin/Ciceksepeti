# WinForms Not Aktarim Entegrasyonu

Bu entegrasyon ile web tarafindaki Notu Kopyala butonu su adimi dener:

- kibrisciceksepetim://note?text=... protokolunu tetikler
- Uygulama bu URI ile acilir ve notu formdaki hedef alana yazar
- Uygulama aciksa NamedPipe ile notu acik pencereye gonderir

Web tarafi hazir:

- order detayinda handoff cagrisi var
- checkout query note destegi var

## 1) Protocol Kaydi

Dosya:

- docs/integrations/register-kibrisciceksepetim-protocol.reg

Yapilacaklar:

1. Reg dosyasindaki exe yolunu kendi uygulama yolunuzla degistirin.
2. Reg dosyasini yonetici hakki gerekmeden kullanici bazli kayit icin cift tiklayin.
3. Tarayicidan su URL test edin:

kibrisciceksepetim://note?text=merhaba

## 2) WinForms Giris Noktasi

Program.cs icini su sekilde baglayin:

using KibrisCicekSepetim;

internal static class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        WinFormsNoteProtocolHandler.Run(args);
    }
}

## 3) Note Handler Sinifi

Dosya:

- docs/integrations/WinFormsNoteProtocolHandler.cs

Bu sinifi WinForms projenize ekleyin.

Dikkat:

- txtNotunuz kontrol adi ornek olarak verildi.
- Formunuzdaki gercek TextBox adina gore guncelleyin.
- Pipe sabiti: KibrisCicekSepetim.NotePipe

## 4) Form1 Tarafi

Iki yoldan birini secin:

- A: Controls.Find ile txtNotunuz TextBox alanina yazdirin.
- B: Form1 icine public method ekleyin:

public void SetGiftNote(string note)
{
    txtNotunuz.Text = note;
}

ve handler icinden bunu cagirin.

## 5) Uc Durumlar

- Uygulama aciksa second-instance URI talepleri NamedPipe ile ana instance'a aktarilir.
- Pipe baglantisi kurulamiyorsa fallback olarak not panoya yazilir.
- Tarayicidan test URL:

kibrisciceksepetim://note?text=merhaba%20dunya

## 6) Hemen Test

1. Uygulamayi normal acin.
2. Webde siparis detayinda Notu Kopyala tiklayin.
3. Formdaki txtNotunuz alaninin doldugunu dogrulayin.
4. Uygulama acik degilken ayni aksiyonu deneyin; uygulama URI ile acilmali.
