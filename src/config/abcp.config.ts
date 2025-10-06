import { registerAs } from "@nestjs/config";

export default registerAs("abcp", () => ({
  host: process.env.ABCP_HOST!,
  login: process.env.ABCP_LOGIN!,
  password: process.env.ABCP_PASSWORD!,
}));
