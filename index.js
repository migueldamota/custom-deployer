const core = require("@actions/core");
const github = require("@actions/github");

const styles = require("ansi-styles");
const { NodeSSH } = require("node-ssh");

process.on("unhandledRejection", handleError);
main().catch(handleError);

async function main () {
    const host = core.getInput("host"),
        dir = core.getInput("dir"),
        user = core.getInput("user"),
        port = core.getInput("port"),
        privateKey = core.getInput("private-key");

    core.startGroup("Connecting to SSH");
    const ssh = new NodeSSH();
    await ssh.connect({
        host,
        username: user,
        port,
        password: core.getInput("password"),
    });
    core.endGroup();

    const { runNumber: run } = github.context;
    const sshURL = github.context.payload.repository.ssh_url;
    const directory = `${dir}/${run}`;

    core.startGroup("Create folders");
    log("info", `mkdir ${directory} -p`);
    await ssh.exec(`mkdir ${directory} -p`, []);
    log("info", `cd ${directory}`);
    await ssh.exec(`cd ${directory}`, []);
    core.endGroup();

    core.startGroup("Creating symlink");
    log("info", `ln -s ${directory} ${dir}/current`);
    await ssh.exec(`ln -s ${directory} ${dir}/current`, []);
    core.endGroup();

    core.startGroup("Deployed");
    await ssh.dispose();
    log("info", "Successfully deployed!");
    core.setOutput("deployed", "true");
    core.endGroup();
}

function handleError (error) {
    log("error", error);
    core.setFailed(`Unhandled error: ${error}`);
}

function log (type, message) {
    core[type](`${styles.gray.open}[${styles.green.open}DEPLOY${styles.gray.open}] ${styles.reset.open}${message}`);
}
