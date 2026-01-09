import bcrypt from "bcrypt";
import { crud } from "./crud";

export async function createUser(data: any) {
  const hashed = await bcrypt.hash(data.password as string, 10);

  return crud.create("User", {
    name: data.name,
    email: data.email,
    hashedPassword: hashed,
  });
}