import bcrypt from "bcryptjs";

export const hashPin = (pin: string) => bcrypt.hash(pin, 10);
export const verifyPin = (pin: string, hash: string) => bcrypt.compare(pin, hash);
export const isValidPin = (pin: string) => /^\d{4,8}$/.test(pin);
