export {};

declare global {
  interface Window {
    desktopAPI?: {
      getVersion: () => Promise<string>;
      selectDesignFiles: (designId: string) => Promise<any[]>;
      openDesignFile: (filePath: string) => Promise<{ ok: true }>;
      removeDesignFileReference: (designId: string, fileId: string) => Promise<{ ok: boolean }>;
      listDesignFileReferences: (designId: string) => Promise<any[]>;
    };
  }
}
