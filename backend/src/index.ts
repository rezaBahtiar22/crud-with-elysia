import app from "./server.js";

app.listen({
    port: 3000,
    hostname: "0.0.0.0"
});
console.log(
    `🚀 Server running at ${app.server?.hostname}:${app.server?.port}`
);