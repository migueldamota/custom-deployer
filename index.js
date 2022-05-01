const core = require("@actions/core");
const github = require("@actions/github");

const { NodeSSH } = require("node-ssh");

process.on("unhandledRejection", handleError);
main().catch(handleError);

async function main () {
    const host = core.getInput("host"),
        dir = core.getInput("dir"),
        user = core.getInput("user"),
        port = core.getInput("port"),
        privateKey = core.getInput("private-key");

    const ssh = new NodeSSH();
    await ssh.connect({
        host,
        username: user,
        port,
        password: core.getInput("password"),
    });

    const { runNumber: run } = github.context;

    const sshURL = github.context.payload.repository.ssh_url;

    const directory = `${dir}/${run}`;

    core.startGroup("Create folders");
    await ssh.exec(`mkdir ${directory} -p`);
    await ssh.exec(`cd ${directory}`);
    core.endGroup();

    core.startGroup("Deployed");
    await ssh.dispose();
    core.info("Successfully deployed!");
    core.setOutput("deployed", "true");
    core.endGroup();
}

function handleError (error) {
    console.error(error);
    core.setFailed(`Unhandled error: ${error}`);
}

function log () {

}
