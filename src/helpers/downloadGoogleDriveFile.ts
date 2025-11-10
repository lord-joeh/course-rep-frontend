import { AxiosResponse } from "axios";

export const downloadFile = async (res: AxiosResponse) => {
  try {
    // Axios may provide headers as a plain object or as an AxiosHeaders instance
    const headers: any = (res && res.headers) || {};

    const headerGet = (name: string) => {
      if (!headers) return undefined;
      if (typeof headers.get === "function") return headers.get(name);
      // try common casings
      return (
        headers[name] ||
        headers[name.toLowerCase()] ||
        headers[name.toUpperCase()]
      );
    };

    // Try several header name variants and support RFC5987 encoded filenames
    const contentDisposition =
      headerGet("content-disposition") ||
      headerGet("Content-Disposition") ||
      "";

    // Match patterns like: filename*=UTF-8''encoded-name OR filename="name" OR filename=name
    const fileNameMatch = String(contentDisposition).match(
      /filename\*=UTF-8''([^;\n]+)|filename="([^"\\]+)"|filename=([^;\n]+)/i,
    );
    let fileName = "downloaded_file";
    if (fileNameMatch) {
      if (fileNameMatch[1]) {
        // RFC5987 encoded filename
        try {
          fileName = decodeURIComponent(fileNameMatch[1]);
        } catch (e) {
          fileName = fileNameMatch[1];
        }
      } else if (fileNameMatch[2]) {
        fileName = fileNameMatch[2];
      } else if (fileNameMatch[3]) {
        fileName = fileNameMatch[3];
      }
    }

    // sanitize filename: remove surrounding quotes and whitespace
    fileName = String(fileName).trim().replace(/^"|"$/g, "");

    const contentType =
      (headerGet("content-type") as string) || "application/octet-stream";

    // Normalize response data to a Blob
    let fileBlob: Blob;

    if (res.data instanceof Blob) {
      fileBlob = res.data;
    } else if (res.data instanceof ArrayBuffer) {
      fileBlob = new Blob([res.data], { type: contentType });
    } else if (typeof res.data === "string") {
      // Some servers (or misconfigured axios) return a binary string.
      const str = res.data;
      const len = str.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = str.charCodeAt(i) & 0xff;
      }
      fileBlob = new Blob([bytes], { type: contentType });
    } else if (
      res.data &&
      typeof res.data === "object" &&
      (res.data as any).data instanceof ArrayBuffer
    ) {
      // Axios sometimes nests arraybuffer inside data property
      fileBlob = new Blob([(res.data as any).data], { type: contentType });
    } else {
      // Fallback: if axios returned a blob-like object (e.g. responseType: 'blob' but wrapped), try to create Blob
      try {
        fileBlob = new Blob([res.data], { type: contentType });
      } catch (e) {
        fileBlob = new Blob([JSON.stringify(res.data)], { type: contentType });
      }
    }

    // Create download link
    const url = window.URL.createObjectURL(fileBlob);
    const link = document.createElement("a");
    link.href = url;
    // set download attribute directly
    (link as HTMLAnchorElement).download = fileName;

    // Append, click and cleanup
    document.body.appendChild(link);
    link.click();
    // Prefer modern remove()
    if (typeof link.remove === "function") link.remove();
    else if (link.parentNode) link.parentNode.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw error;
  }
};
