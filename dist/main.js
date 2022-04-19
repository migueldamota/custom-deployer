"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = __importDefault(require("@actions/github"));
function init() {
    console.log(github_1.default.context);
}
init();
