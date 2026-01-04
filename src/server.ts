import app from "./index.js";

app.listen(7777);
console.log(
    `🚀 Server running at ${app.server?.hostname}:${app.server?.port}`
);