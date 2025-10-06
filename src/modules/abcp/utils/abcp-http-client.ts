import { Logger } from "@nestjs/common";
import axios, { AxiosError } from "axios";

interface AbcpRequestParams {
  host: string;
  login: string;
  password: string;
  endpoint: string;
  params?: Record<string, any>;
}

/**
 * Выполняет GET-запрос к API ABCP с авторизацией и базовой обработкой ошибок.
 *
 * @param host - Базовый адрес API (например, https://abcp.ru)
 * @param login - Логин пользователя ABCP
 * @param password - Пароль пользователя ABCP (уже в md5, если требуется)
 * @param endpoint - Путь запроса (например, "/articles/info")
 * @param params - Дополнительные параметры запроса (артикул, бренд и т.д.)
 *
 * @returns JSON-ответ от ABCP API в виде дженерика (по умолчанию any)
 *
 * @throws Error - В случае сетевой ошибки или ответа с кодом ≠ 200
 */
export async function abcpHttpRequest<T = any>({
  host,
  login,
  password,
  endpoint,
  params = {},
}: AbcpRequestParams): Promise<T> {
  const logger = new Logger("AbcpHttpClient");

  logger.log(`🚀 Requesting ABCP API: ${endpoint}`);
  logger.debug(`📌 Params: ${JSON.stringify(params)}`);

  try {
    const response = await axios.get(`${host}${endpoint}`, {
      params: {
        userlogin: login,
        userpsw: password,
        ...params,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      validateStatus: (status) => status < 500,
    });

    if (response.status === 404) {
      logger.warn(`⚠️ Артикул не найден (404): ${endpoint}`);
      return {} as T;
    }

    if (response.status !== 200) {
      logger.error(`❌ API error ${response.status}: ${response.statusText}`);
      throw new Error("Ошибка от ABCP API");
    }

    logger.log(`✅ Response received: ${endpoint}`);
    return response.data as T;
  } catch (error: any) {
    const axiosError = error as AxiosError;
    logger.error(`❌ Ошибка в abcpHttpRequest: ${axiosError.message}`);
    throw new Error("Ошибка при выполнении запроса к ABCP API");
  }
}
