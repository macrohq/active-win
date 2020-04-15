"use strict";
const { promisify } = require("util");
const fs = require("fs");
const childProcess = require("child_process");

const execFile = promisify(childProcess.execFile);

const xpropBin = "xprop";
const xwininfoBin = "xwininfo";
const xpropActiveArgs = ["-root", "\t$0", "_NET_ACTIVE_WINDOW"];
const xpropDetailsArgs = ["-id"];

const processOutput = (output) => {
	const result = {};

	for (const row of output.trim().split("\n")) {
		if (row.includes("=")) {
			const [key, value] = row.split("=");
			result[key.trim()] = value.trim();
		} else if (row.includes(":")) {
			const [key, value] = row.split(":");
			result[key.trim()] = value.trim();
		}
	}

	return result;
};

const parseLinux = ({ stdout }) => {
	const result = processOutput(stdout);
	return {
		platform: "linux",
		owner: {
			name: JSON.parse(result["WM_CLASS(STRING)"].split(",").pop()),
		},
	};
};

const getActiveWindowId = (activeWindowIdStdout) =>
	parseInt(activeWindowIdStdout.split("\t")[1], 16);

module.exports = async () => {
	try {
		const { stdout: activeWindowIdStdout } = await execFile(
			xpropBin,
			xpropActiveArgs
		);
		const activeWindowId = getActiveWindowId(activeWindowIdStdout);

		if (!activeWindowId) {
			return;
		}

		const [{ stdout }] = await Promise.all([
			execFile(xpropBin, xpropDetailsArgs.concat([activeWindowId])),
			execFile(xwininfoBin, xpropDetailsArgs.concat([activeWindowId])),
		]);

		const data = parseLinux({
			stdout,
		});
		return data;
	} catch (_) {
		return undefined;
	}
};

module.exports.sync = () => {
	try {
		const activeWindowIdStdout = childProcess.execFileSync(
			xpropBin,
			xpropActiveArgs,
			{ encoding: "utf8" }
		);
		const activeWindowId = getActiveWindowId(activeWindowIdStdout);

		if (!activeWindowId) {
			return;
		}

		const stdout = childProcess.execFileSync(
			xpropBin,
			xpropDetailsArgs.concat(activeWindowId),
			{ encoding: "utf8" }
		);

		const data = parseLinux({
			stdout,
		});
		return data;
	} catch (_) {
		return undefined;
	}
};
