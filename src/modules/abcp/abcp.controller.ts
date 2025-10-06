import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Query,
} from "@nestjs/common";

import { AbcpService } from "@/modules/abcp/abcp.service";
import { SearchBrandsDto } from "@/modules/abcp/dto/search-brands.dto";
import { Auth } from "@/modules/auth/decorators/auth.decorator";
import { CurrentUser } from "@/modules/auth/decorators/user.decorator";

@Auth()
@Controller("abcp")
export class AbcpController {
  private readonly logger = new Logger(AbcpController.name);

  constructor(private readonly abcpService: AbcpService) {}

  @Get("brands-dictionary")
  async getBrandsDictionary() {
    return this.abcpService.getBrandsDictionary();
  }

  @Get("search-brands")
  async searchBrands(@Query() query: SearchBrandsDto) {
    return this.abcpService.searchBrands(query.number);
  }

  @Get("article-info")
  async getArticleInfo(
    @Query("brand") brand: string,
    @Query("number") number: string,
    @CurrentUser("id") userId: number,
  ) {
    if (!brand || !number) {
      throw new HttpException(
        "Brand and number are required",
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.abcpService.getEnrichedArticleInfo(brand, number, userId);
  }

  @Get("search-tips")
  async getSearchTips(@Query("number") number: string) {
    if (!number) {
      throw new HttpException("Number is required", HttpStatus.BAD_REQUEST);
    }

    return this.abcpService.getSearchTips(number);
  }
}
