declare module "html-to-docx" {
  interface HtmlToDocxOptions {
    table?: {
      row?: {
        cantSplit?: boolean;
      };
    };
    footer?: boolean;
    recursiveList?: boolean;
    [key: string]: unknown;
  }

  export default function HTMLToDOCX(
    html: string,
    headerHtml?: string | null,
    footerHtml?: string | null,
    options?: HtmlToDocxOptions,
  ): Promise<Buffer>;
}
