const core = require("@actions/core");
const github = require("@actions/github");

const styles = require("ansi-styles");
const { NodeSSH } = require("node-ssh");

process.on("unhandledRejection", handleError);
main();

async function main () {
    const host = core.getInput("host"),
        dir = core.getInput("dir"),
        user = core.getInput("user"),
        port = core.getInput("port"),
        privateKey = core.getInput("private-key"),
        token = core.getInput("token");

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

    core.startGroup("[deploy:setup] Setup deploy");

    log("info", `mkdir ${directory} -p`);
    await ssh.exec(`mkdir ${directory} -p`, []);

    core.endGroup();

    core.startGroup("[deploy:setup_github] Setup GitHub");
    const githubDir = `${dir}/github`;
    
    log("info", `clearing old folders`);
    await ssh.exec(`touch ${githubDir} && rm -rf ${githubDir}`, []);

    log("info", `mkdir ${githubDir} -p`);
    await ssh.exec(`mkdir ${githubDir} -p`, []);

    // const branchName = github.context.ref.substring(11);
    log("info", `cloning repo (${github.context.repo.owner}/${github.context.repo.repo})`);
    await ssh.exec(`git clone https://${github.context.repo.owner}:${token}@github.com/${github.context.repo.owner}/${github.context.repo.repo} ${githubDir}`, [], { stream: "stderr" }, (data) => {
        console.log(data);
    });
    core.endGroup();

    core.startGroup("[deploy:move_files] Move files to current release");
    log("info", `mv ${githubDir}/* ${directory}`);
    await ssh.exec(`mv ${githubDir}/* ${directory}`, []);
    core.endGroup();

    core.startGroup("[deploy:symlinks] Creating symlink");
    log("info", `touch ${dir}/current && rm ${dir}/current`);
    await ssh.exec(`touch ${dir}/current && rm ${dir}/current`, []);
    log("info", `ln -s ${directory} ${dir}/current`);
    await ssh.exec(`ln -s ${directory} ${dir}/current`, []);
    core.endGroup();

    await ssh.dispose();
    log("info", "Disconnect from SSH");
    log("info", "Successfully deployed!");
    core.setOutput("deployed", "true");
}

function handleError (error) {
    log("error", error);
    core.setFailed(`Unhandled error: ${error}`);
}

function log (type, message) {
    core[type](`${styles.gray.open}[${styles.green.open}DEPLOY${styles.gray.open}] ${styles.reset.open}${message}`);
}
