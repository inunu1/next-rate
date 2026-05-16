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

// Do not declare `module "next"` here — prefer official Next.js types when available.
// If you need router shims for environments without Next types, add targeted shims instead.
