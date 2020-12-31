import { workspace, ExtensionContext, commands, window } from "vscode";
import { LanguageClientOptions } from "vscode-languageclient";
import { LanguageClient, ServerOptions } from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const jarPath: string = workspace.getConfiguration("millfork").get("jarPath");

  if (jarPath.trim().length < 1) {
    window
      .showErrorMessage(
        "No jarPath configuration provided. Cannot start server",
        "Open extension settings"
      )
      .then((selected: string | undefined) => {
        if (selected) {
          commands.executeCommand("workbench.action.openSettings", "millfork");
        }
      });

    return;
  }

  const path = workspace.asRelativePath(jarPath);

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: {
      command: "java",
      args: ["-jar", path, "-lsp"],
    },
    debug: {
      command: "java",
      args: ["-jar", path, "-lsp"],
    },
  };

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [{ scheme: "file", language: "mfk" }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher("**/.mfk"),
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    "MillforkLanguageServer",
    "Millfork Language Server",
    serverOptions,
    clientOptions
  );

  context.subscriptions.push(
    commands.registerCommand("millfork.restart", async () => {
      await window.showInformationMessage("Restarting Millfork");

      await client.stop();

      await client.start();

      await window.showInformationMessage("Millfork started");
    })
  );

  // Start the client. This will also launch the server
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
