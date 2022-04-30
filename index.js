const core = require("@actions/core");
const github = require("@actions/github");
const { Client } = require("ssh2");

process.on("unhandledRejection", handleError);
main().catch(handleError);

async function main () {
    const host = core.getInput("host"),
        dir = core.getInput("dir"),
        user = core.getInput("user"),
        port = core.getInput("port"),
        privateKey = core.getInput("private-key");

    const ssh = new Client()
        .connect({ host, username: user, port, privateKey, });

    const { runNumber: run } = github.context;

    core.warning(`GitHub SSH: ${github.context.payload.repository.ssh_url}`);
    core.warning(`Run: ${run}`);
    core.info(github.context);


}

function handleError (error) {
    console.error(error);
    core.setFailed(`Unhandled error: ${error}`);
}
