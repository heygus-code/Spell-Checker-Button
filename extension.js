// extension.js
import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';


const SpellCheckerButton = GObject.registerClass(
    class SpellCheckerButton extends PanelMenu.Button {
        _init() {
            super._init(0.0, "Spell Checker");

            // Create the button with initial "Check" text
            this.buttonLabel = new St.Label({
                text: 'Check',
                y_align: Clutter.ActorAlign.CENTER,
                style_class: 'spell-check-button'
            });
            
            this.add_child(this.buttonLabel);

            // Initialize state
            this._correctedText = null;
            this._clipboard = St.Clipboard.get_default();
            
            // Set up spell check process
            this._spellCheckCommand = ['aspell', '-a'];
            
            // Connect click handler
            this.connect('button-press-event', this._onButtonClicked.bind(this));
        }

        async _onButtonClicked(actor, event) {
            // Get the button that was clicked (1 = left, 2 = middle)
            const button = event.get_button();
            const clipboardType = button === 2 ? St.ClipboardType.PRIMARY : St.ClipboardType.CLIPBOARD;
            
            if (this.buttonLabel.text === 'Check') {
                try {
                    this._clipboard.get_text(clipboardType, async (clipboard, text) => {
                        if (text) {
                            const word = text.trim();
                            const corrected = await this._checkSpelling(word);
                            if (corrected !== word) {
                                this._correctedText = corrected;
                                this.buttonLabel.set_text(corrected);
                            } else {
                                this._correctedText = word;
                                this.buttonLabel.set_text(word);
                            }
                        }
                    });
                } catch (error) {
                    Main.notify('Spell Check Error', error.message);
                }
            } else {
                // Copy corrected text back to the same clipboard that was used to get it
                if (this._correctedText) {
                    this._clipboard.set_text(clipboardType, this._correctedText);
                    this.buttonLabel.set_text('Check');
                    this._correctedText = null;
                }
            }
        }

        async _checkSpelling(word) {
            try {
                let [success, stdout, stderr, exit_status] = GLib.spawn_command_line_sync(
                    `/bin/bash -c "echo '${word}' | aspell -a | grep '^[&*]' | cut -d':' -f2 | cut -d',' -f1"`
                );
                
                if (success) {
                    let output = imports.byteArray.toString(stdout);
                    print('Raw output:', output);
                    // If output is just '*', the word is correct
                    if (output.trim() === '*') {
                        return word;
                    }
                    // Otherwise return the suggestion
                    if (output.trim()) {
                        return output.trim();
                    }
                }
                return word;
            } catch (error) {
                Main.notify('Spell Check Error', error.message);
                print('Error:', error.message);
                return word;
            }
        }
    });

let spellCheckerButton;

export default class SpellCheckerExtension {
    enable() {
        spellCheckerButton = new SpellCheckerButton();
        Main.panel.addToStatusArea('spell-checker', spellCheckerButton);
    }

    disable() {
        spellCheckerButton?.destroy();
        spellCheckerButton = null;
    }
}