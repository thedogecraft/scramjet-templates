<template>
	<div>
		<div title="Scramjet Logo" class="flex-center logo-wrapper header-center">
			<img class="logo" src="/sj.png" alt="Scramjet" />
			<h1>Scramjet | MW</h1>
		</div>

		<div class="flex-center desc left-margin">
			<p>
				Scramjet is an experimental interception based web proxy designed to
				evade internet censorship, bypass arbitrary web browser restrictions and
				innovate web proxy technologies.
			</p>
		</div>

		<form @submit.prevent="handleSubmit" class="flex-center">
			<input
				v-model="searchEngine"
				value="https://www.google.com/search?q=%s"
				type="hidden"
			/>
			<input
				v-model="address"
				type="text"
				placeholder="Search the web freely"
				id="sj-address"
			/>
		</form>

		<div class="desc left-margin">
			<p id="sj-error">{{ error }}</p>
			<pre id="sj-error-code">{{ errorCode }}</pre>
		</div>
		<p style="color: white; text-align: center">
			ported to vue by thedogecraft
		</p>
		<footer>
			<div>
				<a
					title="The Mercury Workshop GitHub organization"
					href="https://github.com/MercuryWorkshop"
					>Mercury Workshop</a
				>
				<a
					title="The example demo app for Scramjet"
					href="https://github.com/MercuryWorkshop/Scramjet-Demo"
					>GitHub</a
				>
				<a title="License information" href="/credits.html">Credits</a>
			</div>
			<div>
				<span>Scramjet &copy; MW 2025</span>
			</div>
		</footer>
	</div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const address = ref("");
const searchEngine = ref("https://www.google.com/search?q=%s");
const error = ref("");
const errorCode = ref("");

let scramjet = null;
let connection = null;

const search = (input, template) => {
	try {
		return new URL(input).toString();
	} catch (err) {
		// Not a valid URL
	}

	try {
		const url = new URL(`http://${input}`);
		if (url.hostname.includes(".")) return url.toString();
	} catch (err) {
		// Not a valid domain
	}

	return template.replace("%s", encodeURIComponent(input));
};

const registerSW = async () => {
	const stockSW = "/sw.js";
	const swAllowedHostnames = ["localhost", "127.0.0.1"];

	if (!navigator.serviceWorker) {
		if (
			location.protocol !== "https:" &&
			!swAllowedHostnames.includes(location.hostname)
		) {
			throw new Error("Service workers cannot be registered without https.");
		}
		throw new Error("Your browser doesn't support service workers.");
	}

	await navigator.serviceWorker.register(stockSW);
};

const handleSubmit = async () => {
	try {
		await registerSW();
	} catch (err) {
		error.value = "Failed to register service worker.";
		errorCode.value = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);

	const wispUrl =
		(location.protocol === "https:" ? "wss" : "ws") +
		"://" +
		location.host +
		"/wisp/";

	if ((await connection.getTransport()) !== "/epoxy/index.mjs") {
		await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
	}

	const frame = scramjet.createFrame();
	frame.frame.id = "sj-frame";
	document.body.appendChild(frame.frame);
	frame.go(url);
};

onMounted(() => {
	const { ScramjetController } = $scramjetLoadController();

	scramjet = new ScramjetController({
		files: {
			wasm: "/scram/scramjet.wasm.wasm",
			all: "/scram/scramjet.all.js",
			sync: "/scram/scramjet.sync.js",
		},
	});

	scramjet.init();

	connection = new BareMux.BareMuxConnection("/baremux/worker.js");
});
</script>
