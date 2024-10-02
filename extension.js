import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import { Button } from 'resource:///org/gnome/shell/ui/panelMenu.js';
import GObject from 'gi://GObject';
import { panel } from 'resource:///org/gnome/shell/ui/main.js';

export class KillPortIndicator extends Button {
  _init() {
    super._init(0, "Kill Port", false);

    this.box = new St.BoxLayout({ vertical: true });

    // Create entry for port number
    this.port_entry = new St.Entry({
      style_class: "entry",
      text: "", // Start with empty text
      can_focus: true
    });
    this.port_entry.set_style("padding: 5px;"); // Add some padding
    this.port_entry.add_style_class_name("kill-port-entry"); // Custom class for CSS styling
    this.box.add_child(this.port_entry);

    // Create kill button
    this.kill_button = new St.Button({
      label: "Kill Processes",
      style_class: "button"
    });
    this.kill_button.connect('clicked', () => this._kill_processes());
    this.box.add_child(this.kill_button);

    this.add_child(this.box);

    // Add placeholder text through CSS
    this.port_entry.placeholder_text = "Enter port number"; // Setting placeholder text
  }

  // Function to kill processes on the specified port
  _kill_processes() {
    const port = this.port_entry.get_text().trim();
    const port_number = parseInt(port, 10);

    if (!isNaN(port_number) && port_number > 0) {
      const command = `fuser -k ${port}/tcp`;
      const [ok, out, err, exit] = GLib.spawn_command_line_sync(command);

      if (ok) {
        Main.notify("Success", `Killed processes on port ${port_number}`);
      } else {
        Main.notify("Error", `Failed to kill processes: ${err}`);
      }
    } else {
      Main.notify("Error", "Please enter a valid port number.");
    }
  }

  // Stop updates
  stop() {
    // Any cleanup can be done here
  }
}

// Register the KillPortIndicator class
GObject.registerClass({
  GTypeName: 'KillPortIndicator'
}, KillPortIndicator);

// Main extension class
export default class KillPortExtension {
  _indicator;

  enable() {
    this._indicator = new KillPortIndicator();
    panel.addToStatusArea('kill-port', this._indicator);
  }

  disable() {
    this._indicator.stop();
    this._indicator.destroy();
    this._indicator = undefined;
  }
}
