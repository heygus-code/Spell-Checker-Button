const GLib = imports.gi.GLib;

function checkSpelling(word) {
    try {
        let [success, stdout, stderr, exit_status] = GLib.spawn_command_line_sync(
            `/bin/bash -c "echo '${word}' | aspell -a | grep '^[&*]' | cut -d':' -f2 | cut -d',' -f1"`
        );
        
        if (success) {
            let output = imports.byteArray.toString(stdout);
            print('Raw output:', output);
            
            if (output.trim()) {
                return output.trim();
            }
        }
        
        return word;
    } catch (error) {
        print('Error:', error.message);
        return word;
    }
}

// Test the function
let testWord = 'drivver';
print('Testing word:', testWord);
let result = checkSpelling(testWord);
print('Result:', result);