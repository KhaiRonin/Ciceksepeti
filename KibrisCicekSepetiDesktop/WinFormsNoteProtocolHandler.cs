using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Threading;

namespace KibrisCicekSepetiDesktop;

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

        // Exit only when the incoming note is successfully sent to an already running instance.
        // If no note exists (normal app launch) or forwarding fails, continue and open a UI instance.
        if (!createdNew && !string.IsNullOrWhiteSpace(incomingNote))
        {
            var forwarded = SendNoteToRunningInstance(incomingNote);
            if (forwarded)
            {
                return;
            }
        }

        var mainForm = new Form1();
        StartPipeServer(mainForm);

        if (!string.IsNullOrWhiteSpace(incomingNote))
        {
            mainForm.SetGiftNote(incomingNote);
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
                    if (string.IsNullOrWhiteSpace(note)) continue;

                    if (form.IsHandleCreated)
                    {
                        form.BeginInvoke(() => form.SetGiftNote(note));
                    }
                }
                catch
                {
                    // Keep listening while app is alive.
                }
            }
        });
    }

    private static bool SendNoteToRunningInstance(string? note)
    {
        if (string.IsNullOrWhiteSpace(note)) return false;

        try
        {
            using var client = new NamedPipeClientStream(".", PipeName, PipeDirection.Out);
            client.Connect(timeout: 1000);

            using var writer = new StreamWriter(client) { AutoFlush = true };
            writer.Write(note);
            return true;
        }
        catch
        {
            try
            {
                Clipboard.SetText(note);
            }
            catch
            {
                // Ignore clipboard fallback failures.
            }

            return false;
        }
    }
}
