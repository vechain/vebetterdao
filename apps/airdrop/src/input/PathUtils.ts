// Get the path from an env variable or set current directory as default
export const BASE_PATH = process.env.INPUT_FILE_DIRECTORY ?? "."
export const parsePath = (file: string): string => BASE_PATH + "/" + file
