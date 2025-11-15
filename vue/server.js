import { createServer } from "node:http";
import { fileURLToPath } from "url";
import { hostname } from "node:os";
import { existsSync } from "node:fs";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";

import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const distPath = fileURLToPath(new URL("./dist/", import.meta.url));
const publicPath = fileURLToPath(new URL("./public/", import.meta.url));
const isProduction = existsSync(distPath);

// Wisp Configuration: Refer to the documentation at https://www.npmjs.com/package/@mercuryworkshop/wisp-js

logging.set_level(logging.NONE);
Object.assign(wisp.options, {
	allow_udp_streams: false,
	hostname_blacklist: [/example\.com/],
	dns_servers: ["1.1.1.3", "1.0.0.3"],
});

const fastify = Fastify({
	serverFactory: (handler) => {
		return createServer()
			.on("request", (req, res) => {
				res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
				res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
				handler(req, res);
			})
			.on("upgrade", (req, socket, head) => {
				if (req.url.endsWith("/wisp/")) wisp.routeRequest(req, socket, head);
				else socket.end();
			});
	},
});

// Serve static files
if (isProduction) {
	// In production, serve from dist (built Vue app)
	fastify.register(fastifyStatic, {
		root: distPath,
		decorateReply: true,
	});
} else {
	// In development, serve from public
	fastify.register(fastifyStatic, {
		root: publicPath,
		decorateReply: true,
	});
}

// Always serve Scramjet libraries
fastify.register(fastifyStatic, {
	root: scramjetPath,
	prefix: "/scram/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: epoxyPath,
	prefix: "/epoxy/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: baremuxPath,
	prefix: "/baremux/",
	decorateReply: false,
});

fastify.get("/", (request, reply) => {
	if (isProduction) {
		return reply.sendFile("index.html", { root: distPath });
	} else {
		return reply.sendFile("index.html", { root: publicPath });
	}
});

// Handle Vue routing - serve index.html for client-side routes
fastify.setNotFoundHandler((request, reply) => {
	// Check if this looks like a file request (has extension)
	const url = request.url || "";
	const hasExtension = /\.[^/]+$/.test(url);

	// If it has an extension, it's probably a missing file - serve 404
	if (hasExtension) {
		return reply
			.code(404)
			.type("text/html")
			.sendFile("404.html", { root: publicPath });
	}

	// Otherwise, it's likely a Vue route - serve the app
	const root = isProduction ? distPath : publicPath;
	return reply.sendFile("index.html", { root });
});

fastify.server.on("listening", () => {
	const address = fastify.server.address();

	// by default we are listening on 0.0.0.0 (every interface)
	// we just need to list a few
	console.log("Listening on:");
	console.log(`\thttp://localhost:${address.port}`);
	console.log(`\thttp://${hostname()}:${address.port}`);
	console.log(
		`\thttp://${
			address.family === "IPv6" ? `[${address.address}]` : address.address
		}:${address.port}`
	);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
	console.log("SIGTERM signal received: closing HTTP server");
	fastify.close();
	process.exit(0);
}

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

fastify.listen({
	port: port,
	host: "0.0.0.0",
});
