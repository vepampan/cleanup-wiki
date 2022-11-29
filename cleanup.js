const path = require("path");
const fs = require("fs");
// NOTES on how to run: :
// 1. Store outside repo since it gets deleted (e.g.: repos/md-only-script.js)
// 2. Run - node md-only-script.js msnews-experiences
const args = process.argv.slice(2);
const targetDir = args[0] ?? "";
const isDryRun = args[1] == "--dry-run";

console.warn("Dry run only. No files will be deleted.");

if (targetDir == "") {
    console.error("Missing required param: <target-dir>. Run as 'node cleanup.js <target-dir>'")
    process.exit(0);
}

const rootDir = process.cwd();
const startDir = path.join(rootDir, targetDir);

let dirs_to_del = new Set();
mark_dirs_to_del(startDir)

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

        let no_md = true;

        for (file of files) {
            if (file.endsWith(".md")) {
                no_md = false;
                break;
            }
        }


        for (var child_dir_nam of child_dirs) {
            mark_dirs_to_del(path.join(dir, child_dir_nam));
        }

        let no_md_child_dirs = true;

        for (var child_dir_name of child_dirs) {
            const child_dir = path.join(dir, child_dir_name);
            if (!dirs_to_del.has(child_dir)) {
                no_md_child_dirs = false;
                break;
            }
        }

        if (no_md && no_md_child_dirs) {
            dirs_to_del.add(dir)

            for (var child_dir_name of child_dirs) {
                const child_dir = path.join(dir, child_dir_name);

                dirs_to_del.delete(child_dir);
            }
        }

    }

}

dirs_to_del = Array.from(dirs_to_del);

if (isDryRun) {
    console.log(`Delete count: ${dirs_to_del.length}. Following files will be deleted:`);
    console.log(dirs_to_del);
} else {
    // Delete all the dirs marked for deletion
    for (var dir of dirs_to_del) {
        fs.rmdir(dir, { recursive: true }, error => {
            if (error) {
                throw error;
            }
        })
    }
}
