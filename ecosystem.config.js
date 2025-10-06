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
        CLIENT_ORIGINS:
          "https://rotazap.ru,https://www.rotazap.ru,http://45.80.68.160:3000",
      },
    },
  ],
};
