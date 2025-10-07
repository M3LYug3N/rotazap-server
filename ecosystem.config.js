module.exports = {
  apps: [
    {
      name: "server",
      script: "npm",
      args: "run start:prod",
      cwd: "/home/rotazap/rotazap-server",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
