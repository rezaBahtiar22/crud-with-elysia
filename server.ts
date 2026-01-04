import app from "./index.js";

app.listen(3000);
console.log(
    `🚀 Server running at ${app.server?.hostname}:${app.server?.port}`
);