namespace KibrisCicekSepetiDesktop;

partial class Form1
{
    /// <summary>
    ///  Required designer variable.
    /// </summary>
    private System.ComponentModel.IContainer components = null;

    /// <summary>
    ///  Clean up any resources being used.
    /// </summary>
    /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
    protected override void Dispose(bool disposing)
    {
        if (disposing && (components != null))
        {
            components.Dispose();
        }
        base.Dispose(disposing);
    }

    #region Windows Form Designer generated code

    /// <summary>
    ///  Required method for Designer support - do not modify
    ///  the contents of this method with the code editor.
    /// </summary>
    private void InitializeComponent()
    {
        this.pnlHeader = new Panel();
        this.lblBaslik = new Label();
        this.lblAltBaslik = new Label();
        this.pnlSolKart = new Panel();
        this.labelNot = new Label();
        this.txtNotunuz = new TextBox();
        this.pnlSagKart = new Panel();
        this.labelSag = new Label();
        this.txtSiparisNotlari = new TextBox();
        this.btnTemizle = new Button();
        this.btnYazdir = new Button();
        this.lblDurum = new Label();
        this.printDocument1 = new System.Drawing.Printing.PrintDocument();
        this.pnlHeader.SuspendLayout();
        this.pnlSolKart.SuspendLayout();
        this.pnlSagKart.SuspendLayout();
        this.SuspendLayout();
        // 
        // pnlHeader
        // 
        this.pnlHeader.BackColor = Color.FromArgb(235, 242, 250);
        this.pnlHeader.Controls.Add(this.lblAltBaslik);
        this.pnlHeader.Controls.Add(this.lblBaslik);
        this.pnlHeader.Location = new Point(12, 12);
        this.pnlHeader.Name = "pnlHeader";
        this.pnlHeader.Size = new Size(776, 66);
        this.pnlHeader.TabIndex = 0;
        // 
        // lblBaslik
        // 
        this.lblBaslik.AutoSize = true;
        this.lblBaslik.Font = new Font("Segoe UI Semibold", 14F, FontStyle.Bold, GraphicsUnit.Point, ((byte)(162)));
        this.lblBaslik.ForeColor = Color.FromArgb(22, 51, 82);
        this.lblBaslik.Location = new Point(14, 8);
        this.lblBaslik.Name = "lblBaslik";
        this.lblBaslik.Size = new Size(311, 32);
        this.lblBaslik.TabIndex = 0;
        this.lblBaslik.Text = "Kibris Cicek Sepeti Not Alici";
        // 
        // lblAltBaslik
        // 
        this.lblAltBaslik.AutoSize = true;
        this.lblAltBaslik.ForeColor = Color.FromArgb(73, 93, 114);
        this.lblAltBaslik.Location = new Point(16, 40);
        this.lblAltBaslik.Name = "lblAltBaslik";
        this.lblAltBaslik.Size = new Size(302, 20);
        this.lblAltBaslik.TabIndex = 1;
        this.lblAltBaslik.Text = "Notu soldan girin, siparis notlarini sagda tutun";
        // 
        // pnlSolKart
        // 
        this.pnlSolKart.BackColor = Color.White;
        this.pnlSolKart.BorderStyle = BorderStyle.FixedSingle;
        this.pnlSolKart.Controls.Add(this.labelNot);
        this.pnlSolKart.Controls.Add(this.txtNotunuz);
        this.pnlSolKart.Location = new Point(12, 93);
        this.pnlSolKart.Name = "pnlSolKart";
        this.pnlSolKart.Size = new Size(379, 322);
        this.pnlSolKart.TabIndex = 1;
        // 
        // labelNot
        // 
        this.labelNot.AutoSize = true;
        this.labelNot.Font = new Font("Segoe UI", 10F, FontStyle.Bold, GraphicsUnit.Point, ((byte)(162)));
        this.labelNot.ForeColor = Color.FromArgb(34, 51, 72);
        this.labelNot.Location = new Point(12, 11);
        this.labelNot.Name = "labelNot";
        this.labelNot.Size = new Size(67, 23);
        this.labelNot.TabIndex = 0;
        this.labelNot.Text = "Notunuz";
        // 
        // txtNotunuz
        // 
        this.txtNotunuz.BackColor = Color.FromArgb(252, 253, 255);
        this.txtNotunuz.BorderStyle = BorderStyle.FixedSingle;
        this.txtNotunuz.Font = new Font("Segoe UI", 10F, FontStyle.Regular, GraphicsUnit.Point, ((byte)(162)));
        this.txtNotunuz.Location = new Point(12, 42);
        this.txtNotunuz.Multiline = true;
        this.txtNotunuz.Name = "txtNotunuz";
        this.txtNotunuz.PlaceholderText = "Musteriye gidecek notu buraya yazin...";
        this.txtNotunuz.ScrollBars = ScrollBars.Vertical;
        this.txtNotunuz.Size = new Size(352, 265);
        this.txtNotunuz.TabIndex = 1;
        // 
        // pnlSagKart
        // 
        this.pnlSagKart.BackColor = Color.White;
        this.pnlSagKart.BorderStyle = BorderStyle.FixedSingle;
        this.pnlSagKart.Controls.Add(this.labelSag);
        this.pnlSagKart.Controls.Add(this.txtSiparisNotlari);
        this.pnlSagKart.Location = new Point(409, 93);
        this.pnlSagKart.Name = "pnlSagKart";
        this.pnlSagKart.Size = new Size(379, 322);
        this.pnlSagKart.TabIndex = 2;
        // 
        // labelSag
        // 
        this.labelSag.AutoSize = true;
        this.labelSag.Font = new Font("Segoe UI", 10F, FontStyle.Bold, GraphicsUnit.Point, ((byte)(162)));
        this.labelSag.ForeColor = Color.FromArgb(34, 51, 72);
        this.labelSag.Location = new Point(12, 11);
        this.labelSag.Name = "labelSag";
        this.labelSag.Size = new Size(128, 23);
        this.labelSag.TabIndex = 2;
        this.labelSag.Text = "Siparis Notlari";
        // 
        // txtSiparisNotlari
        // 
        this.txtSiparisNotlari.BackColor = Color.FromArgb(252, 253, 255);
        this.txtSiparisNotlari.BorderStyle = BorderStyle.FixedSingle;
        this.txtSiparisNotlari.Font = new Font("Segoe UI", 10F, FontStyle.Regular, GraphicsUnit.Point, ((byte)(162)));
        this.txtSiparisNotlari.Location = new Point(12, 42);
        this.txtSiparisNotlari.Multiline = true;
        this.txtSiparisNotlari.Name = "txtSiparisNotlari";
        this.txtSiparisNotlari.PlaceholderText = "Siparis notlarini burada duzenleyin...";
        this.txtSiparisNotlari.ScrollBars = ScrollBars.Vertical;
        this.txtSiparisNotlari.Size = new Size(352, 265);
        this.txtSiparisNotlari.TabIndex = 3;
        // 
        // btnTemizle
        // 
        this.btnTemizle.BackColor = Color.White;
        this.btnTemizle.FlatStyle = FlatStyle.Flat;
        this.btnTemizle.Font = new Font("Segoe UI", 9F, FontStyle.Bold, GraphicsUnit.Point, ((byte)(162)));
        this.btnTemizle.ForeColor = Color.FromArgb(60, 80, 102);
        this.btnTemizle.Location = new Point(12, 426);
        this.btnTemizle.Name = "btnTemizle";
        this.btnTemizle.Size = new Size(164, 36);
        this.btnTemizle.TabIndex = 3;
        this.btnTemizle.Text = "Notu Temizle";
        this.btnTemizle.UseVisualStyleBackColor = false;
        this.btnTemizle.Click += new EventHandler(this.btnTemizle_Click);
        // 
        // btnYazdir
        // 
        this.btnYazdir.BackColor = Color.FromArgb(11, 112, 207);
        this.btnYazdir.FlatStyle = FlatStyle.Flat;
        this.btnYazdir.Font = new Font("Segoe UI", 10F, FontStyle.Bold, GraphicsUnit.Point, ((byte)(162)));
        this.btnYazdir.ForeColor = Color.White;
        this.btnYazdir.Location = new Point(648, 426);
        this.btnYazdir.Name = "btnYazdir";
        this.btnYazdir.Size = new Size(140, 36);
        this.btnYazdir.TabIndex = 5;
        this.btnYazdir.Text = "YAZDIR";
        this.btnYazdir.UseVisualStyleBackColor = false;
        this.btnYazdir.Click += new EventHandler(this.btnYazdir_Click);
        // 
        // lblDurum
        // 
        this.lblDurum.ForeColor = Color.FromArgb(88, 102, 119);
        this.lblDurum.Location = new Point(188, 434);
        this.lblDurum.Name = "lblDurum";
        this.lblDurum.Size = new Size(445, 20);
        this.lblDurum.TabIndex = 4;
        this.lblDurum.Text = "Hazir";
        this.lblDurum.TextAlign = ContentAlignment.MiddleLeft;
        // 
        // printDocument1
        // 
        this.printDocument1.PrintPage += new System.Drawing.Printing.PrintPageEventHandler(this.printDocument1_PrintPage);
        // 
        // Form1
        // 
        this.AutoScaleDimensions = new SizeF(8F, 20F);
        this.AutoScaleMode = AutoScaleMode.Font;
        this.BackColor = Color.FromArgb(245, 248, 252);
        this.ClientSize = new Size(800, 474);
        this.Controls.Add(this.lblDurum);
        this.Controls.Add(this.btnYazdir);
        this.Controls.Add(this.btnTemizle);
        this.Controls.Add(this.pnlSagKart);
        this.Controls.Add(this.pnlSolKart);
        this.Controls.Add(this.pnlHeader);
        this.FormBorderStyle = FormBorderStyle.FixedSingle;
        this.MaximizeBox = false;
        this.Name = "Form1";
        this.StartPosition = FormStartPosition.CenterScreen;
        this.Text = "Kibris Cicek Sepeti - Not Alici";
        this.pnlHeader.ResumeLayout(false);
        this.pnlHeader.PerformLayout();
        this.pnlSolKart.ResumeLayout(false);
        this.pnlSolKart.PerformLayout();
        this.pnlSagKart.ResumeLayout(false);
        this.pnlSagKart.PerformLayout();
        this.ResumeLayout(false);
    }

    private Panel pnlHeader;
    private Label lblBaslik;
    private Label lblAltBaslik;
    private Panel pnlSolKart;
    private Panel pnlSagKart;
    private Label labelNot;
    private Label labelSag;
    internal TextBox txtNotunuz;
    private TextBox txtSiparisNotlari;
    private Button btnTemizle;
    private Button btnYazdir;
    private Label lblDurum;
    private System.Drawing.Printing.PrintDocument printDocument1;

    #endregion
}
