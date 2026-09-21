/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user?: import('./backend/types/user.types').UserSession | null
  }
}

declare module '*.astro' {
  const component: any
  export default component
}
