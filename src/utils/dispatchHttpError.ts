function dispatchHttpError(message: string) {
  globalThis.dispatchEvent(
    new CustomEvent("http-error", {
      detail: {
        message,
        type: "error",
      },
    }),
  );
}

export default dispatchHttpError;
