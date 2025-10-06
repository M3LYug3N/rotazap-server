module.exports = {
  apps: [
    {
      name: "server",
      script: "/home/rotazap/.bun/bin/bun",
      args: "run start",
      cwd: "/home/rotazap/rotazap-server",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: "5000",
      },
    },
  ],
};
