export type AccountSectionProps = {
   isAnonymous: boolean
   email: string | null
   isBusy: boolean
   onLink: () => void
   onSignIn: () => void
   onSignOut: () => void
}
