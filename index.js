const { windowManager } = require("node-window-manager");
const { exec } = require("child_process");
const { promisify } = require("util");
const http = require("http");
const bezier = require("bezier-curve");

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @type {import("node-window-manager").Window}
 */
let cmdWindow = null;
let opened = false;

// open the cmd window
const execAsync = promisify(exec);
async function main() {
    execAsync(`start pwsh.exe -WorkingDirectory "C:\\Users\\djlev"`);
    await sleep(1000);
    // get the cmd window
    cmdWindow = windowManager.getActiveWindow();
    cmdWindow.setBounds({
        x: 0,
        y: 1080 * -0.35,
        width: 1920,
        height: 1080 * 0.35
    })
    cmdWindow.hide();
}

main();

// when process ends, close the cmd window
process.on("exit", onExit);
process.on('SIGINT', onExit);

// create an http server
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Done");
    if (!opened) {
        cmdWindow.show();
        cmdWindow.bringToTop();
        animateTerminalDropdown();
        opened = true;
    } else {
        cmdWindow.show();
        cmdWindow.bringToTop();
        animateTerminalClose();
        opened = false;
    }
});

server.listen(1920);

const points = [
    // ease-in-out
    [0, 0],
    [0.16, 0.56],
    [0.17, 0.89],
    [1, 1]
]

const delay = 500;
const duration = delay / 100;

async function animateTerminalDropdown() {
    // change y subtly to make it look like it's dropping down
    // for (let i = 0; i < 100; i++) {
    //     cmdWindow.setBounds({
    //         x: 0,
    //         y: (1080 * -0.35) + (i * 1080 * 0.35 / 100),
    //         width: 1920,
    //         height: 1080 * 0.35
    //     })
    //     await sleep(2.5);
    // }
    for (let t = 0; t < 1; t += 0.01) {
        const [_, y] = bezier(t, points);
        cmdWindow.setBounds({
            x: 0,
            y: (1080 * -0.35) + (y * 1080 * 0.35),
            width: 1920,
            height: 1080 * 0.35
        })
        await sleep(duration);
    }
    cmdWindow.setBounds({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080 * 0.35
    })
}

async function animateTerminalClose() {
    // change y subtly to make it look like it's dropping down
    for (let t = 0; t < 1; t += 0.01) {
        const [_, y] = bezier(t, points);
        cmdWindow.setBounds({
            x: 0,
            y: - (y * 1080 * 0.35),
            width: 1920,
            height: 1080 * 0.35
        })
        await sleep(duration);
    }
    cmdWindow.hide();
}



function onExit() {
    const processId = cmdWindow.processId;
    console.log(`Killing process ${processId}`);
    exec(`taskkill /pid ${processId} /f`);
    server.close();
}