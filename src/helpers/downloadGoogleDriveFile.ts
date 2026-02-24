import { AxiosResponse } from "axios";
import downloadFileWithBlob from "./downloadFile";

const getFileName = (res: AxiosResponse): string => {
  const disposition = res.headers["content-disposition"] || "";
  const match = disposition.match(
    /filename\*=UTF-8''([^;\n]+)|filename="([^"\\]+)"|filename=([^;\n]+)/i,
  );

  if (!match) return "downloaded_file";

  const rawName = match[1]
    ? decodeURIComponent(match[1])
    : match[2] || match[3];
  return rawName.trim().replace(/^"|"$/g, "");
};

const normalizeToBlob = (res: AxiosResponse): Blob => {
  const { data, headers } = res;
  const type = headers["content-type"] || "application/octet-stream";

  if (data instanceof Blob) return data;
  if (data instanceof ArrayBuffer) return new Blob([data], { type });

  const buffer = data?.data instanceof ArrayBuffer ? data.data : data;
  return new Blob([buffer], { type });
};

export const downloadFile = async (res: AxiosResponse) => {
  try {
    const fileName = getFileName(res);
    const fileBlob = normalizeToBlob(res);

    downloadFileWithBlob(fileBlob, fileName);
  } catch (error) {
    console.error("File download failed:", error);
    throw error;
  }
};
