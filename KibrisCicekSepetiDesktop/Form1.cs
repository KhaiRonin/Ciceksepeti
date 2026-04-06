namespace KibrisCicekSepetiDesktop;

public partial class Form1 : Form
{
    private readonly Font _titleFont = new("Segoe UI", 12, FontStyle.Bold);
    private readonly Font _textFont = new("Segoe UI", 10, FontStyle.Regular);

    public Form1()
    {
        InitializeComponent();
        DoubleBuffered = true;
        ApplyVisualPolish();
        AppendStatus("Uygulama baslatildi.");
        printDocument1.DefaultPageSettings.Landscape = true;
        printDocument1.OriginAtMargins = true;
        printDocument1.DefaultPageSettings.Margins = new System.Drawing.Printing.Margins(30, 30, 30, 30);
    }

    private void ApplyVisualPolish()
    {
        btnTemizle.FlatAppearance.BorderColor = Color.FromArgb(204, 215, 227);
        btnTemizle.FlatAppearance.MouseOverBackColor = Color.FromArgb(244, 248, 253);
        btnTemizle.FlatAppearance.MouseDownBackColor = Color.FromArgb(232, 240, 250);

        btnYazdir.FlatAppearance.BorderSize = 0;
        btnYazdir.FlatAppearance.MouseOverBackColor = Color.FromArgb(8, 102, 190);
        btnYazdir.FlatAppearance.MouseDownBackColor = Color.FromArgb(6, 90, 170);
    }

    internal void SetGiftNote(string note)
    {
        txtNotunuz.Text = note;
        txtNotunuz.Focus();
        txtNotunuz.SelectionStart = txtNotunuz.TextLength;
        AppendStatus("Not alindi.");
    }

    internal void AppendStatus(string message)
    {
        lblDurum.Text = $"[{DateTime.Now:HH:mm:ss}] {message}";
    }

    private void btnTemizle_Click(object sender, EventArgs e)
    {
        txtNotunuz.Clear();
        AppendStatus("Not temizlendi.");
    }

    private void btnYazdir_Click(object sender, EventArgs e)
    {
        using var dialog = new PrintDialog();
        dialog.Document = printDocument1;
        dialog.AllowSomePages = false;

        if (dialog.ShowDialog(this) != DialogResult.OK)
        {
            AppendStatus("Yazdirma iptal edildi.");
            return;
        }

        try
        {
            printDocument1.Print();
            AppendStatus("Yazdirma gonderildi.");
        }
        catch (Exception ex)
        {
            AppendStatus("Yazdirma hatasi: " + ex.Message);
            MessageBox.Show(this, ex.Message, "Yazdirma Hatasi", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void printDocument1_PrintPage(object sender, System.Drawing.Printing.PrintPageEventArgs e)
    {
        var graphics = e.Graphics;
        if (graphics == null)
        {
            e.HasMorePages = false;
            return;
        }

        var bounds = GetPrintableBounds(e);
        var gutter = 14;
        var halfWidth = (bounds.Width - gutter) / 2;

        var leftRect = new Rectangle(bounds.Left, bounds.Top, halfWidth, bounds.Height);
        var rightRect = new Rectangle(bounds.Left + halfWidth + gutter, bounds.Top, halfWidth, bounds.Height);

        using var borderPen = new Pen(Color.Black, 1f);
        using var cutPen = new Pen(Color.Gray, 1f) { DashStyle = System.Drawing.Drawing2D.DashStyle.Dash };

        graphics.DrawRectangle(borderPen, leftRect);
        graphics.DrawRectangle(borderPen, rightRect);

        var cutX = bounds.Left + halfWidth + (gutter / 2);
        graphics.DrawLine(cutPen, cutX, bounds.Top, cutX, bounds.Bottom);

        DrawSection(
            graphics,
            leftRect,
            "Notunuz",
            txtNotunuz.Text
        );

        DrawSection(
            graphics,
            rightRect,
            "Siparis Notlari",
            txtSiparisNotlari.Text
        );

        e.HasMorePages = false;
    }

    private static Rectangle GetPrintableBounds(System.Drawing.Printing.PrintPageEventArgs e)
    {
        var marginBounds = e.MarginBounds;
        if (marginBounds.Width > 100 && marginBounds.Height > 100)
        {
            return marginBounds;
        }

        var printable = Rectangle.Round(e.PageSettings.PrintableArea);
        if (printable.Width > 100 && printable.Height > 100)
        {
            return printable;
        }

        var page = e.PageBounds;
        return Rectangle.Inflate(page, -30, -30);
    }

    private void DrawSection(Graphics g, Rectangle rect, string title, string text)
    {
        var inner = Rectangle.Inflate(rect, -12, -12);
        var titleHeight = 28;
        var titleRect = new Rectangle(inner.Left, inner.Top, inner.Width, titleHeight);
        var contentRect = new Rectangle(inner.Left, inner.Top + titleHeight + 6, inner.Width, inner.Height - titleHeight - 6);

        using var titleBrush = new SolidBrush(Color.Black);
        using var textBrush = new SolidBrush(Color.Black);
        using var format = new StringFormat
        {
            Alignment = StringAlignment.Near,
            LineAlignment = StringAlignment.Near,
            Trimming = StringTrimming.Word,
            FormatFlags = StringFormatFlags.LineLimit
        };

        g.DrawString(title, _titleFont, titleBrush, titleRect, format);
        g.DrawString(text ?? string.Empty, _textFont, textBrush, contentRect, format);
    }

}
