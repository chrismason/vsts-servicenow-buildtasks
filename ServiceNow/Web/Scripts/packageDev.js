var exec = require("child_process").exec;

var manifest = require("../vss-extension.json");
var extensionId = manifest.id;

var command = `tfx extension create --overrides-file ../config/dev.json --manifest-globs vss-extension.json --extension-id ${extensionId}-dev --no-prompt --rev-version`;
exec(command, {
    "cwd": "./dist"
}, (error, stdout) => {
    if (error) {
        console.error(`Could not create package: '${error}'`);
        return;
    }
    console.log("Package created");
})