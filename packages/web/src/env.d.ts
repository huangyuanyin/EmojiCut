/// <reference types="@rsbuild/core/types" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.less' {
  const classes: { [key: string]: string };
  export default classes;
}
