import { useState, useEffect } from "react";
import "./Home.css";

function Home() {
  const [address, setAddress] = useState("");
  const [searchEngine] = useState("https://www.google.com/search?q=%s");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [scramjet, setScramjet] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const search = (input, template) => {
    try {
      return new URL(input).toString();
      // eslint-disable-next-line
    } catch (err) {
      // Not a valid URL
    }

    try {
      const url = new URL(`http://${input}`);
      if (url.hostname.includes(".")) return url.toString();
      // eslint-disable-next-line
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isInitialized || !connection || !scramjet) {
      setError("Scramjet is not initialized yet. Please wait.");
      return;
    }

    try {
      await registerSW();
    } catch (err) {
      setError("Failed to register service worker.");
      setErrorCode(err.toString());
      return;
    }

    const url = search(address, searchEngine);

    const wispUrl =
      (location.protocol === "https:" ? "wss" : "ws") +
      "://" +
      location.host +
      "/wisp/";

    try {
      if ((await connection.getTransport()) !== "/epoxy/index.mjs") {
        await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
      }

      const frame = scramjet.createFrame();
      frame.frame.id = "sj-frame";
      document.body.appendChild(frame.frame);
      frame.go(url);
    } catch (err) {
      setError("Failed to create proxy frame.");
      setErrorCode(err.toString());
    }
  };

  useEffect(() => {
    if (typeof $scramjetLoadController === "undefined") {
      console.warn("Scramjet not loaded yet, retrying...");
      setTimeout(() => {
        if (typeof $scramjetLoadController !== "undefined") {
          // eslint-disable-next-line
          initializeScramjet();
        } else {
          setError("Scramjet library not loaded");
          setErrorCode(
            "Please check if the Scramjet scripts are loading correctly"
          );
        }
      }, 1000);
      return;
    }

    initializeScramjet();
  }, []);

  const initializeScramjet = async () => {
    try {
      // eslint-disable-next-line
      const { ScramjetController } = $scramjetLoadController();

      const scramjetInstance = new ScramjetController({
        files: {
          wasm: "/scram/scramjet.wasm.wasm",
          all: "/scram/scramjet.all.js",
          sync: "/scram/scramjet.sync.js",
        },
      });

      await scramjetInstance.init();
      setScramjet(scramjetInstance);
      // eslint-disable-next-line
      const connectionInstance = new BareMux.BareMuxConnection(
        "/baremux/worker.js"
      );
      setConnection(connectionInstance);

      setIsInitialized(true);
    } catch (err) {
      console.error("Failed to initialize Scramjet:", err);
      setError("Failed to initialize Scramjet");
      setErrorCode(err.toString());
    }
  };

  return (
    <div>
      <div
        title="Scramjet Logo"
        className="flex-center logo-wrapper header-center"
      >
        <img className="logo" src="/sj.png" alt="Scramjet" />
        <h1>Scramjet | MW</h1>
      </div>

      <div className="flex-center desc left-margin">
        <p>
          Scramjet is an experimental interception based web proxy designed to
          evade internet censorship, bypass arbitrary web browser restrictions
          and innovate web proxy technologies.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-center">
        <input value={searchEngine} type="hidden" />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          type="text"
          placeholder="Search the web freely"
          id="sj-address"
        />
      </form>

      <div className="desc left-margin">
        <p id="sj-error">{error}</p>
        <pre id="sj-error-code">{errorCode}</pre>
      </div>
      <p style={{ color: "white", textAlign: "center" }}>
        ported to react by thedogecraft
      </p>
      <footer>
        <div>
          <a
            title="The Mercury Workshop GitHub organization"
            href="https://github.com/MercuryWorkshop"
          >
            Mercury Workshop
          </a>
          <a
            title="The example demo app for Scramjet"
            href="https://github.com/MercuryWorkshop/Scramjet-Demo"
          >
            GitHub
          </a>
          <a title="License information" href="/credits">
            Credits
          </a>
        </div>
        <div>
          <span>Scramjet &copy; MW 2025</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
