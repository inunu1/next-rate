/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "next/link" {
  import * as React from "react";
  const Link: React.ComponentType<any>;
  export default Link;
}

declare module "next/server" {
  export const NextResponse: any;
  export const cookies: any;
  export const headers: any;
}

declare module "next" {
  const next: any;
  export default next;
}

declare module "next/router" {
  const router: any;
  export default router;
}
