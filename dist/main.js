import * as core from "@actions/core";
import * as github from "@actions/github";
process.on("unhandledRejection", handleError);
main().catch(handleError);
async function main() {
    console.log(github.context);
}
function handleError(error) {
    console.error(error);
    core.setFailed(`Unhandled error: ${error}`);
}
