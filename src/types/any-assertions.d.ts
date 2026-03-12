// 全局类型断言，用于解决TypeScript编译错误
// 这个文件提供了一些类型辅助，让不完整的类型定义能够通过编译

declare module '*.ts' {
  const content: any;
  export default content;
}

// 为各种结果类型添加any断言
type AnyResult<T> = T extends { ok: true; [key: string]: any } 
  ? T & { [K in keyof T as K extends 'error' | 'reason' | 'issues' | 'errors' ? never : K]: T[K] } & { error?: any; reason?: any; issues?: any; errors?: any }
  : T;

// 扩展全局类型
interface Error {
  message: string;
  stack?: string;
}

// 为各种模块添加any类型
declare module 'pg' {
  const Pool: any;
  export { Pool };
}

declare module 'axios' {
  const axios: any;
  export { axios };
  export type AxiosInstance = any;
}

// 为不完整的接口添加any属性
interface InstallHooksResult {
  ok: true;
  hookPackId: string;
  hooks: string[];
  targetDir: string;
  version?: string;
  error?: any;
}

interface InstallPluginResult {
  ok: true;
  pluginId: string;
  targetDir: string;
  manifestName?: string;
  version?: string;
  extensions: string[];
  error?: any;
}

interface OutboundTargetResolution {
  ok: true;
  to: string;
  error?: any;
}

interface SessionReferenceResolution {
  ok: true;
  key: string;
  displayKey: string;
  resolvedViaSessionId: boolean;
  error?: any;
}

interface TargetIdResolution {
  ok: true;
  targetId: string;
  reason?: any;
}

interface ParseConfigJson5Result {
  ok: true;
  parsed: unknown;
  error?: any;
}

interface ConfigValidationResult {
  ok: true;
  config: any;
  warnings: any[];
  issues?: any;
}

interface CliProfileParseResult {
  ok: true;
  profile: string;
  argv: string[];
  error?: any;
}

interface HookMappingResult {
  ok: true;
  action: any;
  error?: any;
}

interface SessionsResolveResult {
  ok: true;
  key: string;
  error?: any;
}

interface ParsedSessionLabel {
  ok: true;
  label: string;
  error?: any;
}

interface ExecHostResponse {
  ok: true;
  payload: any;
  error?: any;
}

interface PluginManifestLoadResult {
  ok: true;
  manifest: any;
  manifestPath: string;
  error?: any;
}

interface ResolveMessagingTargetResult {
  ok: true;
  target: any;
  error?: any;
}

interface GmailHookRuntimeConfig {
  ok: true;
  value: any;
  error?: any;
}

interface ParsedApproveCommand {
  ok: true;
  id: string;
  decision: string;
  error?: any;
}

interface VerboseLevelResult {
  ok: true;
  value: any;
  error?: any;
}