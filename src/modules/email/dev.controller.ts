import { Controller, Get, Query } from "@nestjs/common";
import * as fs from "fs";
import Handlebars from "handlebars";
import { decode as htmlDecode } from "html-entities";
import * as path from "path";

Handlebars.registerHelper("json", (context) =>
  JSON.stringify(context, null, 2),
);

@Controller("dev")
export class DevController {
  @Get("email-preview")
  previewEmail(
    @Query("template") template: string,
    @Query("username") username?: string,
    @Query("email") email?: string,
    @Query("resetLink") resetLink?: string,
    @Query("changes") changes?: string,
  ) {
    const filePath = path.resolve(
      process.cwd(),
      "src",
      "modules",
      "email",
      "templates",
      `${template}.hbs`,
    );

    if (!fs.existsSync(filePath)) {
      return `Шаблон "${template}" не найден`;
    }

    const templateStr = fs.readFileSync(filePath, "utf8");
    const compiled = Handlebars.compile(templateStr);

    const decodedChanges = htmlDecode(changes || "");

    const context = this.getTemplateContext(template, {
      username,
      email,
      resetLink,
      changes: decodedChanges,
    });

    console.log("🔍 context:", context);
    return compiled(context);
  }

  private getTemplateContext(
    template: string,
    values: {
      username?: string;
      email?: string;
      resetLink?: string;
      changes?: string;
    },
  ): Record<string, any> {
    switch (template) {
      case "welcome":
        return { username: values.username, email: values.email };
      case "reset-password":
        return { resetLink: values.resetLink, email: values.email };
      case "reset-password-success":
        return { email: values.email };
      case "profile-update":
        return {
          email: values.email,
          changes: values.changes,
        };
      default:
        return {};
    }
  }
}
