import core from "@actions/core";
import github from "@actions/github";

function init () {
    console.log(github.context);
}

init();
