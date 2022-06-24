const core = require("@actions/core");
const github = require("@actions/github");

const colors = require("colors");
colors.enable();
const { NodeSSH } = require("node-ssh");

main();

async function main () {
    const host = core.getInput("host"),
        dir = core.getInput("dir"),
        user = core.getInput("user"),
        port = core.getInput("port"),
        privateKey = core.getInput("private-key"),
        token = core.getInput("token"),
        type = core.getInput("type").toLowerCase();

    const afterDeploy = core.getInput("after_deploy");

    log("info", "Connecting to SSH");
    const ssh = new NodeSSH();
    await ssh.connect({ host, username: user, port, password: core.getInput("password") });

    const { runNumber: run } = github.context;
    const repoURL = `https://${github.context.repo.owner}:${token}@github.com/${github.context.repo.owner}/${github.context.repo.repo}`;
    const directory = `${dir}/${run}`;

    core.startGroup("[deploy:setup] Setup deploy");

    log("info", `mkdir ${directory} -p`);
    await ssh.exec(`mkdir ${directory} -p`, []);

    core.endGroup();

    core.startGroup("[deploy:setup_github] Setup GitHub");
    const githubDir = `${directory}/.github`;

    log("info", `clearing old folders`);
    await ssh.exec(`touch ${githubDir} && rm -rf ${githubDir}`, []);

    log("info", `mkdir ${githubDir} -p`);
    await ssh.exec(`mkdir ${githubDir} -p`, []);

    // const branchName = github.context.ref.substring(11);
    log("info", `Cloning repo (${github.context.repo.owner}/${github.context.repo.repo})`);
        await ssh.exec(`git clone ${repoURL} ${githubDir}`, [], { stream: "stderr" }, (data) => {
        console.log(data);
    });
    core.endGroup();

    core.startGroup("[deploy:react] Installing dependencies and build");
    if (type === "react") {
        // install npm dependencies for type `react`
        log("info", "Installing dependencies...");
        await ssh.exec(`cd ${githubDir} && npm install --silent`, []);

        log("info", "Building...");
        await ssh.exec(`cd ${githubDir} && npm run build`, []);
    }
    core.endGroup();

    core.startGroup("[deploy:move_files] Move files to current release");

    if (type === "react") {
        log("info", `cp -r ${githubDir}/build ${directory}`);
        await ssh.exec(`cp -r ${githubDir}/build ${directory}`, []);
    } else {
        log("info", `cp -r ${githubDir} ${directory}`);
        await ssh.exec(`cp -r ${githubDir} ${directory}`, []);
    }

    core.endGroup();

    core.startGroup("[deploy:symlinks] Creating symlink");
    log("info", `touch ${dir}/current && rm ${dir}/current`);
    await ssh.exec(`touch ${dir}/current && rm ${dir}/current`, []);
    log("info", `ln -s ${directory} ${dir}/current`);
    await ssh.exec(`ln -s ${directory} ${dir}/current`, []);
    core.endGroup();

    if (afterDeploy) {
        core.startGroup("[deploy:after_deploy] Running after deploy commands");
        log("info", `${afterDeploy}`);
        await ssh.execCommand(`cd ${dir}/current && ${afterDeploy}`);
        core.endGroup();
    }

    core.startGroup("[deploy:symlinks] Cleanup");
    log("info", `rm -rf ${directory}/.github`);
    await ssh.exec(`rm -rf ${directory}/.github`, []);
    core.endGroup();

    await ssh.dispose();
    log("info", "Disconnect from SSH");
    log("info", "Successfully deployed!");
    core.setOutput("deployed", "true");
}

function log (type, message) {
    core[type](["[".gray,"DEPLOY".green,"] ".gray,message].join(""));
}
