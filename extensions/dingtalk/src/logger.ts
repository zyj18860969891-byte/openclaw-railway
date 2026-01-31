/**
 * 钉钉插件日志工具
 *
 * 从 @openclaw/shared 重新导出，保持向后兼容
 */

// 从 shared 包重新导出
export { createLogger, type Logger, type LogLevel, type LoggerOptions } from "@openclaw/shared";

// 为向后兼容保留默认钉钉日志器
import { createLogger } from "@openclaw/shared";

/**
 * 默认钉钉日志器
 */
export const dingtalkLogger = createLogger("dingtalk");
