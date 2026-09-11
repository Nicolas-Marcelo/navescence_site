
export function sleep(
  milliseconds: number
): Promise<void> {

  return new Promise(
    resolve => {

      setTimeout(
        resolve,
        milliseconds
      );

    }
  );

}


export function nowIso():
  string {

  return new Date()
    .toISOString();

}


export function nowPtBr():
  string {

  return new Date()
    .toLocaleString(
      "pt-BR"
    );

}