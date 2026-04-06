using System;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;
using System.Windows.Forms;

namespace KibrisCicekSepetim;

internal static class WinFormsNoteProtocolHandler
{
    private static Mutex? _singleInstanceMutex;
    private const string PipeName = "KibrisCicekSepetim.NotePipe";

    [STAThread]
    internal static void Run(string[] args)
    {
        ApplicationConfiguration.Initialize();

        var createdNew = false;
        _singleInstanceMutex = new Mutex(true, "KibrisCicekSepetim.SingleInstance", out createdNew);

        var incomingNote = TryExtractNote(args.FirstOrDefault());

        if (!createdNew)
        {
            SendNoteToRunningInstance(incomingNote);
            return;
        }

        var mainForm = new Form1();

        StartPipeServer(mainForm);

        if (!string.IsNullOrWhiteSpace(incomingNote))
        {
            ApplyNoteToMainForm(mainForm, incomingNote);
        }

        Application.Run(mainForm);
    }

    internal static string? TryExtractNote(string? rawArgument)
    {
        if (string.IsNullOrWhiteSpace(rawArgument)) return null;

        if (!Uri.TryCreate(rawArgument, UriKind.Absolute, out var uri)) return null;
        if (!uri.Scheme.Equals("kibrisciceksepetim", StringComparison.OrdinalIgnoreCase)) return null;

        var query = uri.Query.TrimStart('?');
        if (string.IsNullOrWhiteSpace(query)) return null;

        var notePart = query
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault(kv => kv.StartsWith("text=", StringComparison.OrdinalIgnoreCase));

        if (string.IsNullOrWhiteSpace(notePart)) return null;

        var encoded = notePart.Substring("text=".Length);
        var decoded = Uri.UnescapeDataString(encoded).Trim();

        return string.IsNullOrWhiteSpace(decoded) ? null : decoded;
    }

    private static void StartPipeServer(Form1 form)
    {
        _ = Task.Run(async () =>
        {
            while (!form.IsDisposed)
            {
                try
                {
                    using var server = new NamedPipeServerStream(
                        PipeName,
                        PipeDirection.In,
                        1,
                        PipeTransmissionMode.Message,
                        PipeOptions.Asynchronous
                    );

                    await server.WaitForConnectionAsync().ConfigureAwait(false);

                    using var reader = new StreamReader(server);
                    var payload = await reader.ReadToEndAsync().ConfigureAwait(false);
                    var note = payload.Trim();
                    if (string.IsNullOrWhiteSpace(note))
                    {
                        continue;
                    }

                    if (form.IsHandleCreated)
                    {
                        form.BeginInvoke(new Action(() => ApplyNoteToMainForm(form, note)));
                    }
                }
                catch
                {
                    // Sunucu dongusu uygulama kapanana kadar devam eder.
                }
            }
        });
    }

    private static void SendNoteToRunningInstance(string? note)
    {
        if (string.IsNullOrWhiteSpace(note))
        {
            return;
        }

        try
        {
            using var client = new NamedPipeClientStream(".", PipeName, PipeDirection.Out);
            client.Connect(timeout: 1000);

            using var writer = new StreamWriter(client) { AutoFlush = true };
            writer.Write(note);
        }
        catch
        {
            // Pipe'e baglanilamiyorsa fallback olarak panoya yaz.
            Clipboard.SetText(note);
            MessageBox.Show(
                "Acilik uygulamaya ulasilamadi. Not panoya kopyalandi.",
                "Bilgi",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information
            );
        }
    }

    private static void ApplyNoteToMainForm(Form1 form, string note)
    {
        // Formdaki gercek textbox adini kendinize gore guncelleyin.
        var target = form.Controls.Find("txtNotunuz", true).FirstOrDefault() as TextBox;
        if (target != null)
        {
            target.Text = note;
            target.Focus();
            target.SelectionStart = target.TextLength;
            return;
        }

        // TextBox bulunamazsa form title'a notun geldigini yaz.
        form.Text = $"Form1 - Not Alindi ({DateTime.Now:HH:mm:ss})";
    }
}
