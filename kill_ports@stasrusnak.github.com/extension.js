import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export default class KillPortIndicatorExtension extends Extension {
    enable() {
        this._indicator = new KillPortIndicator();
        Main.panel.addToStatusArea('kill-port', this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}

const KillPortIndicator = GObject.registerClass(
    class KillPortIndicator extends PanelMenu.Button {
        _init() {
            super._init(0, "Kill Port", false);

            this.icon = new St.Icon({
                style_class: 'square'
            });
            this.add_child(this.icon);

            this.menuItem = new PopupMenu.PopupMenuItem('', { reactive: false });
            this.menu.addMenuItem(this.menuItem);

            this.vbox = new St.BoxLayout({ vertical: true, style_class: 'kill-port-vbox', x_expand: true });

            this.label = new St.Label({
                text: 'Kill Port',
                style_class: 'kill-port-label',
                x_expand: true
            });
            this.vbox.add_child(this.label);

            this.port_entry = new St.Entry({
                style_class: "kill-port-entry",
                text: "",
                can_focus: true,
                x_expand: true
            });
            this.vbox.add_child(this.port_entry);

            let spacer = new St.Widget({ style_class: 'spacer', x_expand: true });
            this.vbox.add_child(spacer);

            this.kill_button = new St.Button({
                label: "Kill Processes",
                style_class: "kill-port-button",
                x_expand: true
            });
            this.kill_button.connect('clicked', () => this._kill_processes());
            this.vbox.add_child(this.kill_button);

            this.menuItem.add_child(this.vbox);
        }

        async _kill_processes(input = null, cancellable = null) {
            const port = this.port_entry.get_text().trim();
            const port_number = parseInt(port, 10);

            if (isNaN(port_number) || port_number <= 0) {
                Main.notify("Error", "Please enter a valid port number.");
                return;
            }

            const checkPortCommand = ['lsof', '-i', `:${port}`];
            const killCommand = ['fuser', '-k', `${port}/tcp`];

            try {
                const isPortActive = await this._execute_command(checkPortCommand, input, cancellable);
                if (isPortActive.success) {
                    const killResult = await this._execute_command(killCommand, input, cancellable);
                    if (killResult.success) {
                        Main.notify("Success", `Killed processes on port ${port_number}`);
                    } else {
                        Main.notify("Error", `Failed to kill: ${killResult.stderr}`);
                    }
                } else {
                    Main.notify("Error", `Port ${port_number} is not active.`);
                }
            } catch (error) {
                Main.notify("Error", `An error occurred: ${error.message}`);
            }
        }

        async _execute_command(command, input, cancellable) {
            const proc = new Gio.Subprocess({
                argv: command,
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
            });
            proc.init(cancellable);

            try {
                const [stdout, stderr] = await new Promise((resolve, reject) => {
                    proc.communicate_utf8_async(input, cancellable, (proc, res) => {
                        try {
                            const result = proc.communicate_utf8_finish(res);
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    });
                });

                return {
                    success: proc.get_successful(),
                    stdout: String(stdout).trim(),
                    stderr: String(stderr).trim()
                };
            } catch (error) {
                throw new Error(`Command execution failed: ${error.message}`);
            }
        }
    }
);
