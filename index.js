const core = require("@actions/core");
const github = require("@actions/github");

process.on("unhandledRejection", handleError);
main().catch(handleError);

async function main () {
    core.info("Hello!");
}

function handleError (error) {
    console.error(error);
    core.setFailed(`Unhandled error: ${error}`);
}
