import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("#app container missing");
}

app.innerHTML = `<main class="shell"><h1>Bloons Speed Rounds</h1><p>Scaffold in progress.</p></main>`;
