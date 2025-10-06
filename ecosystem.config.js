module.exports = {
  apps: [
    {
      name: "server",
      script: "bun",
      args: "run start",
      cwd: "/home/rotazap/server",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
