import GObject from 'gi://GObject';
import St from 'gi://St';
import GLib from 'gi://GLib';
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
            this.menuItem = new PopupMenu.PopupMenuItem('Kill Processes', { reactive: false });
            this.menu.addMenuItem(this.menuItem);

            this.box = new St.BoxLayout({ vertical: true });
            this.port_entry = new St.Entry({
                style_class: "entry",
                text: "",
                can_focus: true
            });
            this.port_entry.set_style("padding: 5px;");
            this.port_entry.add_style_class_name("kill-port-entry");
            this.box.add_child(this.port_entry);

            this.kill_button = new St.Button({
                label: "Kill Processes",
                style_class: "button"
            });
            this.kill_button.connect('clicked', () => this._kill_processes());
            this.box.add_child(this.kill_button);

            this.menuItem.add_child(this.box);
            this.menuItem.label.text = 'Kill Port';
        }

        async _kill_processes() {
            const port = this.port_entry.get_text().trim();
            const port_number = parseInt(port, 10);

            if (!isNaN(port_number) && port_number > 0) {
                const command = ['fuser', '-k', `${port}/tcp`];

                try {
                    const proc = new Gio.Subprocess({
                        argv: command,
                        flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
                    });
                    const cancellable = new Gio.Cancellable();
                    proc.init(cancellable);

                    const [stdout, stderr] = await proc.communicate_utf8_async(null, null);
                    if (proc.get_successful()) {
                        Main.notify("Success", `Killed processes on port ${port_number}`);
                    } else {
                        Main.notify("Error", `Failed to kill: ${stderr}`);
                    }
                } catch (error) {
                    Main.notify("Error", `An error occurred: ${error.message}`);
                }
            } else {
                Main.notify("Error", "Please enter a valid port number.");
            }
        }
    }
);
