type ClassNameInput = string | { [key: string]: boolean };

export function classnames(...input: ClassNameInput[]) {
  const result: string[] = [];

  for (const name of input) {
    if (typeof name === "string") result.push(name);
    for (const [key, value] of Object.entries(name)) {
      if (!value) continue;
      result.push(key);
    }
  }

  return result.join(" ");
}
