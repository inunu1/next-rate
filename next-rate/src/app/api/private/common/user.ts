import bcrypt from "bcrypt";
import { crud, DataFields } from "./crud";

export async function createUser(data: DataFields) {
  const hashed = await bcrypt.hash(data.password as string, 10);

  return crud.create("User", {
    name: data.name,
    email: data.email,
    hashedPassword: hashed,
  });
}