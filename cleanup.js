// Refer to README for instructions on how to use this script.
const path = require("path");
const fs = require("fs");

const args = process.argv.slice(2);
const targetDir = args[0] ?? "";
const isDryRun = args[1] == "--dry-run";

if (targetDir == "") {
    console.error("Missing required param: <target-dir>. Run as 'node cleanup.js <target-dir>'")
    process.exit(0);
}

const doc_filetypes = [
    ".md",
    ".png",
    ".jpeg",
    ".jpg"
]
const startDir = path.join(process.cwd(), targetDir);
let dirs_to_del = new Set();

function mark_dirs_to_del(dir) {

    // check if there are any *.md files in current dir or any of the child dirs
    const files = [];
    const child_dirs = [];

    if (fs.existsSync(dir)) {
        fs.readdirSync(dir, { withFileTypes: true })
            .map(dirent => {
                if (dirent.isDirectory() && !dirent.name.startsWith(".")) {
                    child_dirs.push(dirent.name);
                } else {
                    files.push(dirent.name);
                }
            })

        let no_doc_files = true;

        for (file of files) {
            doc_filetypes.forEach(filetype => {
                if (file.endsWith(filetype)) {
                    no_doc_files = false;
                }
            })

            if (!no_doc_files) {
                break;
            }
        }


        for (var child_dir_nam of child_dirs) {
            mark_dirs_to_del(path.join(dir, child_dir_nam));
        }

        let no_doc_files_child_dirs = true;

        for (var child_dir_name of child_dirs) {
            const child_dir = path.join(dir, child_dir_name);
            if (!dirs_to_del.has(child_dir)) {
                no_doc_files_child_dirs = false;
                break;
            }
        }

        if (no_doc_files && no_doc_files_child_dirs) {
            dirs_to_del.add(dir)

            for (var child_dir_name of child_dirs) {
                const child_dir = path.join(dir, child_dir_name);

                dirs_to_del.delete(child_dir);
            }
        }
    }
}

mark_dirs_to_del(startDir)
dirs_to_del = Array.from(dirs_to_del);
console.log(`Detected non-doc directories (count: ${dirs_to_del.length}):`);
console.log(dirs_to_del);

if (isDryRun) {
    console.warn("Dry run only. No files will be deleted.");
} else {
    // Delete all the marked directories
    for (var dir of dirs_to_del) {
        fs.rmdir(dir, { recursive: true }, error => {
            if (error) {
                throw error;
            }
        })
    }
}
