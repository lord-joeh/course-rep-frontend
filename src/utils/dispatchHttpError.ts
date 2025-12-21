function dispatchHttpError(message: string) {
  window.dispatchEvent(
    new CustomEvent("http-error", {
      detail: {
        message,
        type: "error",
      },
    }),
  );
}

export default dispatchHttpError;
