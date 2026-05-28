declare module 'bcryptjs' {
  export function compareSync(data: string | Buffer, encrypted: string): boolean;
  export function compare(data: string | Buffer, encrypted: string): Promise<boolean>;
  export function hashSync(data: string | Buffer, saltOrRounds: string | number): string;
  export function hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  export function genSaltSync(rounds?: number): string;
  export function genSalt(rounds?: number): Promise<string>;
  export function getRounds(encrypted: string): number;
  export function getSalt(encrypted: string): string;
  const bcrypt: {
    compareSync: typeof compareSync;
    compare: typeof compare;
    hashSync: typeof hashSync;
    hash: typeof hash;
    genSaltSync: typeof genSaltSync;
    genSalt: typeof genSalt;
    getRounds: typeof getRounds;
    getSalt: typeof getSalt;
  };
  export default bcrypt;
}
