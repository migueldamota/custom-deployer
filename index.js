const core = require("@actions/core");
const github = require("@actions/github");

process.on("unhandledRejection", handleError);
main().catch(handleError);

async function main () {
    console.log(github.context)
    core.info(github.context);
}

function handleError (error) {
    console.error(error);
    core.setFailed(`Unhandled error: ${error}`);
}
