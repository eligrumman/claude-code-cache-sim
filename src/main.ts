import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";
import { bootAssert } from "./game/assert.js";

// Gated boot invariants (console.assert; never break the page).
bootAssert();

const app = mount(App, { target: document.getElementById("app")! });

export default app;
